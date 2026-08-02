let prisma = null

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
} catch (error) {
  prisma = null
}

const { getLocalStore } = require('./localStore')
const { getActiveGitHubSyncJob, startGitHubSync } = require('./githubSyncService')

let schedulerStarted = false
let intervalHandle = null

function getSyncIntervalMs() {
  const minutes = Number(process.env.GITHUB_SYNC_INTERVAL_MINUTES || 5)
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 5
  return safeMinutes * 60 * 1000
}

function getInitialDelayMs() {
  const seconds = Number(process.env.GITHUB_SYNC_INITIAL_DELAY_SECONDS || 15)
  const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 15
  return safeSeconds * 1000
}

async function listGitHubProfiles() {
  if (prisma) {
    try {
      return prisma.profile.findMany({
        where: { githubUrl: { not: null } },
        select: {
          clerkUserId: true,
          githubUrl: true,
          githubLastSyncedAt: true,
        },
      })
    } catch (error) {
      // fall through to local storage
    }
  }

  return getLocalStore().profiles.filter((profile) => Boolean(profile.githubUrl))
}

function shouldSyncProfile(profile, intervalMs) {
  if (!profile?.githubUrl) {
    return false
  }

  if (!profile.githubLastSyncedAt) {
    return true
  }

  const lastSyncedAt = new Date(profile.githubLastSyncedAt).getTime()
  if (Number.isNaN(lastSyncedAt)) {
    return true
  }

  return (Date.now() - lastSyncedAt) >= intervalMs
}

async function runGitHubSyncSweep() {
  const intervalMs = getSyncIntervalMs()
  const profiles = await listGitHubProfiles()

  for (const profile of profiles) {
    if (!shouldSyncProfile(profile, intervalMs)) {
      continue
    }

    if (getActiveGitHubSyncJob(profile.clerkUserId)) {
      continue
    }

    startGitHubSync(profile.clerkUserId)
  }
}

function startGitHubSyncScheduler() {
  if (schedulerStarted) {
    return
  }

  schedulerStarted = true

  const sweep = () => {
    runGitHubSyncSweep().catch(() => {
      // keep the scheduler alive even if a sweep fails
    })
  }

  const initialDelay = getInitialDelayMs()
  if (initialDelay > 0) {
    setTimeout(sweep, initialDelay)
  } else {
    sweep()
  }

  intervalHandle = setInterval(sweep, getSyncIntervalMs())
  if (typeof intervalHandle?.unref === 'function') {
    intervalHandle.unref()
  }
}

module.exports = {
  startGitHubSyncScheduler,
  runGitHubSyncSweep,
}