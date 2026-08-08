const { prisma } = require('../db/prisma')
const { isPostgresMode } = require('../config/persistence')
const { getLocalStore, updateLocalStore } = require('./localStore')

const STATUSES = new Set(['earned', 'in-progress', 'planned'])
const ROADMAP_STATUSES = new Set(['complete', 'current', 'future'])
const MAX_ASSET_BYTES = 24 * 1024 * 1024
const PREVIEW_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/avif'])

function serviceError(statusCode, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.details = details
  return error
}

function optionalText(value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized || null
}

function requiredText(value, field) {
  const normalized = optionalText(value)
  if (!normalized) throw serviceError(400, 'Invalid certification data.', { [field]: `${field} is required.` })
  return normalized
}

function list(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []
}

function date(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw serviceError(400, 'Invalid certification data.', { issueDate: 'Use a valid issue date.' })
  return parsed
}

function parseAssetDataUrl(value) {
  if (!value || !String(value).startsWith('data:')) return null
  const match = String(value).match(/^data:([^;,]*)(?:;[^,]*)?;base64,([A-Za-z0-9+/=\s]+)$/i)
  if (!match) throw serviceError(400, 'Invalid certificate asset.', { assetUrl: 'Choose a valid file from your device.' })
  const assetData = Buffer.from(match[2].replace(/\s+/g, ''), 'base64')
  if (!assetData.length || assetData.length > MAX_ASSET_BYTES) throw serviceError(400, 'Invalid certificate asset.', { assetUrl: 'File must be smaller than 24 MB.' })
  return { assetData, assetMimeType: String(match[1] || 'application/octet-stream').toLowerCase() }
}

function buildData(payload, current = {}, { forImport = false } = {}) {
  const status = requiredText(payload.status ?? current.status, 'status')
  if (!STATUSES.has(status)) throw serviceError(400, 'Invalid certification data.', { status: 'Choose earned, in-progress, or planned.' })
  const parsedYear = Number(payload.year ?? current.year)
  if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2200) throw serviceError(400, 'Invalid certification data.', { year: 'Use a valid year.' })

  const data = {
    legacyKey: optionalText(payload.legacyKey ?? (forImport ? payload.id : current.legacyKey)),
    name: requiredText(payload.name ?? current.name, 'name'),
    organization: requiredText(payload.organization ?? current.organization, 'organization'),
    provider: requiredText(payload.provider ?? current.provider, 'provider'),
    status,
    issueDate: date(payload.issueDate ?? current.issueDate),
    year: parsedYear,
    credentialId: optionalText(payload.credentialId ?? current.credentialId),
    credentialUrl: optionalText(payload.credentialUrl ?? current.credentialUrl),
    verifyUrl: optionalText(payload.verifyUrl ?? current.verifyUrl),
    logo: optionalText(payload.logo ?? current.logo),
    accentColor: optionalText(payload.accentColor ?? current.accentColor),
    skillsGained: list(payload.skillsGained ?? current.skillsGained),
    technologies: list(payload.technologies ?? current.technologies),
    associatedProjects: list(payload.associatedProjects ?? current.associatedProjects),
    notes: optionalText(payload.notes ?? current.notes),
    featured: Boolean(payload.featured ?? current.featured),
    displayOrder: Number.isInteger(Number(payload.displayOrder ?? current.displayOrder)) ? Number(payload.displayOrder ?? current.displayOrder) : 0,
    publicVisible: Boolean(payload.publicVisible ?? current.publicVisible ?? true),
    assetName: optionalText(payload.assetName ?? current.assetName),
  }

  const parsedAsset = parseAssetDataUrl(payload.assetUrl)
  if (parsedAsset) Object.assign(data, parsedAsset)
  if (payload.removeAsset === true) Object.assign(data, { assetData: null, assetMimeType: null, assetName: null })
  return data
}

function serialize(certification) {
  const { assetData, ...safe } = certification
  return {
    ...safe,
    issueDate: certification.issueDate ? new Date(certification.issueDate).toISOString().slice(0, 10) : null,
    assetUrl: certification.assetMimeType ? `/api/certifications/${certification.id}/asset?v=${new Date(certification.updatedAt).getTime()}` : null,
    assetType: certification.assetMimeType === 'application/pdf'
      ? 'pdf'
      : PREVIEW_IMAGE_TYPES.has(certification.assetMimeType)
        ? 'image'
        : certification.assetMimeType ? 'file' : null,
  }
}

async function listCertifications(ownerClerkUserId, { publicOnly = false } = {}) {
  const values = isPostgresMode()
    ? await prisma.certification.findMany({
      where: { ownerClerkUserId, ...(publicOnly ? { publicVisible: true } : {}) },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      omit: { assetData: true },
    })
    : getLocalStore().certifications.filter((item) => item.ownerClerkUserId === ownerClerkUserId && (!publicOnly || item.publicVisible)).sort((a, b) => a.displayOrder - b.displayOrder)
  return values.map(serialize)
}

async function findOwned(ownerClerkUserId, certificationId, { includeAsset = false } = {}) {
  const id = Number(certificationId)
  if (!Number.isInteger(id)) throw serviceError(400, 'Certification ID must be valid.')
  const item = isPostgresMode()
    ? await prisma.certification.findFirst({ where: { id, ownerClerkUserId }, ...(includeAsset ? {} : { omit: { assetData: true } }) })
    : getLocalStore().certifications.find((certification) => certification.id === id && certification.ownerClerkUserId === ownerClerkUserId)
  if (!item) throw serviceError(404, 'Certification not found.')
  return item
}

async function createCertification(ownerClerkUserId, payload) {
  const count = (await listCertifications(ownerClerkUserId)).length
  const data = buildData(payload, { status: 'planned', year: new Date().getFullYear(), displayOrder: count })
  if (isPostgresMode()) return serialize(await prisma.certification.create({ data: { ...data, ownerClerkUserId } }))
  const store = getLocalStore()
  const item = { id: store.nextCertificationId, ownerClerkUserId, ...data, assetUrl: payload.assetUrl || null, createdAt: new Date(), updatedAt: new Date() }
  updateLocalStore((state) => ({ ...state, nextCertificationId: state.nextCertificationId + 1, certifications: [...state.certifications, item] }))
  return serialize(item)
}

async function updateCertification(ownerClerkUserId, certificationId, payload) {
  const existing = await findOwned(ownerClerkUserId, certificationId, { includeAsset: true })
  const data = buildData(payload, existing)
  if (isPostgresMode()) return serialize(await prisma.certification.update({ where: { id: existing.id }, data }))
  const updated = { ...existing, ...data, assetUrl: payload.assetUrl?.startsWith('data:') ? payload.assetUrl : existing.assetUrl, updatedAt: new Date() }
  updateLocalStore((state) => ({ ...state, certifications: state.certifications.map((item) => item.id === existing.id ? updated : item) }))
  return serialize(updated)
}

async function deleteCertification(ownerClerkUserId, certificationId) {
  const existing = await findOwned(ownerClerkUserId, certificationId)
  if (isPostgresMode()) await prisma.certification.delete({ where: { id: existing.id } })
  else updateLocalStore((state) => ({ ...state, certifications: state.certifications.filter((item) => item.id !== existing.id) }))
}

async function reorderCertifications(ownerClerkUserId, orderedIds) {
  const ids = Array.isArray(orderedIds) ? orderedIds.map(Number) : []
  if (!ids.length || ids.some((id) => !Number.isInteger(id)) || new Set(ids).size !== ids.length) throw serviceError(400, 'Certification order must contain unique IDs.')
  const owned = await listCertifications(ownerClerkUserId)
  if (ids.some((id) => !owned.some((item) => item.id === id))) throw serviceError(404, 'Certification not found.')
  if (isPostgresMode()) {
    await prisma.$transaction(ids.map((id, index) => prisma.certification.update({ where: { id }, data: { displayOrder: index } })))
  } else {
    const order = new Map(ids.map((id, index) => [id, index]))
    updateLocalStore((state) => ({ ...state, certifications: state.certifications.map((item) => item.ownerClerkUserId === ownerClerkUserId && order.has(item.id) ? { ...item, displayOrder: order.get(item.id) } : item) }))
  }
  return listCertifications(ownerClerkUserId)
}

async function setFeaturedCertifications(ownerClerkUserId, featuredIds) {
  const ids = Array.isArray(featuredIds) ? featuredIds.map(Number) : []
  if (ids.length > 3 || ids.some((id) => !Number.isInteger(id)) || new Set(ids).size !== ids.length) throw serviceError(400, 'Choose up to three unique featured certifications.')
  const owned = await listCertifications(ownerClerkUserId)
  if (ids.some((id) => !owned.some((item) => item.id === id))) throw serviceError(404, 'Certification not found.')
  if (isPostgresMode()) {
    await prisma.$transaction(async (transaction) => {
      await transaction.certification.updateMany({ where: { ownerClerkUserId }, data: { featured: false } })
      if (ids.length) await transaction.certification.updateMany({ where: { ownerClerkUserId, id: { in: ids } }, data: { featured: true } })
    })
  } else {
    const featured = new Set(ids)
    updateLocalStore((state) => ({ ...state, certifications: state.certifications.map((item) => item.ownerClerkUserId === ownerClerkUserId ? { ...item, featured: featured.has(item.id) } : item) }))
  }
  return listCertifications(ownerClerkUserId)
}

async function getCertificationAsset(ownerClerkUserId, certificationId) {
  const item = await findOwned(ownerClerkUserId, certificationId, { includeAsset: true })
  if (isPostgresMode()) {
    if (!item.assetData || !item.assetMimeType) throw serviceError(404, 'Certificate asset not found.')
    return { content: Buffer.from(item.assetData), mimeType: item.assetMimeType, fileName: item.assetName || `${item.name}.${item.assetMimeType === 'application/pdf' ? 'pdf' : 'png'}` }
  }
  if (!item.assetUrl) throw serviceError(404, 'Certificate asset not found.')
  const parsed = parseAssetDataUrl(item.assetUrl)
  return { content: parsed.assetData, mimeType: parsed.assetMimeType, fileName: item.assetName || 'certificate' }
}

async function getPublicCertificationAsset(ownerClerkUserId, certificationId) {
  const item = await findOwned(ownerClerkUserId, certificationId, { includeAsset: true })
  if (!item.publicVisible) throw serviceError(404, 'Certificate asset not found.')
  if (isPostgresMode()) {
    if (!item.assetData || !item.assetMimeType) throw serviceError(404, 'Certificate asset not found.')
    return { content: Buffer.from(item.assetData), mimeType: item.assetMimeType, fileName: item.assetName || 'certificate' }
  }
  if (!item.assetUrl) throw serviceError(404, 'Certificate asset not found.')
  const parsed = parseAssetDataUrl(item.assetUrl)
  return { content: parsed.assetData, mimeType: parsed.assetMimeType, fileName: item.assetName || 'certificate' }
}

async function listRoadmap(ownerClerkUserId) {
  return isPostgresMode()
    ? prisma.certificationRoadmapItem.findMany({ where: { ownerClerkUserId }, orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }] })
    : getLocalStore().certificationRoadmap.filter((item) => item.ownerClerkUserId === ownerClerkUserId).sort((a, b) => a.displayOrder - b.displayOrder)
}

function normalizeRoadmap(items) {
  if (!Array.isArray(items)) throw serviceError(400, 'Roadmap must be a list.')
  return items.map((item, index) => {
    const year = Number(item.year)
    const status = requiredText(item.status, 'status')
    if (!Number.isInteger(year) || !ROADMAP_STATUSES.has(status)) throw serviceError(400, 'Invalid roadmap item.')
    return { year, status, title: requiredText(item.title, 'title'), displayOrder: index }
  })
}

async function replaceRoadmap(ownerClerkUserId, items) {
  const data = normalizeRoadmap(items)
  if (isPostgresMode()) {
    await prisma.$transaction(async (transaction) => {
      await transaction.certificationRoadmapItem.deleteMany({ where: { ownerClerkUserId } })
      if (data.length) await transaction.certificationRoadmapItem.createMany({ data: data.map((item) => ({ ...item, ownerClerkUserId })) })
    })
  } else {
    updateLocalStore((state) => {
      const others = state.certificationRoadmap.filter((item) => item.ownerClerkUserId !== ownerClerkUserId)
      const created = data.map((item, index) => ({ ...item, id: state.nextCertificationRoadmapId + index, ownerClerkUserId }))
      return { ...state, certificationRoadmap: [...others, ...created], nextCertificationRoadmapId: state.nextCertificationRoadmapId + created.length }
    })
  }
  return listRoadmap(ownerClerkUserId)
}

async function importLegacyCertifications(ownerClerkUserId, payload) {
  const certifications = Array.isArray(payload.certifications) ? payload.certifications : []
  const roadmap = payload.roadmap
  if (!certifications.length) throw serviceError(400, 'No legacy certifications were supplied.')
  if (!isPostgresMode()) throw serviceError(409, 'Legacy import requires PostgreSQL persistence.')

  await prisma.$transaction(async (transaction) => {
    for (let index = 0; index < certifications.length; index += 1) {
      const source = certifications[index]
      const data = buildData({ ...source, displayOrder: source.displayOrder ?? index }, {}, { forImport: true })
      if (!data.legacyKey) throw serviceError(400, 'Each legacy certification needs an ID.')
      await transaction.certification.upsert({
        where: { ownerClerkUserId_legacyKey: { ownerClerkUserId, legacyKey: data.legacyKey } },
        create: { ...data, ownerClerkUserId },
        update: data,
      })
    }
  })
  if (Array.isArray(roadmap)) await replaceRoadmap(ownerClerkUserId, roadmap)
  return { certifications: await listCertifications(ownerClerkUserId), roadmap: await listRoadmap(ownerClerkUserId) }
}

module.exports = {
  listCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  reorderCertifications,
  setFeaturedCertifications,
  getCertificationAsset,
  getPublicCertificationAsset,
  listRoadmap,
  replaceRoadmap,
  importLegacyCertifications,
  __test: { parseAssetDataUrl, serialize },
}
