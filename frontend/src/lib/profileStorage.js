const STORAGE_KEY = 'devvault-profile'

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStoredProfile() {
  if (!isBrowser()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveStoredProfile(profile) {
  if (!isBrowser()) {
    return null
  }

  const payload = {
    ...profile,
    savedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  return payload
}

export function clearStoredProfile() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
