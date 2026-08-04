const { listProjects } = require('./projectService')

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

const SKILL_LEVELS = ['BEGINNER', 'ADVANCED_BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

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

function normalizeTechnologyKey(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim().toLowerCase()
  return trimmed ? trimmed.replace(/\s+/g, '-') : null
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
    errors.experienceLevel = 'Experience level must be beginner, advanced beginner, intermediate, advanced, or expert.'
  }

  const yearsExperience = normalizeInteger(payload.yearsExperience)
  if (yearsExperience === null || yearsExperience < 0 || yearsExperience > 60) {
    errors.yearsExperience = 'Years of experience must be between 0 and 60.'
  }

  const firstUsedYear = normalizeInteger(payload.firstUsedYear)
  const currentYear = new Date().getFullYear()
  if (firstUsedYear === null || firstUsedYear < 1980 || firstUsedYear > currentYear + 1) {
    errors.firstUsedYear = `First used year must be between 1980 and ${currentYear + 1}.`
  }

  const projectsBuilt = normalizeInteger(payload.projectsBuilt)
  if (projectsBuilt === null || projectsBuilt < 0 || projectsBuilt > 500) {
    errors.projectsBuilt = 'Projects built must be between 0 and 500.'
  }

  if (yearsExperience !== null && firstUsedYear !== null) {
    const inferredMinYears = Math.max(0, currentYear - firstUsedYear)
    if (yearsExperience > inferredMinYears + 1) {
      errors.yearsExperience = 'Years of experience looks inconsistent with first used year.'
    }
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
    technologyKey: normalizeTechnologyKey(payload.technologyKey || payload.name),
    category: payload.category.trim(),
    experienceLevel: payload.experienceLevel,
    percentage: normalizeInteger(payload.percentage) ?? 0,
    yearsExperience: normalizeInteger(payload.yearsExperience) ?? 0,
    firstUsedYear: normalizeInteger(payload.firstUsedYear),
    projectsBuilt: normalizeInteger(payload.projectsBuilt) ?? 0,
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

function hasPrismaSkillAccess() {
  const userModel = prisma?.user
  const skillModel = prisma?.skill

  return Boolean(
    userModel
    && skillModel
    && typeof userModel.upsert === 'function'
    && typeof skillModel.findMany === 'function'
    && typeof skillModel.findFirst === 'function'
    && typeof skillModel.create === 'function'
    && typeof skillModel.update === 'function'
    && typeof skillModel.delete === 'function',
  )
}

async function ensureOwnerUser(clerkUserId) {
  if (!hasPrismaSkillAccess()) {
    return
  }

  const userModel = prisma?.user
  if (!userModel || typeof userModel.upsert !== 'function') {
    return
  }

  try {
    await userModel.upsert({
      where: { clerkUserId },
      create: { clerkUserId },
      update: {},
    })
  } catch (error) {
    throw createServiceError(503, 'Unable to initialize skill owner user.')
  }
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
  if (hasPrismaSkillAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      const skills = await prisma.skill.findMany({
        where: { ownerClerkUserId: clerkUserId },
        include: { relatedProjects: { include: { project: true } } },
        orderBy: [{ yearsExperience: 'desc' }, { updatedAt: 'desc' }],
      })

      return skills.map((skill) => attachRelatedProjectIds(skill, skill.relatedProjects))
    } catch {
      // fall through to local storage when Prisma is unavailable
    }
  }

  const projects = await listProjects(clerkUserId)
  return enrichMemorySkills(
    getLocalStore().skills
      .filter((skill) => skill.ownerClerkUserId === clerkUserId)
      .sort((left, right) => {
        const leftYears = Number(left.yearsExperience || 0)
        const rightYears = Number(right.yearsExperience || 0)
        if (leftYears !== rightYears) {
          return rightYears - leftYears
        }

        return new Date(right.updatedAt) - new Date(left.updatedAt)
      }),
    projects,
  )
}

async function getSkillById(clerkUserId, skillId) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  if (hasPrismaSkillAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      const skill = await prisma.skill.findFirst({
        where: { id, ownerClerkUserId: clerkUserId },
        include: { relatedProjects: { include: { project: true } } },
      })

      if (!skill) {
        throw createServiceError(404, 'Skill not found.')
      }

      return attachRelatedProjectIds(skill, skill.relatedProjects)
    } catch (error) {
      if (error?.statusCode === 404) {
        throw error
      }

      // fall through to local storage when Prisma is unavailable
    }
  }

  const projects = await listProjects(clerkUserId)
  const skill = getLocalStore().skills.find((item) => item.id === id && item.ownerClerkUserId === clerkUserId)
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

  if (hasPrismaSkillAccess()) {
    try {
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
    } catch {
      // fall through to local storage when Prisma is unavailable
    }
  }

  const projectList = await listProjects(clerkUserId)
  const relatedProjects = enrichMemorySkills(
    relatedProjectIds.map((projectId) => ({ projectId })),
    projectList,
  )

  const store = getLocalStore()
  const skill = {
    id: store.nextSkillId,
    ...data,
    relatedProjectIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  updateLocalStore((current) => ({
    ...current,
    nextSkillId: current.nextSkillId + 1,
    skills: [skill, ...current.skills],
  }))
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

  if (hasPrismaSkillAccess()) {
    try {
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
    } catch (error) {
      if (error?.statusCode === 404) {
        throw error
      }

      // fall through to local storage when Prisma is unavailable
    }
  }

  const projects = await listProjects(clerkUserId)
  const existing = getLocalStore().skills.find((skill) => skill.id === id && skill.ownerClerkUserId === clerkUserId)
  if (!existing) {
    throw createServiceError(404, 'Skill not found.')
  }

  const updatedSkill = {
    ...existing,
    ...data,
    relatedProjectIds,
    updatedAt: new Date(),
  }

  updateLocalStore((current) => ({
    ...current,
    skills: current.skills.map((skill) => (skill.id === id && skill.ownerClerkUserId === clerkUserId ? updatedSkill : skill)),
  }))
  return enrichMemorySkills([updatedSkill], projects)[0]
}

async function deleteSkill(clerkUserId, skillId) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  if (hasPrismaSkillAccess()) {
    try {
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
    } catch (error) {
      if (error?.statusCode === 404) {
        throw error
      }

      // fall through to local storage when Prisma is unavailable
    }
  }

  const existing = getLocalStore().skills.find((skill) => skill.id === id && skill.ownerClerkUserId === clerkUserId)
  if (!existing) {
    throw createServiceError(404, 'Skill not found.')
  }

  updateLocalStore((current) => ({
    ...current,
    skills: current.skills.filter((skill) => !(skill.id === id && skill.ownerClerkUserId === clerkUserId)),
  }))
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