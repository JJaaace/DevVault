const express = require('express')
const { sendSuccess } = require('../utils/http')
const { prisma } = require('../db/prisma')
const { persistenceMode, isPostgresMode } = require('../config/persistence')

const router = express.Router()

router.get('/health', (req, res) => sendSuccess(res, { status: 'ok' }))

router.get('/ready', async (req, res, next) => {
  try {
    if (isPostgresMode()) await prisma.$queryRaw`SELECT 1`
    return sendSuccess(res, {
      status: 'ready',
      database: isPostgresMode() ? 'reachable' : 'local-development',
      persistence: persistenceMode,
    })
  } catch (error) {
    error.statusCode = 503
    error.code = 'NOT_READY'
    return next(error)
  }
})

module.exports = router
