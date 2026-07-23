const { requireAuth } = require('@clerk/express')

function protectRoute(req, res, next) {
  return requireAuth(req, res, next)
}

module.exports = protectRoute
