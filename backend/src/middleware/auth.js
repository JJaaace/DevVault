const { requireAuth } = require('@clerk/express')

const { hasClerkConfig, allowDevAuth } = require('../config/auth')
const { environment } = require('../config/environment')

function applyDevAuth(req, res, next) {
  req.auth = req.auth || { userId: environment.devClerkUserId }
  return next()
}

function protectRoute(req, res, next) {
  if (allowDevAuth) {
    return applyDevAuth(req, res, next)
  }

  if (!hasClerkConfig) return res.status(503).json({ success: false, error: { code: 'AUTH_NOT_CONFIGURED', message: 'Authentication is not configured.' } })

  return requireAuth(req, res, next)
}

module.exports = protectRoute
