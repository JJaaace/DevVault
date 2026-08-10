import assert from 'node:assert/strict'
import test from 'node:test'
import { getAuthenticatedMediaPath, loadAuthenticatedMediaObjectUrl } from './authenticatedMedia.js'

const API_BASE_URL = 'https://devvault-api.example.com'

test('identifies protected owner profile and project media paths', () => {
  assert.equal(getAuthenticatedMediaPath('/api/profile/image?v=7', API_BASE_URL), '/api/profile/image?v=7')
  assert.equal(
    getAuthenticatedMediaPath(`${API_BASE_URL}/api/projects/5/artwork?v=12`, API_BASE_URL),
    '/api/projects/5/artwork?v=12',
  )
})

test('leaves public, external, embedded, and static media outside authenticated loading', () => {
  assert.equal(getAuthenticatedMediaPath('/api/public/portfolio/jace/profile-image', API_BASE_URL), null)
  assert.equal(getAuthenticatedMediaPath(`${API_BASE_URL}/api/public/portfolio/jace/profile-image`, API_BASE_URL), null)
  assert.equal(getAuthenticatedMediaPath('https://avatars.githubusercontent.com/u/123', API_BASE_URL), null)
  assert.equal(getAuthenticatedMediaPath('data:image/png;base64,abc', API_BASE_URL), null)
  assert.equal(getAuthenticatedMediaPath('blob:https://devvault.example.com/id', API_BASE_URL), null)
  assert.equal(getAuthenticatedMediaPath('/project-showcase/devvault.svg', API_BASE_URL), null)
})

test('loads protected media with the authenticated blob request and revokes its object URL once', async () => {
  const tokenProvider = async () => 'test-token-not-a-secret'
  const blob = new Blob(['image-bytes'], { type: 'image/png' })
  const calls = []
  const revoked = []

  const result = await loadAuthenticatedMediaObjectUrl('/api/profile/image?v=3', tokenProvider, {
    apiBaseUrl: API_BASE_URL,
    request: async (...args) => {
      calls.push(args)
      return blob
    },
    createObjectURL: (value) => {
      assert.equal(value, blob)
      return 'blob:authenticated-profile'
    },
    revokeObjectURL: (url) => revoked.push(url),
  })

  assert.equal(result.url, 'blob:authenticated-profile')
  assert.deepEqual(calls, [['/api/profile/image?v=3', {}, tokenProvider]])
  result.revoke()
  result.revoke()
  assert.deepEqual(revoked, ['blob:authenticated-profile'])
})

test('returns external media directly without making an authenticated request', async () => {
  let requested = false
  const source = 'https://avatars.githubusercontent.com/u/123'
  const result = await loadAuthenticatedMediaObjectUrl(source, async () => '', {
    apiBaseUrl: API_BASE_URL,
    request: async () => {
      requested = true
      return new Blob()
    },
    createObjectURL: () => 'blob:unexpected',
    revokeObjectURL: () => {},
  })

  assert.equal(result.url, source)
  assert.equal(requested, false)
})
