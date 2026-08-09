const crypto = require('crypto')
const { prisma } = require('../db/prisma')
const { isPostgresMode } = require('../config/persistence')
const { listProjects, updateGitHubProjectMetadata } = require('./projectService')
const { getLocalStore } = require('./localStore')
const { environment } = require('../config/environment')
const { logger } = require('../utils/logger')

const syncJobs = new Map()
const MAX_FINISHED_SYNC_JOBS = 200

function createSyncError(statusCode, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (details) error.details = details
  return error
}

function normalizeGitHubUsername(value) {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''

  const sshMatch = trimmed.match(/github\.com:([^/]+)\//i)
  if (sshMatch?.[1]) return sshMatch[1].replace(/\.$/, '')

  try {
    const parsedUrl = new URL(trimmed)
    if (parsedUrl.hostname.toLowerCase().includes('github.com')) {
      const segments = parsedUrl.pathname.split('/').filter(Boolean)
      return ((segments[0] === 'users' || segments[0] === 'orgs') ? segments[1] : segments[0] || '').replace(/\.$/, '')
    }
  } catch {
    // Accept a plain GitHub username below.
  }

  return trimmed.replace(/^@/, '').replace(/\/$/, '').replace(/\.$/, '')
}

function getGitHubToken() {
  return environment.githubToken
}

function getGitHubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function fetchGitHubJson(url, { token, step } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  let response
  try {
    response = await fetch(url, { headers: getGitHubHeaders(token), signal: controller.signal })
  } catch (error) {
    if (error?.name === 'AbortError') throw createSyncError(504, `GitHub request timed out${step ? ` while ${step}` : ''}.`)
    throw createSyncError(502, `GitHub is unavailable${step ? ` while ${step}` : ''}.`)
  } finally {
    clearTimeout(timeout)
  }
  const contentType = response.headers.get('content-type') || ''
  const rawBody = await response.text()

  if (!response.ok) {
    let message = rawBody || `GitHub request failed with status ${response.status}`
    let details = []
    if (contentType.includes('application/json') && rawBody) {
      try {
        const parsed = JSON.parse(rawBody)
        message = parsed.message || message
        details = Array.isArray(parsed.errors) ? parsed.errors.map((entry) => (
          typeof entry === 'string' ? entry : [entry.resource, entry.field, entry.code, entry.message].filter(Boolean).join(': ')
        )).filter(Boolean) : []
      } catch {
        // Keep GitHub's raw error message.
      }
    }
    throw createSyncError(response.status, `GitHub request failed${step ? ` while ${step}` : ''}: ${message}`, details)
  }

  if (!rawBody) return null
  return contentType.includes('application/json') ? JSON.parse(rawBody) : rawBody
}

async function fetchGitHubRepos(username, token) {
  const normalized = normalizeGitHubUsername(username)
  if (!normalized) throw createSyncError(400, 'Add a GitHub profile URL before syncing projects.')

  const repositories = []
  for (let page = 1; page <= 10; page += 1) {
    const batch = await fetchGitHubJson(
      `https://api.github.com/users/${encodeURIComponent(normalized)}/repos?per_page=100&page=${page}&sort=updated&type=owner`,
      { token, step: 'loading repositories' },
    )
    if (!Array.isArray(batch) || !batch.length) break
    repositories.push(...batch)
    if (batch.length < 100) break
  }
  return repositories
}

async function fetchRepositoryLanguages(repo, token) {
  if (!repo?.languages_url) return [repo?.language].filter(Boolean)
  const languages = await fetchGitHubJson(repo.languages_url, {
    token,
    step: `loading languages for ${repo.full_name}`,
  })
  return languages && typeof languages === 'object' ? Object.keys(languages) : []
}

function cleanString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function buildGitHubProjectMetadata(repo, languages) {
  const metadata = {}
  if (Number.isInteger(repo?.id)) metadata.githubRepoId = repo.id
  if (cleanString(repo?.full_name)) metadata.githubFullName = cleanString(repo.full_name)
  if (cleanString(repo?.description)) metadata.githubDescription = cleanString(repo.description)
  if (repo?.stargazers_count !== undefined && Number.isFinite(Number(repo.stargazers_count))) metadata.githubStars = Number(repo.stargazers_count)
  if (repo?.forks_count !== undefined && Number.isFinite(Number(repo.forks_count))) metadata.githubForks = Number(repo.forks_count)
  if (languages !== undefined) metadata.githubLanguages = [...new Set((languages || []).filter(Boolean))]
  if (Array.isArray(repo?.topics)) metadata.githubTopics = [...new Set(repo.topics.filter(Boolean))]
  if (cleanString(repo?.html_url)) metadata.githubUrl = cleanString(repo.html_url)
  if (cleanString(repo?.homepage)) metadata.githubHomepage = cleanString(repo.homepage)
  if (cleanString(repo?.updated_at)) metadata.githubUpdatedAt = cleanString(repo.updated_at)
  if (cleanString(repo?.pushed_at)) metadata.githubPushedAt = cleanString(repo.pushed_at)
  if (repo?.archived === true) metadata.githubArchivedAt = cleanString(repo.updated_at) || new Date().toISOString()
  if (repo?.archived === false) metadata.githubArchivedAt = null
  return metadata
}

function normalizeComparable(value) {
  if (Array.isArray(value)) return [...value].map(String).sort().join('\u0000')
  if (value instanceof Date) return value.toISOString()
  if (value && /At$/.test(String(value))) return new Date(value).toISOString()
  return value ?? null
}

function hasGitHubMetadataChanged(project, metadata) {
  return Object.entries(metadata).some(([field, value]) => {
    if (field.endsWith('At')) {
      const currentTime = project[field] ? new Date(project[field]).getTime() : null
      const nextTime = value ? new Date(value).getTime() : null
      return currentTime !== nextTime
    }
    return normalizeComparable(project[field]) !== normalizeComparable(value)
  })
}

function findLinkedProject(projects, repo) {
  const repoId = Number(repo?.id)
  const fullName = cleanString(repo?.full_name)?.toLowerCase()
  const url = cleanString(repo?.html_url)?.replace(/\/$/, '').toLowerCase()
  return projects.find((project) => Number(project.githubRepoId) === repoId)
    || projects.find((project) => fullName && cleanString(project.githubFullName)?.toLowerCase() === fullName)
    || projects.find((project) => url && cleanString(project.githubUrl)?.replace(/\/$/, '').toLowerCase() === url)
    || null
}

function createImportCandidate(repo) {
  return {
    githubRepoId: Number.isInteger(repo?.id) ? repo.id : null,
    name: cleanString(repo?.name),
    githubFullName: cleanString(repo?.full_name),
    githubDescription: cleanString(repo?.description),
    githubUrl: cleanString(repo?.html_url),
    githubHomepage: cleanString(repo?.homepage),
    githubStars: Number(repo?.stargazers_count || 0),
    githubForks: Number(repo?.forks_count || 0),
    githubTopics: Array.isArray(repo?.topics) ? repo.topics : [],
    primaryLanguage: cleanString(repo?.language),
    archived: Boolean(repo?.archived),
  }
}

function planProjectSync(projects, repositories) {
  const linkedProjectIds = new Set()
  const linkedRepositories = []
  const importCandidates = []

  for (const repo of repositories) {
    const project = findLinkedProject(projects, repo)
    if (!project) {
      importCandidates.push(createImportCandidate(repo))
      continue
    }
    linkedProjectIds.add(project.id)
    linkedRepositories.push({ project, repo })
  }

  const unavailable = projects
    .filter((project) => project.githubRepoId || project.githubFullName || project.githubUrl)
    .filter((project) => !linkedProjectIds.has(project.id))
    .map((project) => ({ projectId: project.id, title: project.title, githubFullName: project.githubFullName }))

  return { linkedRepositories, importCandidates, unavailable }
}

async function loadGitHubAccount(clerkUserId) {
  if (isPostgresMode()) {
    return prisma.profile.findUnique({ where: { clerkUserId }, select: { githubUrl: true } })
  }
  const profile = getLocalStore().profiles.find((item) => item.clerkUserId === clerkUserId)
  return profile ? { githubUrl: profile.githubUrl } : null
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

function pruneFinishedSyncJobs() {
  const finished = [...syncJobs.values()]
    .filter((job) => ['completed', 'failed'].includes(job.status))
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
  for (const job of finished.slice(MAX_FINISHED_SYNC_JOBS)) syncJobs.delete(job.syncId)
}

function updateJob(syncId, patch) {
  const current = syncJobs.get(syncId)
  if (!current) return null
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
  syncJobs.set(syncId, next)
  if (['completed', 'failed'].includes(next.status)) pruneFinishedSyncJobs()
  return next
}

function getActiveGitHubSyncJob(clerkUserId) {
  const job = [...syncJobs.values()]
    .filter((item) => item.clerkUserId === clerkUserId && ['queued', 'running'].includes(item.status))
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))[0]
  return job ? createJobSnapshot(job) : null
}

async function runGitHubSync(syncId) {
  const job = syncJobs.get(syncId)
  if (!job) return

  try {
    updateJob(syncId, { status: 'running', progress: 8, step: 'Resolving GitHub account', message: 'Reading the GitHub URL from your profile. Profile data will not be changed.' })
    const account = await loadGitHubAccount(job.clerkUserId)
    if (!account) throw createSyncError(404, 'Profile not found for project synchronization.')
    const username = normalizeGitHubUsername(account.githubUrl)
    if (!username) throw createSyncError(400, 'Add a GitHub profile URL before syncing projects.')

    updateJob(syncId, { progress: 22, step: 'Loading repositories', message: `Fetching repositories for ${username}.` })
    const token = getGitHubToken()
    const repositories = await fetchGitHubRepos(username, token)
    const projects = await listProjects(job.clerkUserId)
    const plan = planProjectSync(projects, repositories)
    const errors = []
    let refreshed = 0
    let unchanged = 0

    for (let index = 0; index < plan.linkedRepositories.length; index += 1) {
      const { project, repo } = plan.linkedRepositories[index]
      try {
        let languages
        try {
          languages = await fetchRepositoryLanguages(repo, token)
        } catch (error) {
          errors.push(`Languages were not refreshed for ${repo.full_name}: ${error.message}`)
        }

        const metadata = buildGitHubProjectMetadata(repo, languages)
        if (hasGitHubMetadataChanged(project, metadata)) {
          await updateGitHubProjectMetadata(job.clerkUserId, project.id, metadata)
          refreshed += 1
        } else {
          unchanged += 1
        }
      } catch (error) {
        errors.push(`Metadata was not refreshed for ${repo.full_name}: ${error.message}`)
      }

      updateJob(syncId, {
        progress: 35 + Math.round(((index + 1) / Math.max(plan.linkedRepositories.length, 1)) * 55),
        step: 'Refreshing linked projects',
        message: `Checked ${index + 1} of ${plan.linkedRepositories.length} linked project${plan.linkedRepositories.length === 1 ? '' : 's'}.`,
      })
    }

    const completedAt = new Date().toISOString()
    const summary = {
      refreshed,
      unchanged,
      available: plan.importCandidates.length,
      unavailable: plan.unavailable.length,
      totalRepositories: repositories.length,
      githubUsername: username,
      completedAt,
    }
    updateJob(syncId, {
      status: 'completed',
      progress: 100,
      step: 'Project sync complete',
      message: errors.length
        ? `GitHub projects refreshed with ${errors.length} warning${errors.length === 1 ? '' : 's'}. Your curated data was preserved.`
        : 'GitHub project metadata refreshed. Your profile and curated project fields were not changed.',
      summary,
      errors,
      result: { importCandidates: plan.importCandidates, unavailableRepositories: plan.unavailable },
      completedAt,
      error: null,
    })
  } catch (error) {
    logger.warn('github.sync.failed', {
      syncId,
      statusCode: error.statusCode,
      message: error.message,
    })
    updateJob(syncId, {
      status: 'failed',
      progress: Math.max(syncJobs.get(syncId)?.progress || 0, 5),
      step: 'GitHub project sync failed',
      message: error.message || 'Unable to refresh GitHub project metadata.',
      error: error.message || 'Unable to refresh GitHub project metadata.',
      errors: Array.isArray(error.details) ? error.details : [],
      completedAt: new Date().toISOString(),
    })
  }
}

function startGitHubSync(clerkUserId) {
  const activeJob = getActiveGitHubSyncJob(clerkUserId)
  if (activeJob) return activeJob

  const now = new Date().toISOString()
  const syncId = crypto.randomUUID()
  const job = {
    syncId,
    clerkUserId,
    status: 'queued',
    progress: 0,
    step: 'Queued',
    message: 'Preparing a project-only GitHub sync.',
    summary: null,
    errors: [],
    startedAt: now,
    updatedAt: now,
    completedAt: null,
    result: null,
    error: null,
  }
  syncJobs.set(syncId, job)
  setImmediate(() => runGitHubSync(syncId))
  return createJobSnapshot(job)
}

function getGitHubSync(syncId, clerkUserId) {
  const job = syncJobs.get(syncId)
  return job && job.clerkUserId === clerkUserId ? createJobSnapshot(job) : null
}

function getGitHubSyncState(clerkUserId) {
  return getActiveGitHubSyncJob(clerkUserId)
}

module.exports = {
  startGitHubSync,
  getGitHubSync,
  getGitHubSyncState,
  getActiveGitHubSyncJob,
  __test: {
    normalizeGitHubUsername,
    buildGitHubProjectMetadata,
    hasGitHubMetadataChanged,
    findLinkedProject,
    createImportCandidate,
    planProjectSync,
  },
}
