const { getGitHubSync, startGitHubSync } = require('../services/githubSyncService')
const { sendSuccess, sendError } = require('../utils/http')

async function startGitHubSyncHandler(req, res) {
  try {
    const job = startGitHubSync(req.auth.userId)
    return res.status(202).json({
      success: true,
      data: job,
    })
  } catch (error) {
    return sendError(res, error, 'GITHUB_SYNC_START_FAILED', 'Unable to start GitHub synchronization.')
  }
}

async function getGitHubSyncHandler(req, res) {
  try {
    const job = getGitHubSync(req.params.syncId, req.auth.userId)
    if (!job) {
      return sendError(res, {
        statusCode: 404,
        code: 'GITHUB_SYNC_NOT_FOUND',
        message: 'GitHub synchronization job not found.',
      }, 'GITHUB_SYNC_NOT_FOUND', 'GitHub synchronization job not found.')
    }

    return sendSuccess(res, job)
  } catch (error) {
    return sendError(res, error, 'GITHUB_SYNC_GET_FAILED', 'Unable to load GitHub synchronization status.')
  }
}

module.exports = {
  startGitHubSyncHandler,
  getGitHubSyncHandler,
}