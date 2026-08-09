const { prisma } = require('../db/prisma')
const { isPostgresMode } = require('../config/persistence')
const { listProjects } = require('./projectService')
const { getLocalStore, updateLocalStore } = require('./localStore')

const SKILL_LEVELS = ['BEGINNER', 'ADVANCED_BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

const SKILL_SELECT = {
  id: true,
  ownerClerkUserId: true,
  name: true,
  technologyKey: true,
  category: true,
  experienceLevel: true,
  yearsExperience: true,
  firstUsedYear: true,
  color: true,
  lastUsed: true,
  notes: true,
  favorite: true,
  publicVisible: true,
  createdAt: true,
  updatedAt: true,
  relatedProjects: {
    include: { project: { select: { id: true, title: true, status: true, publicVisible: true, featured: true } } },
    orderBy: { projectId: 'asc' },
  },
}

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
  return trimmed || null
}

function normalizeInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function normalizeIdList(value) {
  const values = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split(/[,\n]/) : [])

  return [...new Set(values
    .map((item) => normalizeInteger(typeof item === 'string' ? item.trim() : item))
    .filter((item) => Number.isInteger(item) && item > 0))]
    .sort((left, right) => left - right)
}

function normalizeDate(value) {
  if (!value) {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeTechnologyKey(value) {
  const normalized = normalizeText(value)
  return normalized ? normalized.toLowerCase().replace(/\s+/g, '-') : null
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
  if (payload.favorite !== undefined && typeof payload.favorite !== 'boolean') {
    errors.favorite = 'Favorite must be true or false.'
  }

  return errors
}

function buildSkillPayload(payload, clerkUserId, current = {}) {
  return {
    ownerClerkUserId: clerkUserId,
    name: payload.name.trim(),
    technologyKey: normalizeTechnologyKey(payload.technologyKey || payload.name),
    category: payload.category.trim(),
    experienceLevel: payload.experienceLevel,
    yearsExperience: normalizeInteger(payload.yearsExperience) ?? 0,
    firstUsedYear: normalizeInteger(payload.firstUsedYear),
    color: payload.color.trim(),
    lastUsed: normalizeDate(payload.lastUsed),
    notes: normalizeText(payload.notes),
    favorite: payload.favorite === undefined ? Boolean(current.favorite) : Boolean(payload.favorite),
    publicVisible: payload.publicVisible === undefined ? true : Boolean(payload.publicVisible),
  }
}

function projectReference(project) {
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    publicVisible: project.publicVisible ?? true,
    featured: Boolean(project.featured),
  }
}

function serializePrismaSkill(skill) {
  const relatedProjects = (skill.relatedProjects || []).map((item) => projectReference(item.project))
  const { relatedProjects: ignored, ...data } = skill
  return {
    ...data,
    projectsBuilt: relatedProjects.length,
    relatedProjectIds: relatedProjects.map((project) => project.id),
    relatedProjects,
  }
}

function serializeLocalSkill(skill, projects) {
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const relatedProjects = normalizeIdList(skill.relatedProjectIds)
    .map((projectId) => projectById.get(projectId))
    .filter(Boolean)
    .map(projectReference)
  const { percentage: ignored, ...data } = skill
  return {
    ...data,
    projectsBuilt: relatedProjects.length,
    relatedProjectIds: relatedProjects.map((project) => project.id),
    relatedProjects,
  }
}

async function ensureOwnerUser(clerkUserId) {
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

async function listSkills(clerkUserId, { publicOnly = false } = {}) {
  if (isPostgresMode()) {
    const skills = await prisma.skill.findMany({
      where: { ownerClerkUserId: clerkUserId, ...(publicOnly ? { publicVisible: true } : {}) },
      select: SKILL_SELECT,
      orderBy: [{ firstUsedYear: 'asc' }, { name: 'asc' }],
    })
    const serialized = skills.map(serializePrismaSkill)
    return publicOnly
      ? serialized.map((skill) => ({ ...skill, relatedProjects: skill.relatedProjects.filter((project) => project.publicVisible) }))
      : serialized
  }

  const store = getLocalStore()
  const projects = store.projects.filter((project) => project.ownerClerkUserId === clerkUserId)
  return store.skills
    .filter((skill) => skill.ownerClerkUserId === clerkUserId && (!publicOnly || skill.publicVisible))
    .sort((left, right) => {
      const yearDelta = Number(left.firstUsedYear || 0) - Number(right.firstUsedYear || 0)
      return yearDelta || String(left.name || '').localeCompare(String(right.name || ''))
    })
    .map((skill) => serializeLocalSkill(skill, publicOnly ? projects.filter((project) => project.publicVisible) : projects))
}

async function getSkillById(clerkUserId, skillId) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  if (isPostgresMode()) {
    const skill = await prisma.skill.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
      select: SKILL_SELECT,
    })
    if (!skill) {
      throw createServiceError(404, 'Skill not found.')
    }
    return serializePrismaSkill(skill)
  }

  const skills = await listSkills(clerkUserId)
  const skill = skills.find((item) => item.id === id)
  if (!skill) {
    throw createServiceError(404, 'Skill not found.')
  }
  return skill
}

async function createSkill(clerkUserId, payload) {
  const errors = validateSkillPayload(payload)
  if (Object.keys(errors).length) {
    throw createServiceError(400, 'Invalid skill data.', errors)
  }

  const relatedProjectIds = normalizeIdList(payload.relatedProjectIds)
  const relatedProjects = await resolveRelatedProjects(clerkUserId, relatedProjectIds)
  const data = buildSkillPayload(payload, clerkUserId)

  if (isPostgresMode()) {
    await ensureOwnerUser(clerkUserId)
    const skill = await prisma.$transaction(async (transaction) => {
      if (data.favorite) {
        await transaction.skill.updateMany({
          where: { ownerClerkUserId: clerkUserId, favorite: true },
          data: { favorite: false },
        })
      }

      return transaction.skill.create({
        data: {
          ...data,
          relatedProjects: {
            create: relatedProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
          },
        },
        select: SKILL_SELECT,
      })
    })
    return serializePrismaSkill(skill)
  }

  const store = getLocalStore()
  const skill = {
    id: store.nextSkillId,
    ...data,
    projectsBuilt: relatedProjects.length,
    relatedProjectIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  updateLocalStore((current) => ({
    ...current,
    nextSkillId: current.nextSkillId + 1,
    skills: [skill, ...current.skills.map((item) => (
      data.favorite && item.ownerClerkUserId === clerkUserId ? { ...item, favorite: false } : item
    ))],
  }))
  return serializeLocalSkill(skill, relatedProjects)
}

async function updateSkill(clerkUserId, skillId, payload) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }
  const errors = validateSkillPayload(payload)
  if (Object.keys(errors).length) {
    throw createServiceError(400, 'Invalid skill data.', errors)
  }

  if (isPostgresMode()) {
    const existing = await prisma.skill.findFirst({
      where: { id, ownerClerkUserId: clerkUserId },
      select: SKILL_SELECT,
    })
    if (!existing) {
      throw createServiceError(404, 'Skill not found.')
    }
    const existingProjectIds = existing.relatedProjects.map((item) => item.project.id).sort((left, right) => left - right)
    const relatedProjectIds = payload.relatedProjectIds === undefined
      ? existingProjectIds
      : normalizeIdList(payload.relatedProjectIds)
    await resolveRelatedProjects(clerkUserId, relatedProjectIds)
    const relationshipsChanged = existingProjectIds.length !== relatedProjectIds.length
      || existingProjectIds.some((projectId, index) => projectId !== relatedProjectIds[index])
    const data = buildSkillPayload(payload, clerkUserId, existing)

    const skill = await prisma.$transaction(async (transaction) => {
      if (data.favorite) {
        await transaction.skill.updateMany({
          where: { ownerClerkUserId: clerkUserId, favorite: true, id: { not: id } },
          data: { favorite: false },
        })
      }

      return transaction.skill.update({
        where: { id },
        data: {
          ...data,
          ...(relationshipsChanged ? {
            relatedProjects: {
              deleteMany: {},
              create: relatedProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
            },
          } : {}),
        },
        select: SKILL_SELECT,
      })
    })
    return serializePrismaSkill(skill)
  }

  const store = getLocalStore()
  const existing = store.skills.find((skill) => skill.id === id && skill.ownerClerkUserId === clerkUserId)
  if (!existing) {
    throw createServiceError(404, 'Skill not found.')
  }
  const relatedProjectIds = payload.relatedProjectIds === undefined
    ? normalizeIdList(existing.relatedProjectIds)
    : normalizeIdList(payload.relatedProjectIds)
  const relatedProjects = await resolveRelatedProjects(clerkUserId, relatedProjectIds)
  const data = buildSkillPayload(payload, clerkUserId, existing)
  const updatedSkill = {
    ...existing,
    ...data,
    projectsBuilt: relatedProjects.length,
    relatedProjectIds,
    updatedAt: new Date(),
  }
  delete updatedSkill.percentage
  updateLocalStore((current) => ({
    ...current,
    skills: current.skills.map((skill) => (
      skill.ownerClerkUserId === clerkUserId && data.favorite
        ? (skill.id === id ? updatedSkill : { ...skill, favorite: false })
        : (skill.id === id && skill.ownerClerkUserId === clerkUserId ? updatedSkill : skill)
    )),
  }))
  return serializeLocalSkill(updatedSkill, relatedProjects)
}

async function deleteSkill(clerkUserId, skillId) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  if (isPostgresMode()) {
    const existing = await prisma.skill.findFirst({ where: { id, ownerClerkUserId: clerkUserId } })
    if (!existing) {
      throw createServiceError(404, 'Skill not found.')
    }
    await prisma.skill.delete({ where: { id } })
    return null
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
