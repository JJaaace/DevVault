function requestLogger(req, res, next) {
  const startedAt = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    console.log(`[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`)
  })

  return next()
}

module.exports = {
  requestLogger,
}
