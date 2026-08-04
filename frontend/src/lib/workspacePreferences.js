const WORKSPACE_PREFERENCES_KEY = 'devvault:workspace-preferences'

const defaultPreferences = {
  showCodingStreak: true,
}

function safeParse(rawValue) {
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function readWorkspacePreferences() {
  if (typeof window === 'undefined') {
    return { ...defaultPreferences }
  }

  const parsed = safeParse(window.localStorage.getItem(WORKSPACE_PREFERENCES_KEY))
  if (!parsed) {
    return { ...defaultPreferences }
  }

  return {
    ...defaultPreferences,
    ...parsed,
  }
}

export function saveWorkspacePreferences(nextPreferences) {
  if (typeof window === 'undefined') {
    return
  }

  const merged = {
    ...readWorkspacePreferences(),
    ...nextPreferences,
  }

  window.localStorage.setItem(WORKSPACE_PREFERENCES_KEY, JSON.stringify(merged))
}
