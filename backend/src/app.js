const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
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
const { startGitHubSyncScheduler } = require('./services/githubSyncScheduler')
const { requestLogger } = require('./middleware/requestLogger')
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const hasClerkKey = Boolean(process.env.CLERK_PUBLISHABLE_KEY && !process.env.CLERK_PUBLISHABLE_KEY.includes('your_clerk'))

function applyDevAuth(req, res, next) {
  req.auth = req.auth || { userId: process.env.DEV_CLERK_USER_ID || 'dev-local-user' }
  return next()
}

app.use(cors())
app.use(express.json({ limit: '16mb' }))
app.use(requestLogger)

if (hasClerkKey) {
  app.use(clerkMiddleware())
} else {
  app.use(applyDevAuth)
}

app.use('/health', healthRouter)
app.use('/api/users', usersRouter)
app.use('/api/public', publicRouter)
app.use('/api/profile', profileRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/skills', skillsRouter)
app.use('/api/resume', resumeRouter)
app.use('/api/github-sync', githubSyncRouter)
app.use('/api/dashboard', dashboardRouter)

startGitHubSyncScheduler()

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
    console.log(`DevVault backend listening on port ${PORT}`)
  })
}

module.exports = app
