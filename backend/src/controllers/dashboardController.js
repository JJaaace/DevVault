const { listProjects, serializeOwnerProject } = require('../services/projectService')
const { listSkills } = require('../services/skillService')
const { getLocalStore } = require('../services/localStore')
const { sendSuccess, sendError } = require('../utils/http')
const { buildDashboardPayload } = require('../services/insightService')
const { prisma } = require('../db/prisma')
const { isPostgresMode } = require('../config/persistence')
const { listGoals } = require('../services/goalService')
const { listCertifications } = require('../services/certificationService')
const { getResumeMetadata } = require('../services/resumeService')
const { serializeOwnerProfile } = require('./profileController')

async function loadProfile(clerkUserId) {
  if (isPostgresMode()) {
    return prisma.profile.findUnique({ where: { clerkUserId } })
  }

  return getLocalStore().profiles.find((profile) => profile.clerkUserId === clerkUserId) || null
}

async function getDashboard(req, res) {
  try {
    const profile = await loadProfile(req.auth.userId)

    const [projects, skills, goals, certifications, resume] = await Promise.all([
      listProjects(req.auth.userId),
      listSkills(req.auth.userId),
      listGoals(req.auth.userId),
      listCertifications(req.auth.userId),
      getResumeMetadata(req.auth.userId),
    ])

    const payload = buildDashboardPayload({
      profile: serializeOwnerProfile(profile),
      projects: projects.map(serializeOwnerProject),
      skills,
      goals,
      certifications,
      resume,
    })

    return sendSuccess(res, payload)
  } catch (error) {
    return sendError(res, error, 'DASHBOARD_GET_FAILED', 'Unable to load dashboard insights.')
  }
}

module.exports = {
  getDashboard,
}
