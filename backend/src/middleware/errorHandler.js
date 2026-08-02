const { sendError } = require('../utils/http')

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

  console.error('[api:error]', {
    method: req.method,
    path: req.originalUrl,
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
