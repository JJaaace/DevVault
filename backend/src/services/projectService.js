const { prisma } = require('../db/prisma')
const { isPostgresMode } = require('../config/persistence')
const { getLocalStore, updateLocalStore } = require('./localStore')

const PROJECT_STATUSES = ['PLANNING', 'BUILDING', 'COMPLETED', 'ARCHIVED']
const ARTWORK_SOURCES = ['NONE', 'GITHUB', 'CATALOG', 'IMPORTED', 'CURATED']
const GITHUB_PROJECT_METADATA_FIELDS = Object.freeze([
  'githubRepoId',
  'githubFullName',
  'githubDescription',
  'githubStars',
  'githubForks',
  'githubLanguages',
  'githubTopics',
  'githubUrl',
  'githubHomepage',
  'githubUpdatedAt',
  'githubPushedAt',
  'githubArchivedAt',
])

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

  if (payload.bannerImageSource !== undefined && !ARTWORK_SOURCES.includes(payload.bannerImageSource)) {
    errors.bannerImageSource = 'Artwork source is invalid.'
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

function buildProjectPayload(payload, clerkUserId, options = {}) {
  const hasBannerInput = payload.image !== undefined || payload.bannerImageUrl !== undefined || payload.bannerImage !== undefined
  const bannerImageUrl = normalizeText(payload.image || payload.bannerImageUrl || payload.bannerImage)
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
    bannerImageUrl,
    bannerImageSource: bannerImageUrl
      ? (payload.bannerImageSource || (hasBannerInput && options.userInitiated ? 'CURATED' : 'GITHUB'))
      : 'NONE',
    accentTone: normalizeText(payload.accentTone),
    techStack: normalizeList(payload.techStack),
    keyFeatures: normalizeList(payload.keyFeatures),
    status: payload.status || 'PLANNING',
    dateStarted: normalizeDate(payload.dateStarted),
    targetCompletion: normalizeDate(payload.targetCompletion),
    challenges: normalizeText(payload.challenges),
    lessonsLearned: normalizeText(payload.lessonsLearned),
    publicVisible: payload.publicVisible === undefined ? true : Boolean(payload.publicVisible),
    featured: Boolean(payload.featured),
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

async function ensureOwnerUser(clerkUserId) {
  if (!isPostgresMode()) {
    return
  }
  await prisma.user.upsert({
    where: { clerkUserId },
    create: { clerkUserId },
    update: {},
  })
}

async function listProjects(clerkUserId, { publicOnly = false } = {}) {
  if (isPostgresMode()) {
    await ensureOwnerUser(clerkUserId)
    return prisma.project.findMany({
      where: { ownerClerkUserId: clerkUserId, ...(publicOnly ? { publicVisible: true } : {}) },
      orderBy: [
        { displayOrder: 'asc' },
        { updatedAt: 'desc' },
      ],
    })
  }

  return getLocalStore().projects
    .filter((project) => project.ownerClerkUserId === clerkUserId && (!publicOnly || project.publicVisible))
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

  if (isPostgresMode()) {
    await ensureOwnerUser(clerkUserId)
    const project = await prisma.project.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
    })

    if (!project) {
      throw createServiceError(404, 'Project not found.')
    }

    return project
  }

  return ensureProjectOwnership(findMemoryProject(id, clerkUserId), clerkUserId)
}

async function createProject(clerkUserId, payload) {
  const errors = validateProjectPayload(payload)
  if (Object.keys(errors).length > 0) {
    throw createServiceError(400, 'Invalid project data.', errors)
  }

  const data = buildProjectPayload(payload, clerkUserId, { userInitiated: true })

  if (isPostgresMode()) {
    await ensureOwnerUser(clerkUserId)

    if (data.displayOrder === null) {
      const highestOrder = await prisma.project.findFirst({
        where: { ownerClerkUserId: clerkUserId },
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      })

      data.displayOrder = Number(highestOrder?.displayOrder || 0) + 1
    }

    return prisma.$transaction(async (transaction) => {
      if (data.featured) {
        await transaction.project.updateMany({ where: { ownerClerkUserId: clerkUserId, featured: true }, data: { featured: false } })
      }
      return transaction.project.create({ data })
    })
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

  if (isPostgresMode()) {
    await ensureOwnerUser(clerkUserId)
    const existing = await prisma.project.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
    })

    if (!existing) {
      throw createServiceError(404, 'Project not found.')
    }

    const mergedPayload = { ...existing, ...payload }
    const data = buildProjectPayload(mergedPayload, clerkUserId, { userInitiated: true })

    return prisma.$transaction(async (transaction) => {
      if (data.featured && !existing.featured) {
        await transaction.project.updateMany({ where: { ownerClerkUserId: clerkUserId, featured: true }, data: { featured: false } })
      }
      return transaction.project.update({
        where: { id: existing.id },
        data: {
          ...data,
          bannerImageSource: payload.image === undefined && payload.bannerImageUrl === undefined && payload.bannerImage === undefined ? existing.bannerImageSource : data.bannerImageSource,
          displayOrder: payload.displayOrder === undefined ? existing.displayOrder : data.displayOrder,
          publicVisible: payload.publicVisible === undefined ? existing.publicVisible : data.publicVisible,
          featured: payload.featured === undefined ? existing.featured : data.featured,
        },
      })
    })
  }

  const existing = ensureProjectOwnership(findMemoryProject(id, clerkUserId), clerkUserId)
  const mergedPayload = {
    ...existing,
    ...payload,
  }
  const data = buildProjectPayload(mergedPayload, clerkUserId, { userInitiated: true })

  const updatedProject = {
    ...existing,
    ...data,
    displayOrder: payload.displayOrder === undefined ? existing.displayOrder : data.displayOrder,
    bannerImageSource: payload.image === undefined && payload.bannerImageUrl === undefined && payload.bannerImage === undefined ? existing.bannerImageSource : data.bannerImageSource,
    publicVisible: payload.publicVisible === undefined ? existing.publicVisible : data.publicVisible,
    featured: payload.featured === undefined ? existing.featured : data.featured,
    updatedAt: new Date(),
  }

  updateLocalStore((current) => ({
    ...current,
    projects: current.projects.map((project) => (project.id === id && project.ownerClerkUserId === clerkUserId ? updatedProject : project)),
  }))
  return updatedProject
}

function normalizeGitHubMetadata(payload) {
  const data = {}
  const assign = (field, value) => {
    if (value !== undefined) data[field] = value
  }

  if (payload.githubRepoId !== undefined) assign('githubRepoId', payload.githubRepoId === null ? null : normalizeInteger(payload.githubRepoId))
  if (payload.githubFullName !== undefined) assign('githubFullName', payload.githubFullName === null ? null : normalizeText(payload.githubFullName))
  if (payload.githubDescription !== undefined) assign('githubDescription', payload.githubDescription === null ? null : normalizeText(payload.githubDescription))
  if (payload.githubStars !== undefined) assign('githubStars', payload.githubStars === null ? null : normalizeInteger(payload.githubStars))
  if (payload.githubForks !== undefined) assign('githubForks', payload.githubForks === null ? null : normalizeInteger(payload.githubForks))
  if (payload.githubLanguages !== undefined) assign('githubLanguages', normalizeList(payload.githubLanguages))
  if (payload.githubTopics !== undefined) assign('githubTopics', normalizeList(payload.githubTopics))
  if (payload.githubUrl !== undefined) assign('githubUrl', payload.githubUrl === null ? null : normalizeHttpUrl(payload.githubUrl))
  if (payload.githubHomepage !== undefined) assign('githubHomepage', payload.githubHomepage === null ? null : normalizeHttpUrl(payload.githubHomepage))
  if (payload.githubUpdatedAt !== undefined) assign('githubUpdatedAt', payload.githubUpdatedAt === null ? null : normalizeDate(payload.githubUpdatedAt))
  if (payload.githubPushedAt !== undefined) assign('githubPushedAt', payload.githubPushedAt === null ? null : normalizeDate(payload.githubPushedAt))
  if (payload.githubArchivedAt !== undefined) assign('githubArchivedAt', payload.githubArchivedAt === null ? null : normalizeDate(payload.githubArchivedAt))

  return Object.fromEntries(
    Object.entries(data).filter(([field]) => GITHUB_PROJECT_METADATA_FIELDS.includes(field)),
  )
}

async function updateGitHubProjectMetadata(clerkUserId, projectId, payload) {
  const id = Number(projectId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Project ID must be a valid number.')
  }

  const data = normalizeGitHubMetadata(payload)
  if (!Object.keys(data).length) {
    return getProjectById(clerkUserId, id)
  }

  if (isPostgresMode()) {
    await ensureOwnerUser(clerkUserId)
    const existing = await prisma.project.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
      select: { id: true },
    })
    if (!existing) throw createServiceError(404, 'Project not found.')
    return prisma.project.update({ where: { id }, data })
  }

  const existing = ensureProjectOwnership(findMemoryProject(id, clerkUserId), clerkUserId)
  const updatedProject = { ...existing, ...data, updatedAt: new Date() }
  updateLocalStore((current) => ({
    ...current,
    projects: current.projects.map((project) => (
      project.id === id && project.ownerClerkUserId === clerkUserId ? updatedProject : project
    )),
  }))
  return updatedProject
}

async function deleteProject(clerkUserId, projectId) {
  const id = Number(projectId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Project ID must be a valid number.')
  }

  if (isPostgresMode()) {
    await ensureOwnerUser(clerkUserId)
    const existing = await prisma.project.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
    })

    if (!existing) {
      throw createServiceError(404, 'Project not found.')
    }

    await prisma.project.delete({ where: { id: existing.id } })
    return null
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
  GITHUB_PROJECT_METADATA_FIELDS,
  createServiceError,
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  updateGitHubProjectMetadata,
  deleteProject,
  __test: { normalizeGitHubMetadata },
}
