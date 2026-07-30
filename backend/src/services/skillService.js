const { listProjects } = require('./projectService')

let memorySkills = []
let nextMemorySkillId = 1

let prisma = null

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
} catch (error) {
  prisma = null
}

const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

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

function normalizeInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function normalizeIdList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeInteger(item)).filter((item) => item !== null))]
  }

  if (typeof value === 'string') {
    return [...new Set(
      value
        .split(/[,\n]/)
        .map((item) => normalizeInteger(item.trim()))
        .filter((item) => item !== null),
    )]
  }

  return []
}

function normalizeDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isHexColor(value) {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value.trim())
}

function validateSkillPayload(payload) {
  const errors = {}

  if (!payload.name || payload.name.trim().length < 2) {
    errors.name = 'Name is required.'
  }

  if (!payload.category || payload.category.trim().length < 2) {
    errors.category = 'Category is required.'
  }

  if (!payload.experienceLevel || !SKILL_LEVELS.includes(payload.experienceLevel)) {
    errors.experienceLevel = 'Experience level must be beginner, intermediate, advanced, or expert.'
  }

  const percentage = normalizeInteger(payload.percentage)
  if (percentage === null || percentage < 0 || percentage > 100) {
    errors.percentage = 'Percentage must be a number between 0 and 100.'
  }

  if (!isHexColor(payload.color)) {
    errors.color = 'Color must be a valid hex value like #ea8b21.'
  }

  if (payload.lastUsed && !normalizeDate(payload.lastUsed)) {
    errors.lastUsed = 'Last used must be a valid date.'
  }

  return errors
}

function buildSkillPayload(payload, clerkUserId) {
  return {
    ownerClerkUserId: clerkUserId,
    name: payload.name.trim(),
    category: payload.category.trim(),
    experienceLevel: payload.experienceLevel,
    percentage: normalizeInteger(payload.percentage) ?? 0,
    color: payload.color.trim(),
    lastUsed: normalizeDate(payload.lastUsed),
    notes: normalizeText(payload.notes),
  }
}

function attachRelatedProjectIds(skill, relatedProjects) {
  const relatedProjectIds = relatedProjects.map((item) => item.projectId)
  return {
    ...skill,
    relatedProjectIds,
    relatedProjects: relatedProjects.map((item) => item.project),
  }
}

function enrichMemorySkills(skills, projects) {
  const projectById = new Map(projects.map((project) => [project.id, project]))

  return skills.map((skill) => {
    const relatedProjects = (skill.relatedProjectIds || [])
      .map((projectId) => projectById.get(projectId))
      .filter(Boolean)

    return {
      ...skill,
      relatedProjects,
    }
  })
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

async function resolveRelatedProjects(clerkUserId, relatedProjectIds) {
  if (!relatedProjectIds.length) {
    return []
  }

  const projects = await listProjects(clerkUserId)
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const relatedProjects = relatedProjectIds.map((projectId) => projectById.get(projectId)).filter(Boolean)

  if (relatedProjects.length !== relatedProjectIds.length) {
    throw createServiceError(400, 'One or more related projects were not found.')
  }

  return relatedProjects
}

async function listSkills(clerkUserId) {
  if (prisma) {
    await ensureOwnerUser(clerkUserId)
    const skills = await prisma.skill.findMany({
      where: { ownerClerkUserId: clerkUserId },
      include: { relatedProjects: { include: { project: true } } },
      orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
    })

    return skills.map((skill) => attachRelatedProjectIds(skill, skill.relatedProjects))
  }

  const projects = await listProjects(clerkUserId)
  return enrichMemorySkills(
    memorySkills
      .filter((skill) => skill.ownerClerkUserId === clerkUserId)
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)),
    projects,
  )
}

async function getSkillById(clerkUserId, skillId) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  if (prisma) {
    await ensureOwnerUser(clerkUserId)
    const skill = await prisma.skill.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
      include: { relatedProjects: { include: { project: true } } },
    })

    if (!skill) {
      throw createServiceError(404, 'Skill not found.')
    }

    return attachRelatedProjectIds(skill, skill.relatedProjects)
  }

  const projects = await listProjects(clerkUserId)
  const skill = memorySkills.find((item) => item.id === id && item.ownerClerkUserId === clerkUserId)
  if (!skill) {
    throw createServiceError(404, 'Skill not found.')
  }

  return enrichMemorySkills([skill], projects)[0]
}

async function createSkill(clerkUserId, payload) {
  const errors = validateSkillPayload(payload)
  if (Object.keys(errors).length > 0) {
    throw createServiceError(400, 'Invalid skill data.', errors)
  }

  const relatedProjectIds = normalizeIdList(payload.relatedProjectIds)
  await resolveRelatedProjects(clerkUserId, relatedProjectIds)

  const data = buildSkillPayload(payload, clerkUserId)

  if (prisma) {
    await ensureOwnerUser(clerkUserId)
    const skill = await prisma.skill.create({
      data: {
        ...data,
        relatedProjects: {
          create: relatedProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
        },
      },
      include: { relatedProjects: { include: { project: true } } },
    })

    return attachRelatedProjectIds(skill, skill.relatedProjects)
  }

const projectList = await listProjects(clerkUserId)
  const relatedProjects = enrichMemorySkills(
    relatedProjectIds.map((projectId) => ({ projectId })),
    projectList,
  )

  const skill = {
    id: nextMemorySkillId,
    ...data,
    relatedProjectIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  nextMemorySkillId += 1
  memorySkills.unshift(skill)
  return enrichMemorySkills([skill], projectList)[0]
}

async function updateSkill(clerkUserId, skillId, payload) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  const errors = validateSkillPayload(payload)
  if (Object.keys(errors).length > 0) {
    throw createServiceError(400, 'Invalid skill data.', errors)
  }

  const relatedProjectIds = normalizeIdList(payload.relatedProjectIds)
  await resolveRelatedProjects(clerkUserId, relatedProjectIds)

  const data = buildSkillPayload(payload, clerkUserId)

  if (prisma) {
    await ensureOwnerUser(clerkUserId)
    const existing = await prisma.skill.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
    })

    if (!existing) {
      throw createServiceError(404, 'Skill not found.')
    }

    const skill = await prisma.skill.update({
      where: { id: existing.id },
      data: {
        ...data,
        relatedProjects: {
          deleteMany: {},
          create: relatedProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
        },
      },
      include: { relatedProjects: { include: { project: true } } },
    })

    return attachRelatedProjectIds(skill, skill.relatedProjects)
  }

  const projects = await listProjects(clerkUserId)
  const existing = memorySkills.find((skill) => skill.id === id && skill.ownerClerkUserId === clerkUserId)
  if (!existing) {
    throw createServiceError(404, 'Skill not found.')
  }

  const updatedSkill = {
    ...existing,
    ...data,
    relatedProjectIds,
    updatedAt: new Date(),
  }

  memorySkills = memorySkills.map((skill) => (skill.id === id && skill.ownerClerkUserId === clerkUserId ? updatedSkill : skill))
  return enrichMemorySkills([updatedSkill], projects)[0]
}

async function deleteSkill(clerkUserId, skillId) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  if (prisma) {
    await ensureOwnerUser(clerkUserId)
    const existing = await prisma.skill.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
    })

    if (!existing) {
      throw createServiceError(404, 'Skill not found.')
    }

    await prisma.skill.delete({
      where: { id: existing.id },
    })

    return null
  }

  const existing = memorySkills.find((skill) => skill.id === id && skill.ownerClerkUserId === clerkUserId)
  if (!existing) {
    throw createServiceError(404, 'Skill not found.')
  }

  memorySkills = memorySkills.filter((skill) => !(skill.id === id && skill.ownerClerkUserId === clerkUserId))
  return null
}

module.exports = {
  SKILL_LEVELS,
  createServiceError,
  listSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
}