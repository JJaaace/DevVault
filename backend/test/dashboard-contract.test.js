const test = require('node:test')
const assert = require('node:assert/strict')

process.env.NODE_ENV = 'test'

const app = require('../src/app')
const { prisma } = require('../src/db/prisma')
const { buildDashboardPayload } = require('../src/services/insightService')
const { __test: certificationTest } = require('../src/services/certificationService')

test('dashboard insight ranking uses experience, relationships, and level without percentages', () => {
  const payload = buildDashboardPayload({
    profile: { firstName: 'Test', username: 'test' },
    projects: [{ status: 'BUILDING' }],
    skills: [
      { id: 1, name: 'A', yearsExperience: 1, projectsBuilt: 1, experienceLevel: 'INTERMEDIATE' },
      { id: 2, name: 'B', yearsExperience: 2, projectsBuilt: 0, experienceLevel: 'BEGINNER' },
    ],
    goals: [],
    certifications: [],
    resume: { uploaded: false },
  })

  assert.equal(payload.topSkills[0].name, 'B')
  assert.equal(JSON.stringify(payload).includes('percentage'), false)
  assert.deepEqual(Object.keys(payload.workspace), ['profile', 'projects', 'skills', 'goals', 'certifications', 'resume'])
  assert.equal(payload.commandDeck.currentProject.status, 'BUILDING')
  assert.equal(payload.commandDeck.evidence.technologies, 2)
})

test('dashboard command deck derives focus, credentials, wins, and technology ranking from workspace data', () => {
  const payload = buildDashboardPayload({
    profile: { firstName: 'Test', favoriteLanguage: 'Java' },
    projects: [
      { id: 1, title: 'Current', featured: true, status: 'BUILDING', techStack: ['React'], updatedAt: '2026-08-01' },
      { id: 2, title: 'Shipped', status: 'COMPLETED', githubUpdatedAt: '2026-07-01' },
    ],
    skills: [
      { id: 1, name: 'React', projectsBuilt: 1, yearsExperience: 1, experienceLevel: 'ADVANCED' },
      { id: 2, name: 'Java', projectsBuilt: 0, yearsExperience: 1, experienceLevel: 'INTERMEDIATE' },
    ],
    goals: [
      { id: 1, title: 'Active', status: 'current', pinned: true, displayOrder: 2, targetCompletion: '2026-09-01' },
      { id: 2, title: 'Done', status: 'complete', targetCompletion: '2026-06-01' },
    ],
    certifications: [
      { id: 1, name: 'API Foundations', status: 'earned', issueDate: '2026-05-01', year: 2026 },
      { id: 2, name: 'Learning', status: 'in-progress', year: 2026 },
    ],
    resume: { uploaded: true },
  })

  assert.equal(payload.commandDeck.currentProject.title, 'Current')
  assert.equal(payload.commandDeck.focusGoals[0].title, 'Active')
  assert.equal(payload.commandDeck.credentialSpotlight.learning.name, 'Learning')
  assert.equal(payload.commandDeck.technologyBench[0].name, 'Java')
  assert.equal(payload.commandDeck.recentWins.some((win) => win.title === 'Earned API Foundations'), true)
  assert.equal(payload.commandDeck.recentWins.some((win) => win.title === 'Completed Done'), true)
  assert.equal(payload.commandDeck.recentWins.find((win) => win.title === 'Completed Shipped').date, null)
  assert.equal(payload.commandDeck.evidence.hasResume, true)
})

test('certification storage accepts non-preview files without treating them as images', () => {
  const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${Buffer.from('certificate document').toString('base64')}`
  const parsed = certificationTest.parseAssetDataUrl(dataUrl)
  assert.equal(parsed.assetMimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  assert.equal(parsed.assetData.toString(), 'certificate document')
  const serialized = certificationTest.serialize({ id: 99, assetMimeType: parsed.assetMimeType, updatedAt: new Date(), issueDate: null })
  assert.equal(serialized.assetType, 'file')
})

test('read-only owner and public APIs expose the migrated workspace safely', async (t) => {
  const server = app.listen(0)
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await prisma.$disconnect()
  })
  await new Promise((resolve) => server.once('listening', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  async function get(path) {
    const response = await fetch(`${baseUrl}${path}`)
    const body = await response.json()
    assert.equal(response.status, 200, `${path}: ${JSON.stringify(body)}`)
    return body.data
  }

  const [health, readiness, projects, skills, goals, certifications, dashboard, portfolio, portfolioOverview] = await Promise.all([
    get('/health'),
    get('/ready'),
    get('/api/projects'),
    get('/api/skills'),
    get('/api/goals'),
    get('/api/certifications'),
    get('/api/dashboard'),
    get('/api/public/portfolio/JJaaace'),
    get('/api/public/portfolio/JJaaace/overview'),
  ])

  assert.equal(health.status, 'ok')
  assert.equal(readiness.database, 'reachable')
  assert.equal(dashboard.workspace.projects.length, projects.length)
  assert.equal(dashboard.workspace.skills.length, skills.length)
  assert.equal(dashboard.workspace.goals.length, goals.length)
  assert.equal(dashboard.workspace.certifications.length, certifications.length)
  assert.equal(projects.filter((project) => project.featured).length <= 1, true)
  assert.equal(projects.some((project) => project.id === dashboard.commandDeck.currentProject.id), true)
  if (projects.some((project) => project.featured)) {
    assert.equal(dashboard.commandDeck.currentProject.id, projects.find((project) => project.featured).id)
  }
  assert.equal(dashboard.commandDeck.evidence.projects, projects.length)
  assert.equal(dashboard.commandDeck.evidence.technologies, skills.length)
  assert.equal(dashboard.commandDeck.evidence.credentials, certifications.filter((certification) => certification.status === 'earned').length)
  assert.equal(dashboard.commandDeck.focusGoals.every((goal) => goal.status === 'current' || goal.status === 'future'), true)
  assert.equal(dashboard.commandDeck.credentialSpotlight.learning.status, 'in-progress')
  assert.equal(dashboard.commandDeck.technologyBench.length, Math.min(skills.length, 8))
  const favoriteSkills = skills.filter((skill) => skill.favorite)
  assert.equal(favoriteSkills.length, 1)
  assert.equal(dashboard.workspace.skills.find((skill) => skill.favorite)?.id, favoriteSkills[0].id)
  assert.equal(portfolio.skills.find((skill) => skill.favorite)?.id, favoriteSkills[0].id)
  assert.equal(portfolio.profile.username, 'JJaaace')
  assert.equal(portfolioOverview.profile.username, portfolio.profile.username)
  assert.equal('clerkUserId' in portfolio.profile, false)
  assert.equal(JSON.stringify(portfolio).includes('ownerClerkUserId'), false)
  assert.equal(portfolio.certifications.some((certification) => Object.hasOwn(certification, 'notes')), false)
  assert.equal(portfolio.goals.some((goal) => Object.hasOwn(goal, 'notes') || Object.hasOwn(goal, 'resources')), false)
  assert.equal(Object.hasOwn(portfolio.resume || {}, 'content'), false)
  assert.equal(JSON.stringify({ skills, dashboard, portfolio }).includes('percentage'), false)

  const guestWriteAttempt = await fetch(`${baseUrl}/api/public/portfolio/JJaaace`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ bio: 'guest write attempt' }),
  })
  assert.equal(guestWriteAttempt.status, 404)
  const portfolioAfterGuestWrite = await get('/api/public/portfolio/JJaaace')
  assert.equal(portfolioAfterGuestWrite.profile.bio, portfolio.profile.bio)

  if (portfolio.resume?.uploaded) {
    const resumeResponse = await fetch(`${baseUrl}${portfolio.resume.fileUrl}`)
    assert.equal(resumeResponse.status, 200)
    assert.equal(resumeResponse.headers.get('content-type'), 'application/pdf')
    assert.equal(Number(resumeResponse.headers.get('content-length')), portfolio.resume.byteSize)
  }

  const publicCertificationWithAsset = portfolio.certifications.find((certification) => certification.assetUrl)
  if (publicCertificationWithAsset) {
    const assetResponse = await fetch(`${baseUrl}${publicCertificationWithAsset.assetUrl}`)
    assert.equal(assetResponse.status, 200)
    assert.equal(Number(assetResponse.headers.get('content-length')) > 0, true)
  }
})
