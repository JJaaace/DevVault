const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { clerkMiddleware } = require('@clerk/express')
const healthRouter = require('./routes/health')
const usersRouter = require('./routes/users')
const profileRouter = require('./routes/profile')
const projectsRouter = require('./routes/projects')
const skillsRouter = require('./routes/skills')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

app.use('/health', healthRouter)
app.use('/api/users', usersRouter)
app.use('/api/profile', profileRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/skills', skillsRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DevVault API' })
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DevVault backend listening on port ${PORT}`)
  })
}

module.exports = app
