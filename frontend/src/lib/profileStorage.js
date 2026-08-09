const STORAGE_KEY = 'devvault-profile'
const EMBEDDED_IMAGE_PATTERN = /^(?:data:image\/|blob:)/i

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStoredProfile() {
  if (!isBrowser()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const profile = JSON.parse(raw)
    const payload = createCachePayload(profile)

    // Older DevVault versions cached the full base64 profile picture. Replace
    // that oversized entry as soon as it is encountered.
    if (payload.profileImageUrl !== profile.profileImageUrl || payload.profileImage !== profile.profileImage) {
      writeCachePayload(payload)
    }

    return payload
  } catch {
    return null
  }
}

export function createCachePayload(profile) {
  const payload = {
    ...profile,
    savedAt: new Date().toISOString(),
  }

  if (EMBEDDED_IMAGE_PATTERN.test(payload.profileImageUrl || '')) {
    payload.profileImageUrl = null
  }

  if (EMBEDDED_IMAGE_PATTERN.test(payload.profileImage || '')) {
    payload.profileImage = null
  }

  return payload
}

function writeCachePayload(payload) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return payload
  } catch {
    // The profile is only a convenience cache. If an older oversized entry is
    // consuming the quota, remove only this cache key and retry once.
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      return payload
    } catch {
      return null
    }
  }
}

export function saveStoredProfile(profile) {
  if (!isBrowser()) {
    return null
  }

  return writeCachePayload(createCachePayload(profile))
}

export function clearStoredProfile() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
