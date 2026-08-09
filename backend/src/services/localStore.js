const fs = require('fs')
const path = require('path')

const storeDir = path.join(__dirname, '..', '..', '.data')
const storePath = path.join(storeDir, 'devvault-local-store.json')

const defaultStore = {
  profiles: [],
  projects: [],
  skills: [],
  goals: [],
  certifications: [],
  certificationRoadmap: [],
  nextProjectId: 1,
  nextSkillId: 1,
  nextGoalId: 1,
  nextCertificationId: 1,
  nextCertificationRoadmapId: 1,
}

function normalizeLegacyProjectStatus(project) {
  const legacyStatus = typeof project?.status === 'string' ? project.status : ''

  if (legacyStatus === 'IN_PROGRESS') {
    return 'BUILDING'
  }

  if (legacyStatus === 'PLANNING' || legacyStatus === 'BUILDING' || legacyStatus === 'COMPLETED' || legacyStatus === 'ARCHIVED') {
    return legacyStatus
  }

  const legacyProgress = Number(project?.completionPercentage)
  if (Number.isFinite(legacyProgress)) {
    if (legacyProgress >= 100) {
      return 'COMPLETED'
    }

    if (legacyProgress > 0) {
      return 'BUILDING'
    }
  }

  return 'PLANNING'
}

function migrateLegacyProjects(projects) {
  return projects.map((project) => {
    const { completionPercentage, ...rest } = project || {}
    return {
      ...rest,
      status: normalizeLegacyProjectStatus(project),
    }
  })
}

function migrateLegacySkills(skills) {
  const currentYear = new Date().getFullYear()

  return skills.map((skill) => {
    const { percentage: ignored, ...skillWithoutPercentage } = skill || {}
    const safeYears = Number.isInteger(skill?.yearsExperience) ? skill.yearsExperience : 0
    const firstUsedYear = Number.isInteger(skill?.firstUsedYear)
      ? skill.firstUsedYear
      : (safeYears > 0 ? currentYear - safeYears : currentYear)

    return {
      ...skillWithoutPercentage,
      technologyKey: typeof skill?.technologyKey === 'string' ? skill.technologyKey : String(skill?.name || '').trim().toLowerCase().replace(/\s+/g, '-'),
      experienceLevel: skill?.experienceLevel || 'BEGINNER',
      favorite: Boolean(skill?.favorite),
      yearsExperience: safeYears,
      firstUsedYear,
      projectsBuilt: Number.isInteger(skill?.projectsBuilt) ? skill.projectsBuilt : 0,
    }
  })
}

let cachedStore = null

function ensureStoreDir() {
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true })
  }
}

function readStoreFromDisk() {
  try {
    const raw = fs.readFileSync(storePath, 'utf8')
    const parsed = JSON.parse(raw)

    return {
      ...defaultStore,
      ...parsed,
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      projects: Array.isArray(parsed.projects) ? migrateLegacyProjects(parsed.projects) : [],
      skills: Array.isArray(parsed.skills) ? migrateLegacySkills(parsed.skills) : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      certificationRoadmap: Array.isArray(parsed.certificationRoadmap) ? parsed.certificationRoadmap : [],
    }
  } catch {
    return { ...defaultStore }
  }
}

function getLocalStore() {
  if (!cachedStore) {
    cachedStore = readStoreFromDisk()
  }

  return cachedStore
}

function saveLocalStore(nextStore) {
  cachedStore = {
    ...defaultStore,
    ...nextStore,
    profiles: Array.isArray(nextStore.profiles) ? nextStore.profiles : [],
    projects: Array.isArray(nextStore.projects) ? nextStore.projects : [],
    skills: Array.isArray(nextStore.skills) ? nextStore.skills : [],
    goals: Array.isArray(nextStore.goals) ? nextStore.goals : [],
    certifications: Array.isArray(nextStore.certifications) ? nextStore.certifications : [],
    certificationRoadmap: Array.isArray(nextStore.certificationRoadmap) ? nextStore.certificationRoadmap : [],
  }

  ensureStoreDir()
  fs.writeFileSync(storePath, `${JSON.stringify(cachedStore, null, 2)}\n`)
  return cachedStore
}

function updateLocalStore(updater) {
  const current = getLocalStore()
  const next = updater({
    ...current,
    profiles: [...current.profiles],
    projects: [...current.projects],
    skills: [...current.skills],
    goals: [...current.goals],
    certifications: [...current.certifications],
    certificationRoadmap: [...current.certificationRoadmap],
  })

  return saveLocalStore(next)
}

module.exports = {
  getLocalStore,
  saveLocalStore,
  updateLocalStore,
  storePath,
}
