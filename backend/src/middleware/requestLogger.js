const crypto = require('crypto')
const { logger } = require('../utils/logger')

function requestLogger(req, res, next) {
  const startedAt = Date.now()
  const requestId = req.get('x-request-id') || crypto.randomUUID()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    const path = String(req.originalUrl || req.url || '').split('?')[0]
    const details = { requestId, method: req.method, path, statusCode: res.statusCode, durationMs }
    if (res.statusCode >= 500) logger.error('api.request.failed', details)
    else if (res.statusCode >= 400) logger.warn('api.request.rejected', details)
    else logger.info('api.request.completed', details)
  })

  return next()
}

module.exports = {
  requestLogger,
}
