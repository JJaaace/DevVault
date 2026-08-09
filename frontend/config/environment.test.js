import test from 'node:test'
import assert from 'node:assert/strict'
import { validateFrontendEnvironment } from './environment.js'

test('frontend production configuration requires three non-local production values', () => {
  const valid = validateFrontendEnvironment({
    VITE_API_BASE_URL: 'https://api.devvault.invalid',
    VITE_PUBLIC_APP_URL: 'https://devvault.invalid',
    VITE_CLERK_PUBLISHABLE_KEY: 'pk_live_cHJvZHVjdGlvbl92YWxpZGF0aW9u',
  }, { production: true, throwOnError: false })
  assert.deepEqual(valid.errors, [])

  const invalid = validateFrontendEnvironment({
    VITE_API_BASE_URL: 'http://localhost:5001/api',
    VITE_PUBLIC_APP_URL: 'http://127.0.0.1:5176/portfolio',
    VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_local',
  }, { production: true, throwOnError: false })
  assert.equal(invalid.errors.some((message) => message.includes('local hostname')), true)
  assert.equal(invalid.errors.some((message) => message.includes('origin')), true)
  assert.equal(invalid.errors.some((message) => message.includes('production publishable key')), true)
})
