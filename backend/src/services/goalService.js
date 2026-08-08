const { prisma } = require('../db/prisma')
const { isPostgresMode } = require('../config/persistence')
const { getLocalStore, updateLocalStore } = require('./localStore')

const GOAL_STATUSES = new Set(['complete', 'current', 'future', 'archived'])
const GOAL_CATEGORIES = new Set(['Career', 'Education', 'Projects', 'Certifications', 'Personal Development'])

function serviceError(statusCode, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.details = details
  return error
}

function text(value, { required = false } = {}) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (required && !normalized) throw serviceError(400, 'Invalid goal data.')
  return normalized || null
}

function list(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []
}

function structuredList(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : []
}

function normalizeDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw serviceError(400, 'Invalid goal data.', { targetCompletion: 'Use a valid date.' })
  return date
}

function buildGoalData(payload, current = {}) {
  const title = text(payload.title ?? current.title, { required: true })
  const description = text(payload.description ?? current.description, { required: true })
  const category = text(payload.category ?? current.category, { required: true })
  const status = text(payload.status ?? current.status, { required: true })

  const errors = {}
  if (!GOAL_CATEGORIES.has(category)) errors.category = 'Choose a supported goal category.'
  if (!GOAL_STATUSES.has(status)) errors.status = 'Choose a supported goal status.'
  if (Object.keys(errors).length) throw serviceError(400, 'Invalid goal data.', errors)

  return {
    legacyKey: text(payload.legacyKey ?? current.legacyKey),
    title,
    category,
    status,
    displayOrder: Number.isInteger(Number(payload.displayOrder ?? current.displayOrder)) ? Number(payload.displayOrder ?? current.displayOrder) : 0,
    pinned: Boolean(payload.pinned ?? current.pinned),
    targetCompletion: normalizeDate(payload.targetCompletion ?? current.targetCompletion),
    description,
    why: text(payload.why ?? current.why),
    notes: text(payload.notes ?? current.notes),
    resources: structuredList(payload.resources ?? current.resources),
    relatedProjectNames: list(payload.relatedProjectNames ?? payload.relatedProjects ?? current.relatedProjectNames),
    relatedCertificationNames: list(payload.relatedCertificationNames ?? payload.relatedCertifications ?? current.relatedCertificationNames),
    relatedTechnologies: list(payload.relatedTechnologies ?? current.relatedTechnologies),
    milestones: structuredList(payload.milestones ?? current.milestones),
    accent: text(payload.accent ?? current.accent),
    publicVisible: Boolean(payload.publicVisible ?? current.publicVisible),
  }
}

function serializeGoal(goal) {
  return {
    ...goal,
    targetCompletion: goal.targetCompletion ? new Date(goal.targetCompletion).toISOString().slice(0, 10) : null,
    relatedProjects: goal.relatedProjectNames || [],
    relatedCertifications: goal.relatedCertificationNames || [],
  }
}

async function listGoals(ownerClerkUserId, { publicOnly = false } = {}) {
  const goals = isPostgresMode()
    ? await prisma.goal.findMany({
      where: { ownerClerkUserId, ...(publicOnly ? { publicVisible: true } : {}) },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    })
    : getLocalStore().goals
      .filter((goal) => goal.ownerClerkUserId === ownerClerkUserId && (!publicOnly || goal.publicVisible))
      .sort((left, right) => left.displayOrder - right.displayOrder)

  return goals.map(serializeGoal)
}

async function createGoal(ownerClerkUserId, payload) {
  const current = { displayOrder: (await listGoals(ownerClerkUserId)).length + 1, status: 'future' }
  const data = buildGoalData(payload, current)
  if (isPostgresMode()) {
    return serializeGoal(await prisma.goal.create({ data: { ...data, ownerClerkUserId } }))
  }

  const store = getLocalStore()
  const goal = { id: store.nextGoalId, ownerClerkUserId, ...data, createdAt: new Date(), updatedAt: new Date() }
  updateLocalStore((state) => ({ ...state, nextGoalId: state.nextGoalId + 1, goals: [...state.goals, goal] }))
  return serializeGoal(goal)
}

async function updateGoal(ownerClerkUserId, goalId, payload) {
  const id = Number(goalId)
  if (!Number.isInteger(id)) throw serviceError(400, 'Goal ID must be valid.')
  const existing = isPostgresMode()
    ? await prisma.goal.findFirst({ where: { id, ownerClerkUserId } })
    : getLocalStore().goals.find((goal) => goal.id === id && goal.ownerClerkUserId === ownerClerkUserId)
  if (!existing) throw serviceError(404, 'Goal not found.')
  const data = buildGoalData(payload, existing)

  if (isPostgresMode()) return serializeGoal(await prisma.goal.update({ where: { id }, data }))
  const updated = { ...existing, ...data, updatedAt: new Date() }
  updateLocalStore((state) => ({ ...state, goals: state.goals.map((goal) => goal.id === id ? updated : goal) }))
  return serializeGoal(updated)
}

async function deleteGoal(ownerClerkUserId, goalId) {
  const id = Number(goalId)
  if (!Number.isInteger(id)) throw serviceError(400, 'Goal ID must be valid.')
  const existing = isPostgresMode()
    ? await prisma.goal.findFirst({ where: { id, ownerClerkUserId }, select: { id: true } })
    : getLocalStore().goals.find((goal) => goal.id === id && goal.ownerClerkUserId === ownerClerkUserId)
  if (!existing) throw serviceError(404, 'Goal not found.')
  if (isPostgresMode()) await prisma.goal.delete({ where: { id } })
  else updateLocalStore((state) => ({ ...state, goals: state.goals.filter((goal) => goal.id !== id) }))
}

async function reorderGoals(ownerClerkUserId, orderedIds) {
  const ids = Array.isArray(orderedIds) ? orderedIds.map(Number) : []
  if (!ids.length || ids.some((id) => !Number.isInteger(id)) || new Set(ids).size !== ids.length) {
    throw serviceError(400, 'Goal order must contain unique goal IDs.')
  }
  const owned = await listGoals(ownerClerkUserId)
  if (ids.some((id) => !owned.some((goal) => goal.id === id))) throw serviceError(404, 'Goal not found.')

  if (isPostgresMode()) {
    await prisma.$transaction(ids.map((id, index) => prisma.goal.update({ where: { id }, data: { displayOrder: index + 1 } })))
  } else {
    const order = new Map(ids.map((id, index) => [id, index + 1]))
    updateLocalStore((state) => ({ ...state, goals: state.goals.map((goal) => goal.ownerClerkUserId === ownerClerkUserId && order.has(goal.id) ? { ...goal, displayOrder: order.get(goal.id) } : goal) }))
  }
  return listGoals(ownerClerkUserId)
}

module.exports = { listGoals, createGoal, updateGoal, deleteGoal, reorderGoals }
