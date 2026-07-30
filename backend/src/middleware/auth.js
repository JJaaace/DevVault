const { requireAuth } = require('@clerk/express')

const hasClerkKey = Boolean(process.env.CLERK_PUBLISHABLE_KEY && !process.env.CLERK_PUBLISHABLE_KEY.includes('your_clerk'))

function applyDevAuth(req, res, next) {
  req.auth = req.auth || { userId: process.env.DEV_CLERK_USER_ID || 'dev-local-user' }
  return next()
}

function protectRoute(req, res, next) {
  if (!hasClerkKey) {
    return applyDevAuth(req, res, next)
  }

  return requireAuth(req, res, next)
}

module.exports = protectRoute
