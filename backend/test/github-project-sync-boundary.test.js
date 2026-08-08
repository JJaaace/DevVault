const test = require('node:test')
const assert = require('node:assert/strict')

process.env.NODE_ENV = 'test'
require('dotenv').config()

const { __test: syncTest } = require('../src/services/githubSyncService')
const { GITHUB_PROJECT_METADATA_FIELDS, __test: projectTest } = require('../src/services/projectService')

const repo = {
  id: 44,
  name: 'renamed-repo',
  full_name: 'owner/renamed-repo',
  description: 'short',
  html_url: 'https://github.com/owner/renamed-repo',
  homepage: 'https://demo.example.com',
  stargazers_count: 7,
  forks_count: 2,
  topics: ['node', 'api'],
  language: 'JavaScript',
  updated_at: '2026-08-07T12:00:00.000Z',
  pushed_at: '2026-08-07T11:00:00.000Z',
  archived: false,
}

function linkedProject(overrides = {}) {
  return {
    id: 5,
    title: 'Curated title',
    description: 'A manually written description that remains authoritative.',
    bannerImageUrl: 'data:image/png;base64,curated',
    bannerImageSource: 'CURATED',
    status: 'BUILDING',
    featured: true,
    displayOrder: 3,
    accentTone: 'gold',
    keyFeatures: ['Manual feature'],
    techStack: ['React'],
    liveDemoUrl: 'https://manual-demo.example.com',
    githubRepoId: 44,
    githubFullName: 'owner/old-name',
    githubDescription: 'old',
    githubStars: 1,
    githubForks: 0,
    githubLanguages: ['JavaScript'],
    githubTopics: ['api'],
    githubUrl: 'https://github.com/owner/old-name',
    githubHomepage: null,
    githubUpdatedAt: '2026-08-01T12:00:00.000Z',
    githubPushedAt: '2026-08-01T11:00:00.000Z',
    githubArchivedAt: null,
    ...overrides,
  }
}

test('1. GitHub payload contains only the explicit project metadata allowlist', () => {
  const metadata = syncTest.buildGitHubProjectMetadata(repo, ['JavaScript'])
  assert.equal(Object.keys(metadata).every((field) => GITHUB_PROJECT_METADATA_FIELDS.includes(field)), true)
  assert.equal(metadata.githubRepoId, 44)
  assert.equal(metadata.githubStars, 7)
})

test('2. curated project fields never enter the GitHub metadata write payload', () => {
  const metadata = syncTest.buildGitHubProjectMetadata(repo, ['JavaScript'])
  for (const field of ['title', 'description', 'bannerImageUrl', 'status', 'featured', 'displayOrder', 'accentTone', 'keyFeatures', 'techStack', 'dateStarted', 'liveDemoUrl']) {
    assert.equal(Object.hasOwn(metadata, field), false, field)
  }
})

test('3. stable repository ID keeps a renamed repository linked to the same project', () => {
  assert.equal(syncTest.findLinkedProject([linkedProject()], repo).id, 5)
})

test('4. legacy full-name links still match when no repository ID exists', () => {
  const project = linkedProject({ githubRepoId: null, githubFullName: repo.full_name })
  assert.equal(syncTest.findLinkedProject([project], repo).id, 5)
})

test('5. legacy normalized URL links still match when ID and full name are absent', () => {
  const project = linkedProject({ githubRepoId: null, githubFullName: null, githubUrl: `${repo.html_url}/` })
  assert.equal(syncTest.findLinkedProject([project], repo).id, 5)
})

test('6. unlinked repositories become import candidates and are not auto-created', () => {
  const plan = syncTest.planProjectSync([], [repo])
  assert.equal(plan.linkedRepositories.length, 0)
  assert.equal(plan.importCandidates.length, 1)
  assert.equal(plan.importCandidates[0].githubRepoId, 44)
})

test('7. missing GitHub repositories are reported unavailable without archive instructions', () => {
  const project = linkedProject()
  const plan = syncTest.planProjectSync([project], [])
  assert.deepEqual(plan.unavailable, [{ projectId: 5, title: 'Curated title', githubFullName: 'owner/old-name' }])
  assert.equal(JSON.stringify(plan).includes('ARCHIVED'), false)
})

test('8. planning a sync does not mutate project, profile, skill, certification, goal, or resume data', () => {
  const workspace = {
    projects: [linkedProject()],
    profile: { profileImageUrl: 'custom-photo', bio: 'manual bio' },
    skills: [{ id: 1, notes: 'manual notes' }],
    certifications: [{ id: 1, assetUrl: 'certificate.pdf' }],
    goals: [{ id: 1, title: 'Manual goal' }],
    resume: { fileName: 'resume.pdf' },
  }
  const before = structuredClone(workspace)
  syncTest.planProjectSync(workspace.projects, [repo])
  assert.deepEqual(workspace, before)
})

test('9. changed repository counts are detected as metadata changes', () => {
  const metadata = syncTest.buildGitHubProjectMetadata(repo, ['JavaScript'])
  assert.equal(syncTest.hasGitHubMetadataChanged(linkedProject(), metadata), true)
})

test('10. identical metadata is recognized as unchanged regardless of topic order', () => {
  const metadata = syncTest.buildGitHubProjectMetadata(repo, ['JavaScript'])
  const project = linkedProject({ ...metadata, githubTopics: [...metadata.githubTopics].reverse() })
  assert.equal(syncTest.hasGitHubMetadataChanged(project, metadata), false)
})

test('11. omitted metadata fields remain omitted instead of being cleared', () => {
  const normalized = projectTest.normalizeGitHubMetadata({ githubStars: 9 })
  assert.deepEqual(normalized, { githubStars: 9 })
})

test('12. short GitHub descriptions normalize independently from manual description validation', () => {
  const normalized = projectTest.normalizeGitHubMetadata({ githubDescription: 'short' })
  assert.deepEqual(normalized, { githubDescription: 'short' })
})

test('omitted GitHub values do not clear existing repository metadata', () => {
  const metadata = syncTest.buildGitHubProjectMetadata({ id: 44, archived: false }, undefined)
  assert.equal(Object.hasOwn(metadata, 'githubDescription'), false)
  assert.equal(Object.hasOwn(metadata, 'githubHomepage'), false)
  assert.equal(Object.hasOwn(metadata, 'githubLanguages'), false)
})
