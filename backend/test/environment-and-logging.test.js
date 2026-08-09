const test = require('node:test')
const assert = require('node:assert/strict')

process.env.NODE_ENV = 'test'
require('dotenv').config()

const { validateBackendEnvironment } = require('../src/config/environment')
const { sanitize, sanitizeText } = require('../src/utils/logger')

const SYNTHETIC_LIVE_CLERK_PUBLISHABLE_KEY = ['pk', 'live', 'devvault-fixture-not-a-secret'].join('_')
const SYNTHETIC_LIVE_CLERK_SECRET_KEY = ['sk', 'live', 'devvault-fixture-not-a-secret'].join('_')

function syntheticDatabaseUrl(hostname) {
  const url = new URL(`postgresql://${hostname}:5432/devvault`)
  url.username = 'devvault-fixture'
  url.password = 'not-a-secret'
  url.searchParams.set('sslmode', 'require')
  return url.toString()
}

function production(overrides = {}) {
  return {
    NODE_ENV: 'production',
    PERSISTENCE_MODE: 'postgres',
    DATABASE_URL: syntheticDatabaseUrl('db.example.invalid'),
    CLERK_PUBLISHABLE_KEY: SYNTHETIC_LIVE_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: SYNTHETIC_LIVE_CLERK_SECRET_KEY,
    CORS_ORIGINS: 'https://devvault.invalid',
    ...overrides,
  }
}

test('production backend configuration accepts a complete non-local contract', () => {
  const result = validateBackendEnvironment(production(), { throwOnError: false })
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.corsOrigins, ['https://devvault.invalid'])
  assert.equal(result.persistenceMode, 'postgres')
})

test('production backend configuration rejects local URLs, dev identity, test keys, and wildcard CORS', () => {
  const result = validateBackendEnvironment(production({
    DATABASE_URL: syntheticDatabaseUrl('localhost'),
    CLERK_PUBLISHABLE_KEY: 'pk_test_local',
    CLERK_SECRET_KEY: 'sk_test_local',
    CORS_ORIGINS: '*',
    DEV_CLERK_USER_ID: 'dev-local-user',
  }), { throwOnError: false })
  assert.equal(result.errors.some((message) => message.includes('local hostname')), true)
  assert.equal(result.errors.some((message) => message.includes('DEV_CLERK_USER_ID')), true)
  assert.equal(result.errors.some((message) => message.includes('wildcard')), true)
  assert.equal(result.errors.some((message) => message.includes('production publishable key')), true)
  assert.equal(result.errors.some((message) => message.includes('production secret key')), true)
})

test('production refuses to initialize when Clerk authentication is unavailable', () => {
  const result = validateBackendEnvironment(production({ CLERK_PUBLISHABLE_KEY: '', CLERK_SECRET_KEY: '' }), { throwOnError: false })
  assert.equal(result.errors.some((message) => message.includes('CLERK_PUBLISHABLE_KEY is required')), true)
  assert.equal(result.errors.some((message) => message.includes('CLERK_SECRET_KEY is required')), true)
})

test('safe logger redacts credentials, binary payload fields, bearer tokens, and data URLs', () => {
  const sanitized = sanitize({
    authorization: 'Bearer visible-token',
    databaseUrl: 'postgresql://secret',
    profileImageUrl: 'data:image/png;base64,AAAA',
    nested: { fileData: 'document bytes', message: 'Bearer abc.def.ghi' },
  })
  assert.equal(sanitized.authorization, '[REDACTED]')
  assert.equal(sanitized.databaseUrl, '[REDACTED]')
  assert.equal(sanitized.profileImageUrl, '[REDACTED]')
  assert.equal(sanitized.nested.fileData, '[REDACTED]')
  assert.equal(sanitizeText(sanitized.nested.message), 'Bearer [REDACTED]')
})
