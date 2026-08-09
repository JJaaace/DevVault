import assert from 'node:assert/strict'
import test from 'node:test'
import { readStoredProfile, saveStoredProfile } from './profileStorage.js'

function withLocalStorage(localStorage, callback) {
  const previousWindow = globalThis.window
  globalThis.window = { localStorage }

  try {
    callback()
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
}

test('profile cache excludes embedded images while preserving profile fields', () => {
  let storedValue = ''
  const localStorage = {
    getItem: () => storedValue || null,
    setItem: (_key, value) => { storedValue = value },
    removeItem: () => { storedValue = '' },
  }

  withLocalStorage(localStorage, () => {
    const cached = saveStoredProfile({ username: 'JJaaace', bio: 'Updated profile', profileImageUrl: 'data:image/png;base64,large-image' })

    assert.equal(cached.username, 'JJaaace')
    assert.equal(cached.bio, 'Updated profile')
    assert.equal(cached.profileImageUrl, null)
    assert.equal(JSON.parse(storedValue).profileImageUrl, null)
  })
})

test('profile cache quota failures never escape into the profile save flow', () => {
  let attempts = 0
  const localStorage = {
    getItem: () => null,
    setItem: () => {
      attempts += 1
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    },
    removeItem: () => {},
  }

  withLocalStorage(localStorage, () => {
    assert.doesNotThrow(() => saveStoredProfile({ username: 'JJaaace' }))
    assert.equal(saveStoredProfile({ username: 'JJaaace' }), null)
    assert.equal(attempts, 4)
  })
})

test('reading an old oversized cache replaces its embedded image', () => {
  let storedValue = JSON.stringify({ username: 'JJaaace', profileImageUrl: 'data:image/jpeg;base64,old-image' })
  const localStorage = {
    getItem: () => storedValue,
    setItem: (_key, value) => { storedValue = value },
    removeItem: () => { storedValue = '' },
  }

  withLocalStorage(localStorage, () => {
    const cached = readStoredProfile()

    assert.equal(cached.profileImageUrl, null)
    assert.equal(JSON.parse(storedValue).profileImageUrl, null)
  })
})
