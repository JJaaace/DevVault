const assert = require('assert/strict')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, '..', '.env') })
const { prisma } = require('../src/db/prisma')

const EXPECTED_SOURCE_SHA256 = '99bea99440ca69da5c1e2d96fd23f65313fdd552f11c5e882100bdfe37035531'
const SOURCE_PATH = path.join(__dirname, '..', '.data', 'devvault-local-store.json')
const OWNER_ID = 'dev-local-user'

function iso(value) {
  return value ? new Date(value).toISOString() : null
}

function comparableProfile(profile) {
  return {
    clerkUserId: profile.clerkUserId,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio,
    profileImageUrl: profile.profileImageUrl || null,
    school: profile.school || null,
    graduationYear: profile.graduationYear ?? null,
    major: profile.major || null,
    location: profile.location || null,
    dreamCompanies: profile.dreamCompanies || [],
    currentRole: profile.currentRole || null,
    favoriteLanguage: profile.favoriteLanguage || null,
    favoriteFramework: profile.favoriteFramework || null,
    yearsCoding: profile.yearsCoding ?? null,
    interests: profile.interests || [],
    tagline: profile.tagline || null,
    pronouns: profile.pronouns || null,
    openToWork: Boolean(profile.openToWork),
    jobType: profile.jobType || null,
    githubUrl: profile.githubUrl || null,
    linkedinUrl: profile.linkedinUrl || null,
    websiteUrl: profile.websiteUrl || null,
    twitterUrl: profile.twitterUrl || null,
    githubLastSyncedAt: iso(profile.githubLastSyncedAt),
  }
}

function comparableProject(project) {
  return {
    id: project.id,
    ownerClerkUserId: project.ownerClerkUserId,
    displayOrder: project.displayOrder ?? 0,
    title: project.title,
    description: project.description,
    githubUrl: project.githubUrl || null,
    githubRepoId: project.githubRepoId ?? null,
    githubFullName: project.githubFullName || null,
    githubDescription: project.githubDescription || null,
    githubStars: project.githubStars ?? null,
    githubForks: project.githubForks ?? null,
    githubLanguages: project.githubLanguages || [],
    githubTopics: project.githubTopics || [],
    githubHomepage: project.githubHomepage || null,
    githubUpdatedAt: iso(project.githubUpdatedAt),
    githubPushedAt: iso(project.githubPushedAt),
    githubArchivedAt: iso(project.githubArchivedAt),
    liveDemoUrl: project.liveDemoUrl || null,
    bannerImageUrl: project.bannerImageUrl || null,
    accentTone: project.accentTone || null,
    techStack: project.techStack || [],
    keyFeatures: project.keyFeatures || [],
    status: project.status,
    dateStarted: iso(project.dateStarted),
    targetCompletion: iso(project.targetCompletion),
    challenges: project.challenges || null,
    lessonsLearned: project.lessonsLearned || null,
    createdAt: iso(project.createdAt),
    updatedAt: iso(project.updatedAt),
  }
}

function comparableSkill(skill, relatedProjectIds) {
  return {
    id: skill.id,
    ownerClerkUserId: skill.ownerClerkUserId,
    name: skill.name,
    technologyKey: skill.technologyKey || null,
    category: skill.category,
    experienceLevel: skill.experienceLevel,
    yearsExperience: skill.yearsExperience ?? null,
    firstUsedYear: skill.firstUsedYear ?? null,
    projectsBuilt: relatedProjectIds.length,
    color: skill.color,
    lastUsed: iso(skill.lastUsed),
    notes: skill.notes || null,
    relatedProjectIds: [...relatedProjectIds].sort((a, b) => a - b),
    createdAt: iso(skill.createdAt),
    updatedAt: iso(skill.updatedAt),
  }
}

async function main() {
  const sourceBuffer = fs.readFileSync(SOURCE_PATH)
  const checksum = crypto.createHash('sha256').update(sourceBuffer).digest('hex')
  assert.equal(checksum, EXPECTED_SOURCE_SHA256, 'Source checksum changed')
  const source = JSON.parse(sourceBuffer.toString('utf8'))
  try {
    const [users, profiles, projects, skills, relationships, projectSequence, skillSequence] = await Promise.all([
      prisma.user.findMany({ orderBy: { id: 'asc' } }),
      prisma.profile.findMany({ orderBy: { id: 'asc' } }),
      prisma.project.findMany({ orderBy: { id: 'asc' } }),
      prisma.skill.findMany({ orderBy: { id: 'asc' } }),
      prisma.skillProject.findMany({ orderBy: [{ skillId: 'asc' }, { projectId: 'asc' }] }),
      prisma.$queryRawUnsafe('SELECT last_value::int, is_called FROM "Project_id_seq"'),
      prisma.$queryRawUnsafe('SELECT last_value::int, is_called FROM "Skill_id_seq"'),
    ])

    assert.deepEqual(users.map((item) => item.clerkUserId), [OWNER_ID])
    assert.equal(profiles.length, 1)
    assert.equal(profiles[0].clerkUserId, OWNER_ID)
    assert.equal(profiles.some((item) => item.clerkUserId === 'dev-db-user'), false)
    const sourceProfile = source.profiles.find((item) => item.clerkUserId === OWNER_ID)
    assert.equal(profiles[0].username, sourceProfile.username)

    const sourceProjects = source.projects
      .filter((item) => item.ownerClerkUserId === OWNER_ID)
      .sort((a, b) => a.id - b.id)
    assert.deepEqual(projects.map((item) => ({ id: item.id, title: item.title })), sourceProjects.map((item) => ({ id: item.id, title: item.title })))

    const sourceSkills = source.skills
      .filter((item) => item.ownerClerkUserId === OWNER_ID)
      .sort((a, b) => a.id - b.id)
    assert.deepEqual(skills.map((item) => ({ id: item.id, name: item.name })), sourceSkills.map((item) => ({ id: item.id, name: item.name })))
    const sourceRelationships = sourceSkills.flatMap((item) => item.relatedProjectIds.map((projectId) => ({ skillId: item.id, projectId })))
      .sort((left, right) => left.skillId - right.skillId || left.projectId - right.projectId)
    assert.deepEqual(relationships, sourceRelationships)

    assert.equal(projects.length, 5)
    assert.equal(skills.length, 17)
    assert.equal(relationships.length, 23)
    assert.deepEqual(projects.map((item) => item.id), [1, 2, 3, 4, 5])
    assert.deepEqual(skills.map((item) => item.id), Array.from({ length: 17 }, (_, index) => index + 1))
    assert.equal(relationships.some((link) => !projects.some((project) => project.id === link.projectId)), false)
    assert.equal(relationships.some((link) => !skills.some((skill) => skill.id === link.skillId)), false)
    assert.deepEqual(projectSequence, [{ last_value: 5, is_called: true }])
    assert.deepEqual(skillSequence, [{ last_value: 17, is_called: true }])

    console.log(JSON.stringify({
      checksum,
      counts: {
        users: users.length,
        profiles: profiles.length,
        projects: projects.length,
        skills: skills.length,
        relationships: relationships.length,
      },
      projectIds: projects.map((item) => item.id),
      skillIds: skills.map((item) => item.id),
      sequences: { project: projectSequence[0], skill: skillSequence[0] },
      excludedTestProfilePresent: false,
      orphanedRelationships: 0,
      sourceComparison: 'original owner, username, project IDs/titles, skill IDs/names, and SkillProject relationships preserved; mutable fields may have newer PostgreSQL edits',
    }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
