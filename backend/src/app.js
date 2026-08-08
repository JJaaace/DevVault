const dotenv = require('dotenv')

dotenv.config()

const express = require('express')
const cors = require('cors')
const { clerkMiddleware } = require('@clerk/express')
const healthRouter = require('./routes/health')
const usersRouter = require('./routes/users')
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

const app = express()
const PORT = process.env.PORT || 5000

function applyDevAuth(req, res, next) {
  req.auth = req.auth || { userId: process.env.DEV_CLERK_USER_ID || 'dev-local-user' }
  return next()
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '35mb' }))
app.use(requestLogger)
app.use('/health', healthRouter)
app.use('/api/public', publicRouter)

if (hasClerkConfig) {
  app.use(clerkMiddleware())
} else if (allowDevAuth) {
  app.use(applyDevAuth)
}

app.use('/api/users', usersRouter)
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DevVault backend listening on port ${PORT} (${persistenceMode} persistence)`)
  })
}

module.exports = app
