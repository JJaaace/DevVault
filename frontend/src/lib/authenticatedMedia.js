const OWNER_MEDIA_PATHS = [
  /^\/api\/profile\/image(?:\?|$)/,
  /^\/api\/projects\/[^/]+\/artwork(?:\?|$)/,
]

function isOwnerMediaPath(path) {
  return OWNER_MEDIA_PATHS.some((pattern) => pattern.test(path))
}

export function getAuthenticatedMediaPath(source, apiBaseUrl = '') {
  const value = String(source || '').trim()
  if (!value || /^(?:data:|blob:)/i.test(value)) return null

  if (value.startsWith('/')) {
    return isOwnerMediaPath(value) ? value : null
  }

  if (!/^https?:\/\//i.test(value) || !apiBaseUrl) return null

  try {
    const sourceUrl = new URL(value)
    const apiUrl = new URL(apiBaseUrl)
    if (sourceUrl.origin !== apiUrl.origin) return null

    const path = `${sourceUrl.pathname}${sourceUrl.search}`
    return isOwnerMediaPath(path) ? path : null
  } catch {
    return null
  }
}

export async function loadAuthenticatedMediaObjectUrl(source, getToken, options) {
  const {
    apiBaseUrl = '',
    request,
    createObjectURL,
    revokeObjectURL,
  } = options || {}
  const path = getAuthenticatedMediaPath(source, apiBaseUrl)

  if (!path) {
    return { url: String(source || ''), revoke: () => {} }
  }

  if (typeof request !== 'function' || typeof createObjectURL !== 'function' || typeof revokeObjectURL !== 'function') {
    throw new TypeError('Authenticated media loading requires request and object URL helpers.')
  }

  const blob = await request(path, {}, getToken)
  const url = createObjectURL(blob)
  let revoked = false

  return {
    url,
    revoke() {
      if (revoked) return
      revoked = true
      revokeObjectURL(url)
    },
  }
}
