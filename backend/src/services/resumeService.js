const fs = require('fs')
const path = require('path')
const { prisma } = require('../db/prisma')
const { isPostgresMode } = require('../config/persistence')

const DATA_DIR = path.join(__dirname, '..', '..', '.data')
const RESUME_ROOT_DIR = path.join(DATA_DIR, 'resumes')
const METADATA_PATH = path.join(DATA_DIR, 'resume-metadata.json')

function createServiceError(statusCode, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (details) {
    error.details = details
  }
  return error
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function readMetadataStore() {
  try {
    const raw = fs.readFileSync(METADATA_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMetadataStore(store) {
  ensureDirectory(DATA_DIR)
  fs.writeFileSync(METADATA_PATH, `${JSON.stringify(store, null, 2)}\n`)
}

function sanitizeFileName(fileName) {
  const base = String(fileName || 'resume.pdf').trim()
  return base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'resume.pdf'
}

function parsePdfDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') {
    throw createServiceError(400, 'Resume file data is required.')
  }

  const match = dataUrl.match(/^data:[^;]+;base64,([A-Za-z0-9+/=\s]+)$/i)
  if (!match) {
    throw createServiceError(400, 'Resume must be uploaded as a PDF file.')
  }

  const base64Payload = match[1].replace(/\s+/g, '')
  const buffer = Buffer.from(base64Payload, 'base64')

  if (!buffer.length || buffer.slice(0, 4).toString('utf8') !== '%PDF') {
    throw createServiceError(400, 'Uploaded file is not a valid PDF.')
  }

  return buffer
}

function getResumeFilePath(clerkUserId) {
  return path.join(RESUME_ROOT_DIR, clerkUserId, 'resume.pdf')
}

function buildResumeResponse(clerkUserId, metadataEntry) {
  if (!metadataEntry) {
    return {
      uploaded: false,
      fileName: null,
      lastUpdated: null,
      byteSize: 0,
      fileUrl: null,
    }
  }

  const version = new Date(metadataEntry.updatedAt).getTime() || Date.now()
  return {
    uploaded: true,
    fileName: metadataEntry.fileName,
    lastUpdated: metadataEntry.updatedAt,
    byteSize: metadataEntry.byteSize,
    fileUrl: `/api/resume/file?v=${version}`,
  }
}

async function getResumeMetadata(clerkUserId) {
  if (isPostgresMode()) {
    const metadataEntry = await prisma.resumeAsset.findUnique({
      where: { ownerClerkUserId: clerkUserId },
      select: { fileName: true, byteSize: true, updatedAt: true },
    })
    return buildResumeResponse(clerkUserId, metadataEntry)
  }

  const store = readMetadataStore()
  const metadataEntry = store[clerkUserId] || null

  if (!metadataEntry) {
    return buildResumeResponse(clerkUserId, null)
  }

  const filePath = getResumeFilePath(clerkUserId)
  if (!fs.existsSync(filePath)) {
    delete store[clerkUserId]
    writeMetadataStore(store)
    return buildResumeResponse(clerkUserId, null)
  }

  return buildResumeResponse(clerkUserId, metadataEntry)
}

async function getResumeFileInfo(clerkUserId) {
  if (isPostgresMode()) {
    const resume = await prisma.resumeAsset.findUnique({ where: { ownerClerkUserId: clerkUserId } })
    if (!resume) throw createServiceError(404, 'Resume not found.')
    return {
      content: Buffer.from(resume.content),
      fileName: resume.fileName,
      mimeType: resume.mimeType,
    }
  }

  const store = readMetadataStore()
  const metadataEntry = store[clerkUserId]
  if (!metadataEntry) {
    throw createServiceError(404, 'Resume not found.')
  }

  const filePath = getResumeFilePath(clerkUserId)
  if (!fs.existsSync(filePath)) {
    throw createServiceError(404, 'Resume file not found.')
  }

  return {
    content: fs.readFileSync(filePath),
    fileName: metadataEntry.fileName || 'resume.pdf',
    mimeType: 'application/pdf',
  }
}

async function saveResumePdf(clerkUserId, payload) {
  const fileData = parsePdfDataUrl(payload.fileData)
  const sanitizedName = sanitizeFileName(payload.fileName)

  if (isPostgresMode()) {
    const resume = await prisma.resumeAsset.upsert({
      where: { ownerClerkUserId: clerkUserId },
      create: {
        ownerClerkUserId: clerkUserId,
        fileName: sanitizedName,
        mimeType: 'application/pdf',
        byteSize: fileData.length,
        content: fileData,
      },
      update: {
        fileName: sanitizedName,
        mimeType: 'application/pdf',
        byteSize: fileData.length,
        content: fileData,
      },
    })
    return buildResumeResponse(clerkUserId, resume)
  }

  ensureDirectory(RESUME_ROOT_DIR)
  const userResumeDir = path.join(RESUME_ROOT_DIR, clerkUserId)
  ensureDirectory(userResumeDir)

  const resumePath = getResumeFilePath(clerkUserId)
  fs.writeFileSync(resumePath, fileData)

  const store = readMetadataStore()
  const updatedAt = new Date().toISOString()
  store[clerkUserId] = {
    fileName: sanitizedName,
    byteSize: fileData.length,
    updatedAt,
  }
  writeMetadataStore(store)

  return buildResumeResponse(clerkUserId, store[clerkUserId])
}

async function removeResume(clerkUserId) {
  if (isPostgresMode()) {
    await prisma.resumeAsset.deleteMany({ where: { ownerClerkUserId: clerkUserId } })
    return
  }

  const resumePath = getResumeFilePath(clerkUserId)
  try {
    if (fs.existsSync(resumePath)) {
      fs.unlinkSync(resumePath)
    }
  } catch {
    // no-op
  }

  const store = readMetadataStore()
  if (store[clerkUserId]) {
    delete store[clerkUserId]
    writeMetadataStore(store)
  }
}

module.exports = {
  getResumeMetadata,
  getResumeFileInfo,
  saveResumePdf,
  removeResume,
}
