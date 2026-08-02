const crypto = require('crypto')
const { createProject, listProjects, updateProject } = require('./projectService')
const { getLocalStore, updateLocalStore } = require('./localStore')

let prisma = null
let prismaProfileFieldNames = null

try {
  const { PrismaClient, Prisma } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
  const profileModel = Prisma?.dmmf?.datamodel?.models?.find((model) => model.name === 'Profile')
  prismaProfileFieldNames = profileModel ? new Set(profileModel.fields.map((field) => field.name)) : null
} catch (error) {
  prisma = null
  prismaProfileFieldNames = null
}

const syncJobs = new Map()

function createSyncError(statusCode, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (details) {
    error.details = details
  }
  return error
}

function normalizeGitHubUsername(value) {
  if (!value || typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const sshMatch = trimmed.match(/github\.com:([^/]+)\//i)
  if (sshMatch?.[1]) {
    return sshMatch[1].replace(/\.$/, '')
  }

  try {
    const parsedUrl = new URL(trimmed)
    if (parsedUrl.hostname.toLowerCase().includes('github.com')) {
      const segments = parsedUrl.pathname.split('/').filter(Boolean)
      if (segments[0] === 'users' || segments[0] === 'orgs') {
        return (segments[1] || '').replace(/\.$/, '')
      }

      return (segments[0] || '').replace(/\.$/, '')
    }
  } catch {
    // fall through to path parsing
  }

  const pathMatch = trimmed.match(/github\.com\/(.+)$/i)
  if (pathMatch?.[1]) {
    const segments = pathMatch[1].split('/').filter(Boolean)
    if (segments[0] === 'users' || segments[0] === 'orgs') {
      return (segments[1] || '').replace(/\.$/, '')
    }

    return (segments[0] || '').replace(/\.$/, '')
  }

  return trimmed.replace(/^@/, '').replace(/\/$/, '').replace(/\.$/, '')
}

function getGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_ACCESS_TOKEN || ''
}

function getGitHubHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

async function fetchGitHubJson(url, { token, step } = {}) {
  const response = await fetch(url, {
    headers: getGitHubHeaders(token),
  })

  const contentType = response.headers.get('content-type') || ''
  const rawBody = await response.text()

  if (!response.ok) {
    let details = []
    let message = rawBody || `GitHub request failed with status ${response.status}`

    if (contentType.includes('application/json') && rawBody) {
      try {
        const parsed = JSON.parse(rawBody)
        message = parsed.message || message
        if (Array.isArray(parsed.errors)) {
          details = parsed.errors.map((entry) => {
            if (typeof entry === 'string') {
              return entry
            }

            if (entry && typeof entry === 'object') {
              return [entry.resource, entry.field, entry.code, entry.message].filter(Boolean).join(': ')
            }

            return String(entry)
          }).filter(Boolean)
        }
      } catch {
        // keep the raw response body
      }
    }

    const error = createSyncError(response.status, `GitHub request failed${step ? ` while ${step}` : ''}: ${message}`, details)
    error.githubStatus = response.status
    throw error
  }

  if (!rawBody) {
    return null
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(rawBody)
  }

  return rawBody
}

async function fetchGitHubProfile(username, token) {
  const normalized = normalizeGitHubUsername(username)
  if (!normalized) {
    throw createSyncError(400, 'GitHub username is required before synchronization can start.')
  }

  return fetchGitHubJson(`https://api.github.com/users/${encodeURIComponent(normalized)}`, {
    token,
    step: 'loading the GitHub profile',
  })
}

async function fetchAuthenticatedGitHubProfile(token) {
  return fetchGitHubJson('https://api.github.com/user', {
    token,
    step: 'loading the authenticated GitHub profile',
  })
}

function buildProfilePayloadFromGitHub(profile, githubUser, githubLastSyncedAt) {
  const nameParts = typeof githubUser?.name === 'string' ? githubUser.name.trim().split(/\s+/) : []
  const githubUrl = githubUser?.html_url || profile?.githubUrl || ''

  return {
    firstName: profile?.firstName || nameParts[0] || githubUser?.login || profile?.username || '',
    lastName: profile?.lastName || nameParts.slice(1).join(' ') || '',
    bio: githubUser?.bio || profile?.bio || '',
    profileImageUrl: githubUser?.avatar_url || profile?.profileImageUrl || profile?.profileImage || '',
    location: githubUser?.location || profile?.location || '',
    websiteUrl: githubUser?.blog || profile?.websiteUrl || '',
    githubUrl,
    githubLastSyncedAt,
  }
}

function hasPrismaProfileAccess() {
  return Boolean(
    prisma
    && prisma.profile
    && typeof prisma.profile.update === 'function'
    && typeof prisma.profile.findUnique === 'function',
  )
}

function mapProfilePayloadToActiveSchema(profilePayload) {
  if (!prismaProfileFieldNames) {
    return profilePayload
  }

  const mapped = { ...profilePayload }

  if (mapped.profileImageUrl && prismaProfileFieldNames.has('profileImage') && !prismaProfileFieldNames.has('profileImageUrl')) {
    mapped.profileImage = mapped.profileImageUrl
  }

  if (mapped.location && prismaProfileFieldNames.has('country') && !prismaProfileFieldNames.has('location')) {
    mapped.country = mapped.location
  }

  if (mapped.country && prismaProfileFieldNames.has('location') && !prismaProfileFieldNames.has('country')) {
    mapped.location = mapped.country
  }

  const filtered = {}
  for (const [key, value] of Object.entries(mapped)) {
    if (prismaProfileFieldNames.has(key) && value !== undefined) {
      filtered[key] = value
    }
  }

  return filtered
}

async function fetchGitHubRepos(username, token) {
  const normalized = normalizeGitHubUsername(username)
  if (!normalized) {
    throw createSyncError(400, 'GitHub username is required before synchronization can start.')
  }

  const repos = []
  const perPage = 100

  for (let page = 1; page <= 10; page += 1) {
    const batch = await fetchGitHubJson(
      `https://api.github.com/users/${encodeURIComponent(normalized)}/repos?per_page=${perPage}&page=${page}&sort=updated&type=owner`,
      {
        token,
        step: 'loading repositories from GitHub',
      },
    )

    if (!Array.isArray(batch) || !batch.length) {
      break
    }

    repos.push(...batch)

    if (batch.length < perPage) {
      break
    }
  }

  return repos
}

async function fetchRepositoryLanguages(repo, token) {
  if (!repo?.languages_url) {
    return []
  }

  const languages = await fetchGitHubJson(repo.languages_url, {
    token,
    step: `loading languages for ${repo.full_name}`,
  })

  return languages && typeof languages === 'object' ? Object.keys(languages) : []
}

function pickRepoDescription(repo, existingProject) {
  const cleanedDescription = typeof repo?.description === 'string' ? repo.description.trim() : ''
  if (cleanedDescription.length >= 20) {
    return cleanedDescription
  }

  if (cleanedDescription.length > 0) {
    return cleanedDescription
  }

  return existingProject?.description || 'Open-source project imported from GitHub.'
}

function buildProjectPayloadFromRepo(repo, languages, existingProject = {}) {
  const techStack = languages.length ? languages : [repo.language].filter(Boolean)
  const homepage = typeof repo.homepage === 'string' ? repo.homepage.trim() : ''
  const shouldRestoreActiveStatus = existingProject.status === 'ARCHIVED' && existingProject.githubArchivedAt

  return {
    title: repo.name,
    description: pickRepoDescription(repo, existingProject),
    githubRepoId: repo.id,
    githubFullName: repo.full_name,
    githubDescription: repo.description || '',
    githubStars: repo.stargazers_count || 0,
    githubForks: repo.forks_count || 0,
    githubLanguages: techStack,
    githubTopics: Array.isArray(repo.topics) ? repo.topics : [],
    githubUrl: repo.html_url,
    githubHomepage: homepage,
    githubUpdatedAt: repo.updated_at,
    githubPushedAt: repo.pushed_at,
    githubArchivedAt: repo.archived ? new Date().toISOString() : null,
    liveDemoUrl: homepage || existingProject.liveDemoUrl || '',
    bannerImageUrl: repo.owner?.avatar_url || existingProject.bannerImageUrl || '',
    techStack,
    status: repo.archived ? 'ARCHIVED' : (shouldRestoreActiveStatus ? 'PLANNING' : (existingProject.status || 'PLANNING')),
    dateStarted: existingProject.dateStarted || repo.created_at || null,
    targetCompletion: existingProject.targetCompletion || null,
    challenges: existingProject.challenges || '',
    lessonsLearned: existingProject.lessonsLearned || '',
  }
}

function normalizeComparableList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function datesEqual(left, right) {
  const leftTime = left ? new Date(left).getTime() : null
  const rightTime = right ? new Date(right).getTime() : null

  if (leftTime === null && rightTime === null) {
    return true
  }

  return leftTime === rightTime
}

function hasRepositoryChanged(existingProject, repo) {
  if (!existingProject) {
    return true
  }

  const nextHomepage = typeof repo.homepage === 'string' ? repo.homepage.trim() : ''
  const nextDescription = pickRepoDescription(repo, existingProject)
  const nextTopics = normalizeComparableList(Array.isArray(repo.topics) ? repo.topics : [])
  const currentTopics = normalizeComparableList(existingProject.githubTopics || [])

  return (
    existingProject.githubRepoId !== repo.id
    || existingProject.githubFullName !== repo.full_name
    || existingProject.title !== repo.name
    || (existingProject.description || '') !== nextDescription
    || (existingProject.githubDescription || '') !== (repo.description || '')
    || Number(existingProject.githubStars || 0) !== Number(repo.stargazers_count || 0)
    || Number(existingProject.githubForks || 0) !== Number(repo.forks_count || 0)
    || existingProject.githubHomepage !== nextHomepage
    || existingProject.githubUrl !== repo.html_url
    || !datesEqual(existingProject.githubUpdatedAt, repo.updated_at)
    || !datesEqual(existingProject.githubPushedAt, repo.pushed_at)
    || Boolean(existingProject.githubArchivedAt) !== Boolean(repo.archived)
    || currentTopics.length !== nextTopics.length
    || currentTopics.some((topic, index) => topic !== nextTopics[index])
  )
}

function buildArchivedProjectPayload(existingProject) {
  return {
    title: existingProject.title,
    description: existingProject.description || 'Archived because the GitHub repository is no longer available.',
    githubRepoId: existingProject.githubRepoId,
    githubFullName: existingProject.githubFullName,
    githubDescription: existingProject.githubDescription || '',
    githubStars: existingProject.githubStars || 0,
    githubForks: existingProject.githubForks || 0,
    githubLanguages: existingProject.githubLanguages || existingProject.techStack || [],
    githubTopics: existingProject.githubTopics || [],
    githubUrl: existingProject.githubUrl || '',
    githubHomepage: existingProject.githubHomepage || existingProject.liveDemoUrl || '',
    githubUpdatedAt: existingProject.githubUpdatedAt || existingProject.updatedAt || null,
    githubPushedAt: existingProject.githubPushedAt || existingProject.updatedAt || null,
    githubArchivedAt: new Date().toISOString(),
    liveDemoUrl: existingProject.liveDemoUrl || '',
    bannerImageUrl: existingProject.bannerImageUrl || '',
    techStack: existingProject.githubLanguages || existingProject.techStack || [],
    status: 'ARCHIVED',
    dateStarted: existingProject.dateStarted || null,
    targetCompletion: existingProject.targetCompletion || null,
    challenges: existingProject.challenges || '',
    lessonsLearned: existingProject.lessonsLearned || '',
  }
}

async function loadProfile(clerkUserId) {
  if (prisma) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { clerkUserId },
      })

      if (profile) {
        return profile
      }
    } catch (error) {
      // fall through to local storage
    }
  }

  return getLocalStore().profiles.find((profile) => profile.clerkUserId === clerkUserId) || null
}

function getActiveGitHubSyncJob(clerkUserId) {
  const latestActiveJob = [...syncJobs.values()]
    .filter((job) => job.clerkUserId === clerkUserId && (job.status === 'queued' || job.status === 'running'))
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))[0]

  return latestActiveJob ? createJobSnapshot(latestActiveJob) : null
}

async function saveProfileSyncMetadata(clerkUserId, githubLastSyncedAt) {
  if (hasPrismaProfileAccess()) {
    try {
      if (prismaProfileFieldNames?.has('githubLastSyncedAt')) {
        await prisma.profile.update({
          where: { clerkUserId },
          data: { githubLastSyncedAt },
        })
      }
      return
    } catch (error) {
      // fall through to local storage
    }
  }

  updateLocalStore((store) => ({
    ...store,
    profiles: store.profiles.map((profile) => (
      profile.clerkUserId === clerkUserId
        ? { ...profile, githubLastSyncedAt }
        : profile
    )),
  }))
}

async function saveSyncedProfile(clerkUserId, profilePayload) {
  if (hasPrismaProfileAccess()) {
    try {
      await prisma.profile.update({
        where: { clerkUserId },
        data: mapProfilePayloadToActiveSchema(profilePayload),
      })
      return prisma.profile.findUnique({ where: { clerkUserId } })
    } catch (error) {
      // fall through to local storage
    }
  }

  let nextProfile = null
  updateLocalStore((store) => {
    const existingProfile = store.profiles.find((profile) => profile.clerkUserId === clerkUserId)
    if (!existingProfile) {
      throw createSyncError(404, 'Profile not found for synchronization.')
    }

    nextProfile = {
      ...existingProfile,
      ...profilePayload,
    }

    return {
      ...store,
      profiles: store.profiles.map((profile) => (
        profile.clerkUserId === clerkUserId ? nextProfile : profile
      )),
    }
  })

  return nextProfile
}

function createJobSnapshot(job) {
  return {
    syncId: job.syncId,
    clerkUserId: job.clerkUserId,
    status: job.status,
    progress: job.progress,
    step: job.step,
    message: job.message,
    summary: job.summary,
    errors: job.errors,
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    result: job.result,
    error: job.error,
  }
}

function updateJob(syncId, patch) {
  const current = syncJobs.get(syncId)
  if (!current) {
    return null
  }

  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  syncJobs.set(syncId, next)
  return next
}

async function runGitHubSync(syncId) {
  const job = syncJobs.get(syncId)
  if (!job) {
    return
  }

  try {
    updateJob(syncId, {
      status: 'running',
      progress: 5,
      step: 'Resolving GitHub profile',
      message: 'Loading the linked GitHub account.',
    })

    const profile = await loadProfile(job.clerkUserId)
    if (!profile) {
      throw createSyncError(404, 'Profile not found for synchronization.')
    }

    const githubToken = getGitHubToken()
    const githubUsername = normalizeGitHubUsername(profile.githubUrl)

    if (!githubUsername && !githubToken) {
      throw createSyncError(400, 'Add a GitHub profile URL before syncing or configure a GitHub token on the server.')
    }

    const githubUser = githubToken
      ? await fetchAuthenticatedGitHubProfile(githubToken)
      : await fetchGitHubProfile(githubUsername, githubToken)

    const syncSource = githubToken && githubUser?.login ? githubUser.login : githubUsername
    if (!syncSource) {
      throw createSyncError(400, 'Unable to resolve a GitHub username for synchronization.')
    }

    const syncedAt = new Date().toISOString()
    const syncedProfilePayload = buildProfilePayloadFromGitHub(profile, githubUser, syncedAt)

    updateJob(syncId, {
      progress: 20,
      step: 'Loading repositories',
      message: `Fetching repositories for ${syncSource}.`,
    })

    const repositories = await fetchGitHubRepos(syncSource, githubToken)

    updateJob(syncId, {
      progress: 40,
      step: 'Preparing repository metadata',
      message: `Preparing ${repositories.length} repository${repositories.length === 1 ? '' : 'ies'} for import.`,
    })

    const currentProjects = await listProjects(job.clerkUserId)
    const repoProjects = currentProjects.filter((project) => project.githubRepoId || project.githubFullName || project.githubUrl)
    const projectByRepoId = new Map(repoProjects.filter((project) => project.githubRepoId).map((project) => [project.githubRepoId, project]))
    const projectByFullName = new Map(repoProjects.filter((project) => project.githubFullName).map((project) => [project.githubFullName.toLowerCase(), project]))
    const projectByUrl = new Map(repoProjects.filter((project) => project.githubUrl).map((project) => [project.githubUrl, project]))

    const seenProjectIds = new Set()
    const repoSummaries = []
    const errors = []

    for (let index = 0; index < repositories.length; index += 1) {
      const repo = repositories[index]
      try {
        const existingProject = projectByRepoId.get(repo.id)
          || projectByFullName.get(String(repo.full_name || '').toLowerCase())
          || projectByUrl.get(repo.html_url)

        if (existingProject && !hasRepositoryChanged(existingProject, repo)) {
          seenProjectIds.add(existingProject.id)
          updateJob(syncId, {
            progress: 40 + Math.round(((index + 1) / Math.max(repositories.length, 1)) * 45),
            step: 'Synchronizing repositories',
            message: `Checked ${index + 1} of ${repositories.length} repositories.`,
          })
          continue
        }

        const languages = await fetchRepositoryLanguages(repo, githubToken)

        const projectPayload = buildProjectPayloadFromRepo(repo, languages, existingProject || {})

        if (existingProject) {
          seenProjectIds.add(existingProject.id)
          await updateProject(job.clerkUserId, existingProject.id, projectPayload)
          repoSummaries.push({ action: 'updated', repo: repo.full_name })
        } else {
          const createdProject = await createProject(job.clerkUserId, projectPayload)
          seenProjectIds.add(createdProject.id)
          repoSummaries.push({ action: 'created', repo: repo.full_name })
        }

        const progress = 40 + Math.round(((index + 1) / Math.max(repositories.length, 1)) * 45)
        updateJob(syncId, {
          progress,
          step: 'Synchronizing repositories',
          message: `Synced ${index + 1} of ${repositories.length} repositories.`,
        })
      } catch (repoError) {
        errors.push(`Failed to sync ${repo.full_name || repo.name}: ${repoError.message}`)
      }
    }

    const missingProjects = repoProjects.filter((project) => !seenProjectIds.has(project.id) && project.status !== 'ARCHIVED')

    updateJob(syncId, {
      progress: 90,
      step: 'Archiving missing repositories',
      message: missingProjects.length
        ? `Archiving ${missingProjects.length} repository${missingProjects.length === 1 ? '' : 'ies'} that no longer exist on GitHub.`
        : 'No archived repositories detected.',
    })

    for (const project of missingProjects) {
      try {
        await updateProject(job.clerkUserId, project.id, buildArchivedProjectPayload(project))
        repoSummaries.push({ action: 'archived', repo: project.githubFullName || project.githubUrl || project.title })
      } catch (archiveError) {
        errors.push(`Failed to archive ${project.title}: ${archiveError.message}`)
      }
    }

    const syncedProfile = await saveSyncedProfile(job.clerkUserId, syncedProfilePayload)

    await saveProfileSyncMetadata(job.clerkUserId, syncedAt)

    updateJob(syncId, {
      status: errors.length ? 'completed' : 'completed',
      progress: 100,
      step: 'Sync complete',
      message: errors.length
        ? `Completed with ${errors.length} warning${errors.length === 1 ? '' : 's'}.`
        : 'GitHub synchronization finished successfully.',
      summary: {
        imported: repoSummaries.filter((item) => item.action === 'created').length,
        updated: repoSummaries.filter((item) => item.action === 'updated').length,
        archived: repoSummaries.filter((item) => item.action === 'archived').length,
        total: repositories.length,
        githubUsername: syncSource,
        githubLastSyncedAt: syncedAt,
      },
      result: {
        profile: syncedProfile,
      },
      errors,
      completedAt: syncedAt,
      error: null,
    })

    if (errors.length) {
      updateJob(syncId, {
        message: `Completed with ${errors.length} warning${errors.length === 1 ? '' : 's'}.`,
      })
    }
  } catch (error) {
    updateJob(syncId, {
      status: 'failed',
      progress: Math.max(job.progress || 0, 5),
      step: error.step || 'GitHub sync failed',
      message: error.message || 'Unable to synchronize GitHub data.',
      error: error.message || 'Unable to synchronize GitHub data.',
      errors: Array.isArray(error.details) && error.details.length ? error.details : job.errors,
      completedAt: new Date().toISOString(),
    })
  }
}

function startGitHubSync(clerkUserId) {
  const activeJob = getActiveGitHubSyncJob(clerkUserId)
  if (activeJob) {
    return activeJob
  }

  const syncId = crypto.randomUUID()
  const job = {
    syncId,
    clerkUserId,
    status: 'queued',
    progress: 0,
    step: 'Queued',
    message: 'Preparing GitHub synchronization.',
    summary: null,
    errors: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    result: null,
    error: null,
  }

  syncJobs.set(syncId, job)
  setImmediate(() => {
    runGitHubSync(syncId).catch((error) => {
      updateJob(syncId, {
        status: 'failed',
        progress: 100,
        step: 'GitHub sync failed',
        message: error.message || 'Unable to synchronize GitHub data.',
        error: error.message || 'Unable to synchronize GitHub data.',
        errors: Array.isArray(error.details) ? error.details : [],
        completedAt: new Date().toISOString(),
      })
    })
  })

  return createJobSnapshot(job)
}

function getGitHubSync(syncId, clerkUserId) {
  const job = syncJobs.get(syncId)
  if (!job || job.clerkUserId !== clerkUserId) {
    return null
  }

  return createJobSnapshot(job)
}

function getGitHubSyncState(clerkUserId) {
  return getActiveGitHubSyncJob(clerkUserId)
}

module.exports = {
  startGitHubSync,
  getGitHubSync,
  getGitHubSyncState,
  getActiveGitHubSyncJob,
}