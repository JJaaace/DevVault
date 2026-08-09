const dotenv = require('dotenv')

dotenv.config()

const express = require('express')
const cors = require('cors')
const { clerkMiddleware } = require('@clerk/express')
const healthRouter = require('./routes/health')
const publicRouter = require('./routes/public')
const profileRouter = require('./routes/profile')
const projectsRouter = require('./routes/projects')
const skillsRouter = require('./routes/skills')
const resumeRouter = require('./routes/resume')
const githubSyncRouter = require('./routes/githubSync')
const dashboardRouter = require('./routes/dashboard')
const goalsRouter = require('./routes/goals')
const certificationsRouter = require('./routes/certifications')
const { requestLogger } = require('./middleware/requestLogger')
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler')
const { persistenceMode } = require('./config/persistence')
const { hasClerkConfig, allowDevAuth } = require('./config/auth')
const { corsOptions } = require('./config/cors')
const { environment } = require('./config/environment')
const { prisma } = require('./db/prisma')
const { securityHeaders } = require('./middleware/securityHeaders')
const { logger } = require('./utils/logger')

const app = express()
function applyDevAuth(req, res, next) {
  req.auth = req.auth || { userId: environment.devClerkUserId }
  return next()
}

app.disable('x-powered-by')
if (environment.isProduction) app.set('trust proxy', 1)
app.use(cors(corsOptions))
app.use(securityHeaders)
app.use(express.json({ limit: '35mb' }))
app.use(requestLogger)
app.use(healthRouter)
app.use('/api/public', publicRouter)

if (hasClerkConfig) {
  app.use(clerkMiddleware())
} else if (allowDevAuth) {
  app.use(applyDevAuth)
}

app.use('/api/profile', profileRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/skills', skillsRouter)
app.use('/api/resume', resumeRouter)
app.use('/api/github-sync', githubSyncRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/certifications', certificationsRouter)

app.get('/', (req, res) => {
  res.json({
    success: true,
    data: { message: 'Welcome to DevVault API' },
  })
})

app.use(notFoundHandler)
app.use(errorHandler)

async function startServer() {
  if (persistenceMode === 'postgres') {
    await prisma.$queryRaw`SELECT 1`
    logger.info('database.connection.ready', { persistence: persistenceMode })
  }

  const server = app.listen(environment.port, () => {
    logger.info('server.started', {
      nodeEnv: environment.nodeEnv,
      port: environment.port,
      persistence: persistenceMode,
    })
  })

  let shuttingDown = false
  async function shutdown(signal) {
    if (shuttingDown) return
    shuttingDown = true
    logger.info('server.shutdown.started', { signal })
    const forceTimer = setTimeout(() => {
      logger.error('server.shutdown.timed_out', { signal })
      process.exit(1)
    }, 10000)
    forceTimer.unref()

    server.close(async (error) => {
      try {
        if (prisma) await prisma.$disconnect()
      } finally {
        clearTimeout(forceTimer)
        if (error) {
          logger.error('server.shutdown.failed', { signal, error })
          process.exit(1)
        }
        logger.info('server.shutdown.complete', { signal })
        process.exit(0)
      }
    })
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'))
  process.once('SIGINT', () => shutdown('SIGINT'))
  return server
}

if (require.main === module) {
  startServer().catch((error) => {
    logger.error('server.start.failed', { error })
    process.exitCode = 1
  })
}

module.exports = app
module.exports.startServer = startServer
