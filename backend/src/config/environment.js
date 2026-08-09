const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])
const SUPPORTED_NODE_ENVS = new Set(['development', 'test', 'production'])
const SUPPORTED_PERSISTENCE_MODES = new Set(['postgres', 'local'])

function clean(value) {
  return String(value || '').trim()
}

function isPlaceholder(value) {
  return /replace[_-]?me|your[_-]|example|randompassword/i.test(clean(value))
}

function parseUrl(name, value, errors, { protocols, production, allowLocal = true, originOnly = false } = {}) {
  const normalized = clean(value).replace(/\/$/, '')
  if (!normalized) return ''

  try {
    const parsed = new URL(normalized)
    if (protocols && !protocols.includes(parsed.protocol)) {
      errors.push(`${name} must use ${protocols.join(' or ')}.`)
    }
    if (production && !allowLocal && LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
      errors.push(`${name} must not use a local hostname in production.`)
    }
    if (originOnly && (parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password)) {
      errors.push(`${name} entries must be origins only, without paths, credentials, queries, or fragments.`)
    }
    return originOnly ? parsed.origin : normalized
  } catch {
    errors.push(`${name} must be a valid URL.`)
    return normalized
  }
}

function parseCorsOrigins(value, errors, production) {
  const rawOrigins = clean(value).split(',').map((item) => item.trim()).filter(Boolean)
  const origins = []

  for (const rawOrigin of rawOrigins) {
    if (rawOrigin === '*') {
      errors.push('CORS_ORIGINS must not contain a wildcard.')
      continue
    }
    const origin = parseUrl('CORS_ORIGINS', rawOrigin, errors, {
      protocols: production ? ['https:'] : ['http:', 'https:'],
      production,
      allowLocal: !production,
      originOnly: true,
    })
    if (origin && !origins.includes(origin)) origins.push(origin)
  }

  return origins
}

function validateBackendEnvironment(values = process.env, { throwOnError = true } = {}) {
  const errors = []
  const nodeEnv = clean(values.NODE_ENV)
  const production = nodeEnv === 'production'
  const persistenceMode = clean(values.PERSISTENCE_MODE).toLowerCase() || 'postgres'

  if (!nodeEnv) errors.push('NODE_ENV is required and must be development, test, or production.')
  else if (!SUPPORTED_NODE_ENVS.has(nodeEnv)) errors.push('NODE_ENV must be development, test, or production.')
  if (!SUPPORTED_PERSISTENCE_MODES.has(persistenceMode)) errors.push('PERSISTENCE_MODE must be postgres or local.')
  if (production && persistenceMode !== 'postgres') errors.push('PERSISTENCE_MODE must be postgres in production.')
  if (production && clean(values.DEV_CLERK_USER_ID)) errors.push('DEV_CLERK_USER_ID must not be set in production.')

  const databaseUrl = clean(values.DATABASE_URL)
  if (persistenceMode === 'postgres' && !databaseUrl) {
    errors.push('DATABASE_URL is required when PERSISTENCE_MODE=postgres.')
  } else if (databaseUrl) {
    parseUrl('DATABASE_URL', databaseUrl, errors, {
      protocols: ['postgres:', 'postgresql:'],
      production,
      allowLocal: !production,
    })
  }

  const clerkPublishableKey = clean(values.CLERK_PUBLISHABLE_KEY)
  const clerkSecretKey = clean(values.CLERK_SECRET_KEY)
  if (production) {
    if (!clerkPublishableKey) errors.push('CLERK_PUBLISHABLE_KEY is required in production.')
    if (!clerkSecretKey) errors.push('CLERK_SECRET_KEY is required in production.')
    if (clerkPublishableKey && (isPlaceholder(clerkPublishableKey) || !clerkPublishableKey.startsWith('pk_live_'))) {
      errors.push('CLERK_PUBLISHABLE_KEY must be a production publishable key.')
    }
    if (clerkSecretKey && (isPlaceholder(clerkSecretKey) || !clerkSecretKey.startsWith('sk_live_'))) {
      errors.push('CLERK_SECRET_KEY must be a production secret key.')
    }
  }

  const corsOrigins = parseCorsOrigins(values.CORS_ORIGINS, errors, production)
  if (production && !corsOrigins.length) errors.push('CORS_ORIGINS requires at least one HTTPS frontend origin in production.')

  const port = Number.parseInt(clean(values.PORT) || '5000', 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('PORT must be an integer between 1 and 65535.')

  if (errors.length && throwOnError) {
    throw new Error(`Invalid backend configuration:\n- ${errors.join('\n- ')}`)
  }

  return Object.freeze({
    errors,
    nodeEnv,
    isProduction: production,
    persistenceMode,
    databaseUrl,
    clerkPublishableKey,
    clerkSecretKey,
    hasClerkConfig: Boolean(clerkPublishableKey && clerkSecretKey && !isPlaceholder(clerkPublishableKey) && !isPlaceholder(clerkSecretKey)),
    corsOrigins,
    port,
    devClerkUserId: clean(values.DEV_CLERK_USER_ID) || 'dev-local-user',
    githubToken: clean(values.GITHUB_TOKEN || values.GH_TOKEN || values.GITHUB_ACCESS_TOKEN),
  })
}

const environment = validateBackendEnvironment()

module.exports = {
  environment,
  validateBackendEnvironment,
  parseCorsOrigins,
  LOCAL_HOSTNAMES,
}
