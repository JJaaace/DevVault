const fs = require('fs')
const path = require('path')

const storeDir = path.join(__dirname, '..', '..', '.data')
const storePath = path.join(storeDir, 'devvault-local-store.json')

const defaultStore = {
  profiles: [],
  projects: [],
  skills: [],
  nextProjectId: 1,
  nextSkillId: 1,
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
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
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
  })

  return saveLocalStore(next)
}

module.exports = {
  getLocalStore,
  saveLocalStore,
  updateLocalStore,
  storePath,
}