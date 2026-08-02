const { listProjects } = require('../services/projectService')
const { listSkills } = require('../services/skillService')
const { getLocalStore } = require('../services/localStore')
const { sendSuccess, sendError } = require('../utils/http')
const { buildDashboardPayload } = require('../services/insightService')

let prisma = null

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
} catch (error) {
  prisma = null
}

async function loadProfile(clerkUserId) {
  if (prisma) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { clerkUserId },
      })

      if (profile) {
        return profile
      }
    } catch {
      // Fall through to local store.
    }
  }

  return getLocalStore().profiles.find((profile) => profile.clerkUserId === clerkUserId) || null
}

async function getDashboard(req, res) {
  try {
    const profile = await loadProfile(req.auth.userId)

    const [projects, skills] = await Promise.all([
      listProjects(req.auth.userId),
      listSkills(req.auth.userId),
    ])

    const payload = buildDashboardPayload({
      profile,
      projects,
      skills,
    })

    return sendSuccess(res, payload)
  } catch (error) {
    return sendError(res, error, 'DASHBOARD_GET_FAILED', 'Unable to load dashboard insights.')
  }
}

module.exports = {
  getDashboard,
}
