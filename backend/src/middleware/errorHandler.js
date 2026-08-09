const { sendError } = require('../utils/http')
const { logger } = require('../utils/logger')

function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Endpoint not found.',
  }, 'NOT_FOUND', 'Endpoint not found.')
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  if (error?.type === 'entity.parse.failed') {
    error.statusCode = 400
    error.code = 'INVALID_JSON'
    error.message = 'Request body contains invalid JSON.'
  } else if (error?.type === 'entity.too.large') {
    error.statusCode = 413
    error.code = 'PAYLOAD_TOO_LARGE'
    error.message = 'Request body is too large.'
  }

  logger.error('api.error', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    message: error?.message,
    code: error?.code,
    statusCode: error?.statusCode,
  })

  return sendError(res, error, 'INTERNAL_ERROR', 'Something went wrong.')
}

module.exports = {
  notFoundHandler,
  errorHandler,
}
