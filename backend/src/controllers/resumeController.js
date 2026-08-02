const { sendSuccess, sendNoContent, sendError } = require('../utils/http')
const { getResumeMetadata, saveResumePdf, removeResume } = require('../services/resumeService')

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
  uploadResume,
  deleteResume,
}
