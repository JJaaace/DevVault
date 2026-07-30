let memoryProjects = []
let nextMemoryProjectId = 1

let prisma = null

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
} catch (error) {
  prisma = null
}

const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']

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

function validateUrl(value, fieldName, errors) {
  if (value && !/^https?:\/\//i.test(value)) {
    errors[fieldName] = `${fieldName} must start with http:// or https://.`
  }
}

function validateProjectPayload(payload) {
  const errors = {}

  if (!payload.title || payload.title.trim().length < 3) {
    errors.title = 'Title is required.'
  }

  if (!payload.description || payload.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters long.'
  }

  if (!payload.status || !PROJECT_STATUSES.includes(payload.status)) {
    errors.status = 'Status must be one of Planning, In Progress, Completed, or Archived.'
  }

  const completionPercentage = normalizeInteger(payload.completionPercentage)
  if (completionPercentage === null || completionPercentage < 0 || completionPercentage > 100) {
    errors.completionPercentage = 'Completion percentage must be a number between 0 and 100.'
  }

  validateUrl(payload.githubUrl, 'githubUrl', errors)
  validateUrl(payload.liveDemoUrl, 'liveDemoUrl', errors)
  validateUrl(payload.bannerImageUrl || payload.bannerImage, 'bannerImageUrl', errors)

  if (payload.dateStarted && !normalizeDate(payload.dateStarted)) {
    errors.dateStarted = 'Date started must be a valid date.'
  }

  if (payload.targetCompletion && !normalizeDate(payload.targetCompletion)) {
    errors.targetCompletion = 'Target completion must be a valid date.'
  }

  return errors
}

function buildProjectPayload(payload, clerkUserId) {
  return {
    ownerClerkUserId: clerkUserId,
    title: payload.title.trim(),
    description: payload.description.trim(),
    githubUrl: normalizeText(payload.githubUrl),
    liveDemoUrl: normalizeText(payload.liveDemoUrl),
    bannerImageUrl: normalizeText(payload.bannerImageUrl || payload.bannerImage),
    techStack: normalizeList(payload.techStack),
    status: payload.status,
    completionPercentage: normalizeInteger(payload.completionPercentage) ?? 0,
    dateStarted: normalizeDate(payload.dateStarted),
    targetCompletion: normalizeDate(payload.targetCompletion),
    challenges: normalizeText(payload.challenges),
    lessonsLearned: normalizeText(payload.lessonsLearned),
  }
}

function findMemoryProject(projectId, clerkUserId) {
  return memoryProjects.find(
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
  if (!prisma) {
    return
  }

  await prisma.user.upsert({
    where: { clerkUserId },
    create: { clerkUserId },
    update: {},
  })
}

async function listProjects(clerkUserId) {
  if (prisma) {
    await ensureOwnerUser(clerkUserId)
    return prisma.project.findMany({
      where: { ownerClerkUserId: clerkUserId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  return memoryProjects
    .filter((project) => project.ownerClerkUserId === clerkUserId)
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
}

async function getProjectById(clerkUserId, projectId) {
  const id = Number(projectId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Project ID must be a valid number.')
  }

  if (prisma) {
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

  const data = buildProjectPayload(payload, clerkUserId)

  if (prisma) {
    await ensureOwnerUser(clerkUserId)

    return prisma.project.create({
      data,
    })
  }

  const project = {
    id: nextMemoryProjectId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  nextMemoryProjectId += 1
  memoryProjects.unshift(project)
  return project
}

async function updateProject(clerkUserId, projectId, payload) {
  const id = Number(projectId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Project ID must be a valid number.')
  }

  const errors = validateProjectPayload(payload)
  if (Object.keys(errors).length > 0) {
    throw createServiceError(400, 'Invalid project data.', errors)
  }

  const data = buildProjectPayload(payload, clerkUserId)

  if (prisma) {
    await ensureOwnerUser(clerkUserId)
    const existing = await prisma.project.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
    })

    if (!existing) {
      throw createServiceError(404, 'Project not found.')
    }

    return prisma.project.update({
      where: { id: existing.id },
      data,
    })
  }

  const existing = ensureProjectOwnership(findMemoryProject(id, clerkUserId), clerkUserId)

  const updatedProject = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  }

  memoryProjects = memoryProjects.map((project) => (project.id === id && project.ownerClerkUserId === clerkUserId ? updatedProject : project))
  return updatedProject
}

async function deleteProject(clerkUserId, projectId) {
  const id = Number(projectId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Project ID must be a valid number.')
  }

  if (prisma) {
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
  }

  ensureProjectOwnership(findMemoryProject(id, clerkUserId), clerkUserId)
  memoryProjects = memoryProjects.filter((project) => !(project.id === id && project.ownerClerkUserId === clerkUserId))
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