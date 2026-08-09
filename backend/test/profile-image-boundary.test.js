const assert = require('node:assert/strict')
const test = require('node:test')

require('dotenv').config()

const { buildProfileUpdatePayload, validateProfileImage } = require('../src/controllers/profileController')

function validProfile(profileImageUrl) {
  return {
    firstName: 'Jace',
    lastName: 'Joseph',
    username: 'JJaaace',
    bio: 'Developer profile used for boundary verification.',
    profileImageUrl,
  }
}

test('ordinary profile update data can exclude the profile picture', () => {
  const profileData = buildProfileUpdatePayload(
    validProfile('data:image/png;base64,canonical-picture'),
    'dev-local-user',
  )

  assert.equal(Object.hasOwn(profileData, 'profileImageUrl'), false)
})

test('dedicated profile picture validation accepts explicit removal and supported uploads', () => {
  assert.equal(validateProfileImage(''), null)
  assert.equal(validateProfileImage('data:image/png;base64,picture'), null)
  assert.match(validateProfileImage('https://avatars.githubusercontent.com/example'), /PNG, JPG, JPEG, or WEBP/)
})
