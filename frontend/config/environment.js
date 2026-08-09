const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

function clean(value) {
  return String(value || '').trim().replace(/\/$/, '')
}

function validateUrl(name, value, errors, { production, originOnly = false } = {}) {
  const normalized = clean(value)
  if (!normalized) return ''
  try {
    const parsed = new URL(normalized)
    if (!['http:', 'https:'].includes(parsed.protocol)) errors.push(`${name} must use http or https.`)
    if (production && parsed.protocol !== 'https:') errors.push(`${name} must use HTTPS in production.`)
    if (production && LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase())) errors.push(`${name} must not use a local hostname in production.`)
    if (originOnly && (parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password)) {
      errors.push(`${name} must be an origin without a path, credentials, query, or fragment.`)
    }
    return originOnly ? parsed.origin : normalized
  } catch {
    errors.push(`${name} must be a valid URL.`)
    return normalized
  }
}

export function validateFrontendEnvironment(values, { production = false, throwOnError = true } = {}) {
  const errors = []
  const apiBaseUrl = validateUrl('VITE_API_BASE_URL', values.VITE_API_BASE_URL, errors, { production, originOnly: true })
  const publicAppUrl = validateUrl('VITE_PUBLIC_APP_URL', values.VITE_PUBLIC_APP_URL, errors, { production, originOnly: true })
  const clerkPublishableKey = clean(values.VITE_CLERK_PUBLISHABLE_KEY)

  if (production && !apiBaseUrl) errors.push('VITE_API_BASE_URL is required in production.')
  if (production && !publicAppUrl) errors.push('VITE_PUBLIC_APP_URL is required in production.')
  if (production && !clerkPublishableKey) errors.push('VITE_CLERK_PUBLISHABLE_KEY is required in production.')
  if (production && clerkPublishableKey && (!clerkPublishableKey.startsWith('pk_live_') || /replace[_-]?me|your[_-]|example/i.test(clerkPublishableKey))) {
    errors.push('VITE_CLERK_PUBLISHABLE_KEY must be a production publishable key.')
  }

  if (errors.length && throwOnError) throw new Error(`Invalid frontend configuration:\n- ${errors.join('\n- ')}`)
  return Object.freeze({ errors, apiBaseUrl, publicAppUrl, clerkPublishableKey })
}
