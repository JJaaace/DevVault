let prisma = null

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
} catch (error) {
  prisma = null
}

const { getLocalStore, updateLocalStore } = require('./localStore')

const PROJECT_STATUSES = ['PLANNING', 'BUILDING', 'COMPLETED', 'ARCHIVED']

function createServiceError(statusCode, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (details) {
    error.details = details
  }
  return error
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

function normalizeDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function resolveDisplayOrder(value, fallback = 0) {
  const normalized = normalizeInteger(value)
  if (normalized === null || normalized < 0) {
    return fallback
  }

  return normalized
}

function looksLikeDomainPath(value) {
  return /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(value)
}

function normalizeHttpUrl(value) {
  const normalized = normalizeText(value)
  if (!normalized) {
    return null
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  if (looksLikeDomainPath(normalized)) {
    return `https://${normalized}`
  }

  return normalized
}

function validateUrl(value, fieldName, errors) {
  const normalized = normalizeHttpUrl(value)
  if (normalized && !/^https?:\/\//i.test(normalized)) {
    errors[fieldName] = `${fieldName} must start with http:// or https://.`
  }
}

function validateImageReference(value, fieldName, errors) {
  if (!value) {
    return
  }

  const normalized = String(value).trim()
  if (!normalized) {
    return
  }

  const isHttpUrl = /^https?:\/\//i.test(normalized)
  const isLocalAssetPath = normalized.startsWith('/')
  const isDataOrBlob = /^(data:|blob:)/i.test(normalized)

  if (!isHttpUrl && !isLocalAssetPath && !isDataOrBlob) {
    errors[fieldName] = `${fieldName} must be an http(s) URL or a local asset path starting with /.`
  }
}

function validateProjectPayload(payload, options = {}) {
  const { partial = false } = options
  const errors = {}

  const displayOrder = normalizeInteger(payload.displayOrder)
  if (payload.displayOrder !== undefined && payload.displayOrder !== null && payload.displayOrder !== '' && (displayOrder === null || displayOrder < 0)) {
    errors.displayOrder = 'Display order must be a non-negative number.'
  }

  if ((!partial || payload.title !== undefined) && (!payload.title || payload.title.trim().length < 3)) {
    errors.title = 'Title is required.'
  }

  if ((!partial || payload.description !== undefined) && (!payload.description || payload.description.trim().length < 20)) {
    errors.description = 'Description must be at least 20 characters long.'
  }

  if ((!partial || payload.status !== undefined) && (!payload.status || !PROJECT_STATUSES.includes(payload.status))) {
    errors.status = 'Status must be one of Planning, Building, Completed, or Archived.'
  }

  validateUrl(payload.githubUrl, 'githubUrl', errors)
  validateUrl(payload.liveDemoUrl, 'liveDemoUrl', errors)
  validateImageReference(payload.image || payload.bannerImageUrl || payload.bannerImage, 'bannerImageUrl', errors)

  if (payload.dateStarted && !normalizeDate(payload.dateStarted)) {
    errors.dateStarted = 'Date started must be a valid date.'
  }

  if (payload.targetCompletion && !normalizeDate(payload.targetCompletion)) {
    errors.targetCompletion = 'Target completion must be a valid date.'
  }

  const keyFeatures = normalizeList(payload.keyFeatures)
  if (keyFeatures.some((feature) => feature.length > 120)) {
    errors.keyFeatures = 'Each key feature must be 120 characters or fewer.'
  }

  return errors
}

function buildProjectPayload(payload, clerkUserId) {
  return {
    ownerClerkUserId: clerkUserId,
    displayOrder: payload.displayOrder === undefined || payload.displayOrder === null || payload.displayOrder === ''
      ? null
      : resolveDisplayOrder(payload.displayOrder, 0),
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    githubRepoId: normalizeInteger(payload.githubRepoId),
    githubFullName: normalizeText(payload.githubFullName),
    githubDescription: normalizeText(payload.githubDescription),
    githubStars: normalizeInteger(payload.githubStars),
    githubForks: normalizeInteger(payload.githubForks),
    githubLanguages: normalizeList(payload.githubLanguages),
    githubTopics: normalizeList(payload.githubTopics),
    githubUrl: normalizeHttpUrl(payload.githubUrl),
    githubHomepage: normalizeHttpUrl(payload.githubHomepage),
    githubUpdatedAt: normalizeDate(payload.githubUpdatedAt),
    githubPushedAt: normalizeDate(payload.githubPushedAt),
    githubArchivedAt: normalizeDate(payload.githubArchivedAt),
    liveDemoUrl: normalizeHttpUrl(payload.liveDemoUrl),
    bannerImageUrl: normalizeText(payload.image || payload.bannerImageUrl || payload.bannerImage),
    accentTone: normalizeText(payload.accentTone),
    techStack: normalizeList(payload.techStack),
    keyFeatures: normalizeList(payload.keyFeatures),
    status: payload.status || 'PLANNING',
    dateStarted: normalizeDate(payload.dateStarted),
    targetCompletion: normalizeDate(payload.targetCompletion),
    challenges: normalizeText(payload.challenges),
    lessonsLearned: normalizeText(payload.lessonsLearned),
  }
}

function findMemoryProject(projectId, clerkUserId) {
  return getLocalStore().projects.find(
    (project) => project.id === projectId && project.ownerClerkUserId === clerkUserId,
  ) || null
}

function ensureProjectOwnership(project, clerkUserId) {
  if (!project || project.ownerClerkUserId !== clerkUserId) {
    throw createServiceError(404, 'Project not found.')
  }

  return project
}

function hasPrismaProjectAccess() {
  return Boolean(
    prisma
    && prisma.user
    && prisma.project
    && typeof prisma.user.upsert === 'function'
    && typeof prisma.project.findMany === 'function'
    && typeof prisma.project.findFirst === 'function'
    && typeof prisma.project.create === 'function'
    && typeof prisma.project.update === 'function'
    && typeof prisma.project.delete === 'function',
  )
}

async function ensureOwnerUser(clerkUserId) {
  if (!hasPrismaProjectAccess()) {
    return
  }

  await prisma.user.upsert({
    where: { clerkUserId },
    create: { clerkUserId },
    update: {},
  })
}

async function listProjects(clerkUserId) {
  if (hasPrismaProjectAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      return await prisma.project.findMany({
        where: { ownerClerkUserId: clerkUserId },
        orderBy: [
          { displayOrder: 'asc' },
          { updatedAt: 'desc' },
        ],
      })
    } catch {
      // fall through to local storage when Prisma is unavailable
    }
  }

  return getLocalStore().projects
    .filter((project) => project.ownerClerkUserId === clerkUserId)
    .sort((left, right) => {
      const leftOrder = Number.isInteger(left.displayOrder) ? left.displayOrder : Number.MAX_SAFE_INTEGER
      const rightOrder = Number.isInteger(right.displayOrder) ? right.displayOrder : Number.MAX_SAFE_INTEGER

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder
      }

      return new Date(right.updatedAt) - new Date(left.updatedAt)
    })
}

async function getProjectById(clerkUserId, projectId) {
  const id = Number(projectId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Project ID must be a valid number.')
  }

  if (hasPrismaProjectAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      const project = await prisma.project.findFirst({
        where: { id, ownerClerkUserId: clerkUserId },
      })

      if (!project) {
        throw createServiceError(404, 'Project not found.')
      }

      return project
    } catch (error) {
      if (error?.statusCode === 404) {
        throw error
      }

      // fall through to local storage when Prisma is unavailable
    }
  }

  return ensureProjectOwnership(findMemoryProject(id, clerkUserId), clerkUserId)
}

async function createProject(clerkUserId, payload) {
  const errors = validateProjectPayload(payload)
  if (Object.keys(errors).length > 0) {
    throw createServiceError(400, 'Invalid project data.', errors)
  }

  const data = buildProjectPayload(payload, clerkUserId)

  if (hasPrismaProjectAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)

      if (data.displayOrder === null) {
        const highestOrder = await prisma.project.findFirst({
          where: { ownerClerkUserId: clerkUserId },
          orderBy: { displayOrder: 'desc' },
          select: { displayOrder: true },
        })

        data.displayOrder = Number(highestOrder?.displayOrder || 0) + 1
      }

      return await prisma.project.create({
        data,
      })
    } catch {
      // fall through to local storage when Prisma is unavailable
    }
  }

  const store = getLocalStore()
  const nextDisplayOrder = data.displayOrder === null ? store.nextProjectId : data.displayOrder
  const project = {
    id: store.nextProjectId,
    ...data,
    displayOrder: nextDisplayOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  updateLocalStore((current) => ({
    ...current,
    nextProjectId: current.nextProjectId + 1,
    projects: [project, ...current.projects],
  }))
  return project
}

async function updateProject(clerkUserId, projectId, payload) {
  const id = Number(projectId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Project ID must be a valid number.')
  }

  const errors = validateProjectPayload(payload, { partial: true })
  if (Object.keys(errors).length > 0) {
    throw createServiceError(400, 'Invalid project data.', errors)
  }

  if (hasPrismaProjectAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      const existing = await prisma.project.findFirst({
        where: { id, ownerClerkUserId: clerkUserId },
      })

      if (!existing) {
        throw createServiceError(404, 'Project not found.')
      }

      const mergedPayload = {
        ...existing,
        ...payload,
      }
      const data = buildProjectPayload(mergedPayload, clerkUserId)

      return await prisma.project.update({
        where: { id: existing.id },
        data: {
          ...data,
          displayOrder: payload.displayOrder === undefined ? existing.displayOrder : data.displayOrder,
        },
      })
    } catch (error) {
      if (error?.statusCode === 404) {
        throw error
      }

      // fall through to local storage when Prisma is unavailable
    }
  }

  const existing = ensureProjectOwnership(findMemoryProject(id, clerkUserId), clerkUserId)
  const mergedPayload = {
    ...existing,
    ...payload,
  }
  const data = buildProjectPayload(mergedPayload, clerkUserId)

  const updatedProject = {
    ...existing,
    ...data,
    displayOrder: payload.displayOrder === undefined ? existing.displayOrder : data.displayOrder,
    updatedAt: new Date(),
  }

  updateLocalStore((current) => ({
    ...current,
    projects: current.projects.map((project) => (project.id === id && project.ownerClerkUserId === clerkUserId ? updatedProject : project)),
  }))
  return updatedProject
}

async function deleteProject(clerkUserId, projectId) {
  const id = Number(projectId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Project ID must be a valid number.')
  }

  if (hasPrismaProjectAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      const existing = await prisma.project.findFirst({
        where: { id, ownerClerkUserId: clerkUserId },
      })

      if (!existing) {
        throw createServiceError(404, 'Project not found.')
      }

      await prisma.project.delete({
        where: { id: existing.id },
      })

      return null
    } catch (error) {
      if (error?.statusCode === 404) {
        throw error
      }

      // fall through to local storage when Prisma is unavailable
    }
  }

  ensureProjectOwnership(findMemoryProject(id, clerkUserId), clerkUserId)
  updateLocalStore((current) => ({
    ...current,
    projects: current.projects.filter((project) => !(project.id === id && project.ownerClerkUserId === clerkUserId)),
  }))
  return null
}

module.exports = {
  PROJECT_STATUSES,
  createServiceError,
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
}