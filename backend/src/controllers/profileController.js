const { prisma } = require('../db/prisma')
const { isPostgresMode } = require('../config/persistence')
const { getLocalStore, updateLocalStore } = require('../services/localStore')
const { getGitHubSyncState } = require('../services/githubSyncService')
const { sendSuccess, sendCreated, sendNoContent, sendError } = require('../utils/http')

function validateProfilePayload(payload) {
  const errors = {}

  const isHttpUrl = (value) => !value || /^https?:\/\//i.test(value)
  const isImageDataUrl = (value) => !value || /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(value)
  const isInteger = (value) => value === undefined || value === null || value === '' || Number.isInteger(Number(value))

  if (!payload.firstName || payload.firstName.trim().length < 2) {
    errors.firstName = 'First name is required.'
  }

  if (!payload.lastName || payload.lastName.trim().length < 2) {
    errors.lastName = 'Last name is required.'
  }

  if (!payload.username || payload.username.trim().length < 2) {
    errors.username = 'Username is required.'
  }

  if (!payload.bio || payload.bio.trim().length < 10) {
    errors.bio = 'Bio must be at least 10 characters long.'
  }

  if (!isHttpUrl(payload.profileImageUrl) && !isImageDataUrl(payload.profileImageUrl)) {
    errors.profileImageUrl = 'Profile image must be a valid upload or image URL.'
  }

  if (!isHttpUrl(payload.githubUrl)) {
    errors.githubUrl = 'GitHub URL must start with http:// or https://.'
  }

  if (!isHttpUrl(payload.linkedinUrl)) {
    errors.linkedinUrl = 'LinkedIn URL must start with http:// or https://.'
  }

  if (!isHttpUrl(payload.websiteUrl)) {
    errors.websiteUrl = 'Website URL must start with http:// or https://.'
  }

  if (!isHttpUrl(payload.twitterUrl)) {
    errors.twitterUrl = 'Twitter/X URL must start with http:// or https://.'
  }

  if (!isInteger(payload.graduationYear)) {
    errors.graduationYear = 'Graduation year must be a number.'
  }

  if (!isInteger(payload.yearsCoding)) {
    errors.yearsCoding = 'Years coding must be a number.'
  }

  return errors
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function validateProfileImage(profileImageUrl) {
  if (!profileImageUrl) {
    return null
  }

  if (typeof profileImageUrl !== 'string' || !/^data:image\/(png|jpe?g|webp);base64,/i.test(profileImageUrl)) {
    return 'Profile image must be a PNG, JPG, JPEG, or WEBP upload.'
  }

  if (profileImageUrl.length > 10 * 1024 * 1024) {
    return 'Profile image must be 7MB or smaller.'
  }

  return null
}

function buildProfilePayload(payload, clerkUserId) {
  return {
    clerkUserId,
    username: payload.username.trim(),
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    bio: payload.bio.trim(),
    profileImageUrl: normalizeText(payload.profileImageUrl || payload.profileImage),
    school: normalizeText(payload.school || payload.university),
    graduationYear: normalizeInteger(payload.graduationYear),
    major: normalizeText(payload.major),
    location: normalizeText(payload.location || [payload.city, payload.state, payload.country].filter(Boolean).join(', ')),
    dreamCompanies: normalizeList(payload.dreamCompanies),
    currentRole: normalizeText(payload.currentRole),
    favoriteLanguage: normalizeText(payload.favoriteLanguage),
    favoriteFramework: normalizeText(payload.favoriteFramework),
    yearsCoding: normalizeInteger(payload.yearsCoding),
    interests: normalizeList(payload.interests),
    tagline: normalizeText(payload.tagline),
    pronouns: normalizeText(payload.pronouns),
    openToWork: Boolean(payload.openToWork),
    jobType: normalizeText(payload.jobType),
    githubUrl: normalizeText(payload.githubUrl),
    linkedinUrl: normalizeText(payload.linkedinUrl),
    websiteUrl: normalizeText(payload.websiteUrl),
    twitterUrl: normalizeText(payload.twitterUrl),
    portfolioEnabled: payload.portfolioEnabled === undefined ? true : Boolean(payload.portfolioEnabled),
    currentFocus: normalizeText(payload.currentFocus),
  }
}

function buildProfileUpdatePayload(payload, clerkUserId) {
  const { profileImageUrl: ignoredProfileImage, ...profileData } = buildProfilePayload(payload, clerkUserId)
  return profileData
}

function findMemoryProfile(clerkUserId) {
  return getLocalStore().profiles.find((profile) => profile.clerkUserId === clerkUserId) || null
}

function findMemoryProfileByUsername(username) {
  return getLocalStore().profiles.find((profile) => profile.username === username) || null
}

function isEmbeddedImage(value) {
  return typeof value === 'string' && /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(value)
}

function serializeOwnerProfile(profile) {
  if (!profile) return null
  return {
    ...profile,
    profileImageUrl: isEmbeddedImage(profile.profileImageUrl)
      ? `/api/profile/image?v=${new Date(profile.updatedAt).getTime() || Date.now()}`
      : profile.profileImageUrl,
  }
}

function serializePublicProfile(profile) {
  if (!profile) {
    return null
  }

  return {
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio,
    profileImageUrl: isEmbeddedImage(profile.profileImageUrl)
      ? `/api/public/portfolio/${encodeURIComponent(profile.username)}/profile-image?v=${new Date(profile.updatedAt).getTime() || Date.now()}`
      : profile.profileImageUrl,
    school: profile.school,
    graduationYear: profile.graduationYear,
    major: profile.major,
    location: profile.location,
    currentRole: profile.currentRole,
    favoriteLanguage: profile.favoriteLanguage,
    favoriteFramework: profile.favoriteFramework,
    yearsCoding: profile.yearsCoding,
    interests: profile.interests,
    tagline: profile.tagline,
    pronouns: profile.pronouns,
    openToWork: profile.openToWork,
    jobType: profile.jobType,
    currentFocus: profile.currentFocus,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    websiteUrl: profile.websiteUrl,
    twitterUrl: profile.twitterUrl,
    updatedAt: profile.updatedAt,
  }
}

function serializePublicProject(project, username) {
  return {
    id: project.id,
    displayOrder: project.displayOrder,
    title: project.title,
    description: project.description,
    githubUrl: project.githubUrl,
    githubDescription: project.githubDescription,
    githubStars: project.githubStars,
    githubForks: project.githubForks,
    githubLanguages: project.githubLanguages,
    githubTopics: project.githubTopics,
    liveDemoUrl: project.liveDemoUrl,
    bannerImageUrl: isEmbeddedImage(project.bannerImageUrl)
      ? `/api/public/portfolio/${encodeURIComponent(username)}/projects/${project.id}/artwork`
      : project.bannerImageUrl,
    bannerImageSource: project.bannerImageSource,
    accentTone: project.accentTone,
    techStack: project.techStack,
    keyFeatures: project.keyFeatures,
    status: project.status,
    dateStarted: project.dateStarted,
    featured: project.featured,
  }
}

function serializePublicSkill(skill) {
  return {
    id: skill.id,
    name: skill.name,
    technologyKey: skill.technologyKey,
    category: skill.category,
    experienceLevel: skill.experienceLevel,
    yearsExperience: skill.yearsExperience,
    firstUsedYear: skill.firstUsedYear,
    projectsBuilt: skill.projectsBuilt,
    favorite: Boolean(skill.favorite),
    color: skill.color,
    lastUsed: skill.lastUsed,
    relatedProjects: (skill.relatedProjects || []).map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      featured: project.featured,
    })),
  }
}

function serializePublicGoal(goal) {
  return {
    id: goal.id,
    title: goal.title,
    category: goal.category,
    status: goal.status,
    targetCompletion: goal.targetCompletion,
    description: goal.description,
    relatedProjectNames: goal.relatedProjectNames || [],
    relatedCertificationNames: goal.relatedCertificationNames || [],
    relatedTechnologies: goal.relatedTechnologies || [],
  }
}

function serializePublicCertification(certification, username) {
  const hasAsset = Boolean(certification.assetType)
  return {
    id: certification.id,
    name: certification.name,
    organization: certification.organization,
    provider: certification.provider,
    status: certification.status,
    issueDate: certification.issueDate,
    year: certification.year,
    credentialId: certification.credentialId,
    credentialUrl: certification.credentialUrl,
    verifyUrl: certification.verifyUrl,
    logo: certification.logo,
    accentColor: certification.accentColor,
    skillsGained: certification.skillsGained || [],
    technologies: certification.technologies || [],
    associatedProjects: certification.associatedProjects || [],
    featured: certification.featured,
    displayOrder: certification.displayOrder,
    assetType: certification.assetType,
    assetUrl: hasAsset ? `/api/public/portfolio/${encodeURIComponent(username)}/certifications/${certification.id}/asset` : null,
  }
}

async function getPublicPortfolio(req, res) {
  try {
    res.set('Cache-Control', 'no-store')
    const username = typeof req.params.username === 'string' ? req.params.username.trim() : ''

    if (username.length < 2) {
      return sendError(res, {
        statusCode: 400,
        code: 'USERNAME_REQUIRED',
        message: 'Username is required.',
      }, 'USERNAME_REQUIRED', 'Username is required.')
    }

    const profile = isPostgresMode()
      ? await prisma.profile.findUnique({ where: { username } })
      : findMemoryProfileByUsername(username)

    if (!profile || !profile.portfolioEnabled) {
      return sendError(res, {
        statusCode: 404,
        code: 'PORTFOLIO_NOT_FOUND',
        message: 'Portfolio not found.',
      }, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.')
    }

    const { listProjects } = require('../services/projectService')
    const { listSkills } = require('../services/skillService')
    const { listGoals } = require('../services/goalService')
    const { listCertifications } = require('../services/certificationService')
    const { getResumeMetadata } = require('../services/resumeService')

    const [projects, skills, goals, certifications, resume] = await Promise.all([
      listProjects(profile.clerkUserId, { publicOnly: true }),
      listSkills(profile.clerkUserId, { publicOnly: true }),
      listGoals(profile.clerkUserId, { publicOnly: true }),
      listCertifications(profile.clerkUserId, { publicOnly: true }),
      getResumeMetadata(profile.clerkUserId),
    ])

    return sendSuccess(res, {
      profile: serializePublicProfile(profile),
      projects: projects.filter((project) => project.status !== 'ARCHIVED').map((project) => serializePublicProject(project, profile.username)),
      skills: skills.map(serializePublicSkill),
      goals: goals.map(serializePublicGoal),
      certifications: certifications.map((certification) => serializePublicCertification(certification, profile.username)),
      resume: resume.uploaded ? {
        uploaded: true,
        fileName: resume.fileName,
        lastUpdated: resume.lastUpdated,
        byteSize: resume.byteSize,
        fileUrl: `/api/public/portfolio/${encodeURIComponent(profile.username)}/resume?v=${new Date(resume.lastUpdated).getTime() || Date.now()}`,
      } : { uploaded: false, fileName: null, lastUpdated: null, byteSize: 0, fileUrl: null },
    })
  } catch (error) {
    return sendError(res, error, 'PORTFOLIO_GET_FAILED', 'Unable to load portfolio.')
  }
}

async function getPublicResume(req, res) {
  try {
    const username = String(req.params.username || '').trim()
    const profile = isPostgresMode() ? await prisma.profile.findUnique({ where: { username } }) : findMemoryProfileByUsername(username)
    if (!profile || !profile.portfolioEnabled) {
      return sendError(res, { statusCode: 404, message: 'Resume not found.' }, 'PUBLIC_RESUME_NOT_FOUND', 'Resume not found.')
    }
    const { getResumeFileInfo } = require('../services/resumeService')
    const file = await getResumeFileInfo(profile.clerkUserId)
    const safeFileName = String(file.fileName || 'resume.pdf').replace(/[\r\n"]/g, '')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', String(file.content.length))
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`)
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    return res.status(200).send(file.content)
  } catch (error) {
    return sendError(res, error, 'PUBLIC_RESUME_GET_FAILED', 'Unable to load public resume.')
  }
}

async function getPublicCertificationAsset(req, res) {
  try {
    const username = typeof req.params.username === 'string' ? req.params.username.trim() : ''
    const profile = isPostgresMode()
      ? await prisma.profile.findUnique({ where: { username } })
      : findMemoryProfileByUsername(username)

    if (!profile || !profile.portfolioEnabled) {
      return sendError(res, { statusCode: 404, message: 'Certificate asset not found.' }, 'CERTIFICATION_ASSET_NOT_FOUND', 'Certificate asset not found.')
    }

    const { getPublicCertificationAsset: loadAsset } = require('../services/certificationService')
    const file = await loadAsset(profile.clerkUserId, req.params.certificationId)
    const canPreviewInline = file.mimeType === 'application/pdf' || /^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.mimeType)
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Length', String(file.content.length))
    res.setHeader('Content-Disposition', `${canPreviewInline ? 'inline' : 'attachment'}; filename="${String(file.fileName).replace(/[\r\n"]/g, '')}"`)
    return res.status(200).send(file.content)
  } catch (error) {
    return sendError(res, error, 'CERTIFICATION_ASSET_GET_FAILED', 'Unable to load certificate asset.')
  }
}

function sendEmbeddedImage(res, dataUrl, fallbackName, cacheControl = 'private, max-age=300') {
  const match = String(dataUrl || '').match(/^data:(image\/(?:png|jpe?g|webp|gif|avif));base64,([A-Za-z0-9+/=\s]+)$/i)
  if (!match) {
    return sendError(res, { statusCode: 404, message: 'Public image not found.' }, 'PUBLIC_IMAGE_NOT_FOUND', 'Public image not found.')
  }
  const content = Buffer.from(match[2].replace(/\s+/g, ''), 'base64')
  res.setHeader('Content-Type', match[1].toLowerCase())
  res.setHeader('Content-Length', String(content.length))
  res.setHeader('Content-Disposition', `inline; filename="${fallbackName}"`)
  res.setHeader('Cache-Control', cacheControl)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  return res.status(200).send(content)
}

async function getPublicProfileImage(req, res) {
  try {
    const username = String(req.params.username || '').trim()
    const profile = isPostgresMode() ? await prisma.profile.findUnique({ where: { username } }) : findMemoryProfileByUsername(username)
    if (!profile || !profile.portfolioEnabled) return sendError(res, { statusCode: 404, message: 'Public image not found.' }, 'PUBLIC_IMAGE_NOT_FOUND', 'Public image not found.')
    return sendEmbeddedImage(res, profile.profileImageUrl, 'profile-image', 'public, max-age=300')
  } catch (error) {
    return sendError(res, error, 'PUBLIC_IMAGE_GET_FAILED', 'Unable to load public image.')
  }
}

async function getPublicProjectArtwork(req, res) {
  try {
    const username = String(req.params.username || '').trim()
    const profile = isPostgresMode() ? await prisma.profile.findUnique({ where: { username } }) : findMemoryProfileByUsername(username)
    if (!profile || !profile.portfolioEnabled) return sendError(res, { statusCode: 404, message: 'Public image not found.' }, 'PUBLIC_IMAGE_NOT_FOUND', 'Public image not found.')
    const { listProjects } = require('../services/projectService')
    const project = (await listProjects(profile.clerkUserId, { publicOnly: true })).find((item) => String(item.id) === String(req.params.projectId) && item.status !== 'ARCHIVED')
    if (!project) return sendError(res, { statusCode: 404, message: 'Public image not found.' }, 'PUBLIC_IMAGE_NOT_FOUND', 'Public image not found.')
    return sendEmbeddedImage(res, project.bannerImageUrl, `project-${project.id}`, 'public, max-age=300')
  } catch (error) {
    return sendError(res, error, 'PUBLIC_IMAGE_GET_FAILED', 'Unable to load public image.')
  }
}

async function getProfileImage(req, res) {
  try {
    const profile = isPostgresMode()
      ? await prisma.profile.findUnique({ where: { clerkUserId: req.auth.userId } })
      : findMemoryProfile(req.auth.userId)
    if (!profile) return sendError(res, { statusCode: 404, message: 'Profile image not found.' }, 'PROFILE_IMAGE_NOT_FOUND', 'Profile image not found.')
    return sendEmbeddedImage(res, profile.profileImageUrl, 'profile-image')
  } catch (error) {
    return sendError(res, error, 'PROFILE_IMAGE_GET_FAILED', 'Unable to load profile picture.')
  }
}

async function getProfile(req, res) {
  try {
    const githubSyncState = getGitHubSyncState(req.auth.userId)

    const profile = isPostgresMode()
      ? await prisma.profile.findUnique({ where: { clerkUserId: req.auth.userId } })
      : findMemoryProfile(req.auth.userId)
    if (!profile) {
      return sendError(res, {
        statusCode: 404,
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found.',
      }, 'PROFILE_NOT_FOUND', 'Profile not found.')
    }

    return sendSuccess(res, {
      ...serializeOwnerProfile(profile),
      githubSyncState,
    })
  } catch (error) {
    return sendError(res, error, 'PROFILE_GET_FAILED', 'Unable to load profile.')
  }
}

async function createProfile(req, res) {
  try {
    const errors = validateProfilePayload(req.body)
    if (Object.keys(errors).length > 0) {
      return sendError(res, {
        statusCode: 400,
        code: 'PROFILE_VALIDATION_FAILED',
        message: 'Invalid profile data.',
        details: errors,
      }, 'PROFILE_VALIDATION_FAILED', 'Invalid profile data.')
    }

    if (isPostgresMode()) {
      const existing = await prisma.profile.findUnique({
        where: { clerkUserId: req.auth.userId },
      })

      if (existing) {
        return sendError(res, {
          statusCode: 409,
          code: 'PROFILE_EXISTS',
          message: 'Profile already exists.',
        }, 'PROFILE_EXISTS', 'Profile already exists.')
      }

      const profile = await prisma.profile.create({
        data: buildProfilePayload(req.body, req.auth.userId),
      })
      return sendCreated(res, serializeOwnerProfile(profile))
    }

    if (findMemoryProfile(req.auth.userId)) {
      return sendError(res, {
        statusCode: 409,
        code: 'PROFILE_EXISTS',
        message: 'Profile already exists.',
      }, 'PROFILE_EXISTS', 'Profile already exists.')
    }

    const usernameOwner = findMemoryProfileByUsername(req.body.username.trim())
    if (usernameOwner) {
      return sendError(res, {
        statusCode: 409,
        code: 'USERNAME_TAKEN',
        message: 'Username is already in use.',
      }, 'USERNAME_TAKEN', 'Username is already in use.')
    }

    const profile = buildProfilePayload(req.body, req.auth.userId)
    updateLocalStore((store) => ({
      ...store,
      profiles: [...store.profiles, profile],
    }))
    return sendCreated(res, serializeOwnerProfile(profile))
  } catch (error) {
    return sendError(res, error, 'PROFILE_CREATE_FAILED', 'Unable to create profile.')
  }
}

async function updateProfile(req, res) {
  try {
    const errors = validateProfilePayload(req.body)
    if (Object.keys(errors).length > 0) {
      return sendError(res, {
        statusCode: 400,
        code: 'PROFILE_VALIDATION_FAILED',
        message: 'Invalid profile data.',
        details: errors,
      }, 'PROFILE_VALIDATION_FAILED', 'Invalid profile data.')
    }

    if (isPostgresMode()) {
      const existing = await prisma.profile.findUnique({
        where: { clerkUserId: req.auth.userId },
      })

      if (!existing) {
        return sendError(res, {
          statusCode: 404,
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found.',
        }, 'PROFILE_NOT_FOUND', 'Profile not found.')
      }

      const profile = await prisma.profile.update({
        where: { clerkUserId: req.auth.userId },
        data: buildProfileUpdatePayload(req.body, req.auth.userId),
      })
      return sendSuccess(res, serializeOwnerProfile(profile))
    }

    const existing = findMemoryProfile(req.auth.userId)
    if (!existing) {
      return sendError(res, {
        statusCode: 404,
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found.',
      }, 'PROFILE_NOT_FOUND', 'Profile not found.')
    }

    const usernameOwner = findMemoryProfileByUsername(req.body.username.trim())
    if (usernameOwner && usernameOwner.clerkUserId !== req.auth.userId) {
      return sendError(res, {
        statusCode: 409,
        code: 'USERNAME_TAKEN',
        message: 'Username is already in use.',
      }, 'USERNAME_TAKEN', 'Username is already in use.')
    }

    const updatedProfile = {
      ...existing,
      ...buildProfileUpdatePayload(req.body, req.auth.userId),
    }

    updateLocalStore((store) => ({
      ...store,
      profiles: store.profiles.map((profile) =>
        profile.clerkUserId === req.auth.userId ? updatedProfile : profile,
      ),
    }))

    return sendSuccess(res, serializeOwnerProfile(updatedProfile))
  } catch (error) {
    return sendError(res, error, 'PROFILE_UPDATE_FAILED', 'Unable to update profile.')
  }
}

async function updateProfileImage(req, res) {
  try {
    const profileImageUrl = typeof req.body?.profileImageUrl === 'string' ? req.body.profileImageUrl.trim() : ''
    const validationError = validateProfileImage(profileImageUrl)

    if (validationError) {
      return sendError(res, {
        statusCode: 400,
        code: 'PROFILE_IMAGE_VALIDATION_FAILED',
        message: validationError,
        details: { profileImageUrl: validationError },
      }, 'PROFILE_IMAGE_VALIDATION_FAILED', validationError)
    }

    if (isPostgresMode()) {
      const existing = await prisma.profile.findUnique({ where: { clerkUserId: req.auth.userId } })
      if (!existing) {
        return sendError(res, {
          statusCode: 404,
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found.',
        }, 'PROFILE_NOT_FOUND', 'Profile not found.')
      }

      const profile = await prisma.profile.update({
        where: { clerkUserId: req.auth.userId },
        data: { profileImageUrl: profileImageUrl || null },
      })
      return sendSuccess(res, serializeOwnerProfile(profile))
    }

    const existing = findMemoryProfile(req.auth.userId)
    if (!existing) {
      return sendError(res, {
        statusCode: 404,
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found.',
      }, 'PROFILE_NOT_FOUND', 'Profile not found.')
    }

    const updatedProfile = { ...existing, profileImageUrl: profileImageUrl || null, updatedAt: new Date() }
    updateLocalStore((store) => ({
      ...store,
      profiles: store.profiles.map((profile) => profile.clerkUserId === req.auth.userId ? updatedProfile : profile),
    }))
    return sendSuccess(res, serializeOwnerProfile(updatedProfile))
  } catch (error) {
    return sendError(res, error, 'PROFILE_IMAGE_UPDATE_FAILED', 'Unable to save profile picture.')
  }
}

async function deleteProfile(req, res) {
  try {
    if (isPostgresMode()) {
      const existing = await prisma.profile.findUnique({
        where: { clerkUserId: req.auth.userId },
      })

      if (!existing) {
        return sendError(res, {
          statusCode: 404,
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found.',
        }, 'PROFILE_NOT_FOUND', 'Profile not found.')
      }

      await prisma.profile.delete({ where: { clerkUserId: req.auth.userId } })
      return sendNoContent(res)
    }

    const existing = findMemoryProfile(req.auth.userId)
    if (!existing) {
      return sendError(res, {
        statusCode: 404,
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found.',
      }, 'PROFILE_NOT_FOUND', 'Profile not found.')
    }

    updateLocalStore((store) => ({
      ...store,
      profiles: store.profiles.filter((profile) => profile.clerkUserId !== req.auth.userId),
    }))
    return sendNoContent(res)
  } catch (error) {
    return sendError(res, error, 'PROFILE_DELETE_FAILED', 'Unable to delete profile.')
  }
}

module.exports = {
  getProfile,
  getPublicPortfolio,
  getPublicCertificationAsset,
  getPublicProfileImage,
  getProfileImage,
  getPublicProjectArtwork,
  getPublicResume,
  createProfile,
  updateProfile,
  updateProfileImage,
  deleteProfile,
  validateProfileImage,
  buildProfilePayload,
  buildProfileUpdatePayload,
  serializeOwnerProfile,
}
