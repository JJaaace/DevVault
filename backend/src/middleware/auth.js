const { requireAuth } = require('@clerk/express')

const { hasClerkConfig, allowDevAuth } = require('../config/auth')

function applyDevAuth(req, res, next) {
  req.auth = req.auth || { userId: process.env.DEV_CLERK_USER_ID || 'dev-local-user' }
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
