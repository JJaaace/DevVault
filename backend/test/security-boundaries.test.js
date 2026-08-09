const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

process.env.NODE_ENV = 'test'
require('dotenv').config()

const app = require('../src/app')
const { prisma } = require('../src/db/prisma')
const { getProjectById, updateProject } = require('../src/services/projectService')

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

test('public Guest Mode paths are GET-only and expose only the public DTO', async (t) => {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve) }))
  const base = `http://127.0.0.1:${server.address().port}`
  const portfolioPath = '/api/public/portfolio/JJaaace'
  const initialResponse = await fetch(`${base}${portfolioPath}`)
  assert.equal(initialResponse.status, 200)
  const initial = (await initialResponse.json()).data
  const initialDigest = digest(JSON.stringify(initial))

  const serialized = JSON.stringify(initial)
  for (const forbidden of ['clerkUserId', 'ownerClerkUserId', 'assetData', 'content', 'githubSyncState']) {
    assert.equal(serialized.includes(`"${forbidden}"`), false, forbidden)
  }
  assert.equal(initial.certifications.every((item) => !Object.hasOwn(item, 'notes')), true)
  assert.equal(initial.goals.every((item) => !Object.hasOwn(item, 'notes') && !Object.hasOwn(item, 'resources')), true)

  const publicPaths = [portfolioPath, `${portfolioPath}/overview`]
  for (const publicPath of publicPaths) {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const response = await fetch(`${base}${publicPath}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: method === 'DELETE' ? undefined : JSON.stringify({ bio: 'unauthorized write' }),
      })
      assert.equal([404, 405].includes(response.status), true, `${method} ${publicPath} returned ${response.status}`)
    }
  }

  const after = (await (await fetch(`${base}${portfolioPath}`)).json()).data
  assert.equal(digest(JSON.stringify(after)), initialDigest)

  if (initial.profile.profileImageUrl) {
    const image = await fetch(`${base}${initial.profile.profileImageUrl}`)
    assert.equal(image.status, 200)
    assert.match(image.headers.get('content-type'), /^image\//)
  }
  if (initial.resume?.uploaded) {
    const resume = await fetch(`${base}${initial.resume.fileUrl}`)
    assert.equal(resume.status, 200)
    assert.equal(resume.headers.get('content-type'), 'application/pdf')
  }
  const asset = initial.certifications.find((item) => item.assetUrl)
  if (asset) assert.equal((await fetch(`${base}${asset.assetUrl}`)).status, 200)
})

test('owner JSON streams the profile image separately instead of embedding megabytes', async (t) => {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve) }))
  const base = `http://127.0.0.1:${server.address().port}`
  const profileResponse = await fetch(`${base}/api/profile`)
  const profileBody = await profileResponse.text()
  assert.equal(profileResponse.status, 200)
  assert.equal(profileBody.length < 50000, true)
  const profile = JSON.parse(profileBody).data
  assert.match(profile.profileImageUrl, /^\/api\/profile\/image\?v=/)
  const image = await fetch(`${base}${profile.profileImageUrl}`)
  assert.equal(image.status, 200)
  assert.match(image.headers.get('cache-control'), /^private/)

  const projectsResponse = await fetch(`${base}/api/projects`)
  const projectsBody = await projectsResponse.text()
  assert.equal(projectsBody.length < 250000, true)
  const projects = JSON.parse(projectsBody).data
  const streamedArtwork = projects.find((project) => /^\/api\/projects\/\d+\/artwork\?v=/.test(project.bannerImageUrl || ''))
  assert.ok(streamedArtwork)
  const artwork = await fetch(`${base}${streamedArtwork.bannerImageUrl}`)
  assert.equal(artwork.status, 200)
  assert.match(artwork.headers.get('content-type'), /^image\//)
  assert.match(artwork.headers.get('cache-control'), /^private/)
})

test('wrong owner identity cannot read or update another owner project and creates no user record', async () => {
  const wrongOwner = 'user_wrong_owner_boundary_test'
  const beforeUsers = await prisma.user.count()
  await assert.rejects(() => getProjectById(wrongOwner, 1), (error) => error.statusCode === 404)
  await assert.rejects(() => updateProject(wrongOwner, 1, {}), (error) => error.statusCode === 404)
  assert.equal(await prisma.user.count(), beforeUsers)
  assert.equal(await prisma.user.findUnique({ where: { clerkUserId: wrongOwner } }), null)
})

test('all owner mutation route declarations retain authentication middleware', () => {
  const routesDir = path.join(__dirname, '..', 'src', 'routes')
  for (const file of ['profile.js', 'projects.js', 'skills.js', 'resume.js', 'githubSync.js', 'goals.js', 'certifications.js']) {
    const source = fs.readFileSync(path.join(routesDir, file), 'utf8')
    assert.match(source, /protectRoute/, file)
    assert.match(source, /router\.(post|put|patch|delete)/, file)
  }
})

test('backend rejects malformed JSON and unapproved origins without exposing internals', async (t) => {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve) }))
  const base = `http://127.0.0.1:${server.address().port}`

  const malformed = await fetch(`${base}/api/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{invalid',
  })
  assert.equal(malformed.status, 400)
  const malformedBody = await malformed.json()
  assert.equal(malformedBody.error.code, 'INVALID_JSON')
  assert.equal(JSON.stringify(malformedBody).includes('SyntaxError'), false)

  const forbidden = await fetch(`${base}/health`, { headers: { Origin: 'https://unapproved.invalid' } })
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.headers.get('access-control-allow-origin'), null)

  const allowed = await fetch(`${base}/health`, { headers: { Origin: 'http://127.0.0.1:5176' } })
  assert.equal(allowed.status, 200)
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5176')
  assert.equal(allowed.headers.get('x-content-type-options'), 'nosniff')
  const health = await allowed.json()
  assert.deepEqual(health.data, { status: 'ok' })
})
