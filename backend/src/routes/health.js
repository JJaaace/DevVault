const express = require('express')
const { sendSuccess } = require('../utils/http')
const { prisma } = require('../db/prisma')
const { persistenceMode, isPostgresMode } = require('../config/persistence')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    if (isPostgresMode()) await prisma.$queryRaw`SELECT 1`
    return sendSuccess(res, {
      status: 'ok',
      persistence: persistenceMode,
      database: isPostgresMode() ? 'reachable' : 'local-development',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    error.statusCode = 503
    return next(error)
  }
})

module.exports = router
