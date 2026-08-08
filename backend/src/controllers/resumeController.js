const { sendSuccess, sendNoContent, sendError } = require('../utils/http')
const {
  getResumeMetadata,
  getResumeFileInfo,
  saveResumePdf,
  removeResume,
} = require('../services/resumeService')

async function getResume(req, res) {
  try {
    const metadata = await getResumeMetadata(req.auth.userId)
    return sendSuccess(res, metadata)
  } catch (error) {
    return sendError(res, error, 'RESUME_GET_FAILED', 'Unable to load resume.')
  }
}

async function uploadResume(req, res) {
  try {
    const metadata = await saveResumePdf(req.auth.userId, req.body || {})
    return sendSuccess(res, metadata)
  } catch (error) {
    return sendError(res, error, 'RESUME_UPLOAD_FAILED', 'Unable to upload resume.')
  }
}

async function getResumeFile(req, res) {
  try {
    const fileInfo = await getResumeFileInfo(req.auth.userId)
    const safeFileName = String(fileInfo.fileName || 'resume.pdf').replace(/"/g, '')

    res.setHeader('Content-Type', fileInfo.mimeType || 'application/pdf')
    res.setHeader('Content-Length', String(fileInfo.content.length))
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`)
    return res.status(200).send(fileInfo.content)
  } catch (error) {
    return sendError(res, error, 'RESUME_FILE_GET_FAILED', 'Unable to load resume file.')
  }
}

async function deleteResume(req, res) {
  try {
    await removeResume(req.auth.userId)
    return sendNoContent(res)
  } catch (error) {
    return sendError(res, error, 'RESUME_DELETE_FAILED', 'Unable to delete resume.')
  }
}

module.exports = {
  getResume,
  getResumeFile,
  uploadResume,
  deleteResume,
}
