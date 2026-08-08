const assert = require('node:assert/strict')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const { prisma } = require('../src/db/prisma')

const OWNER_ID = 'dev-local-user'
const LOCAL_STORE_PATH = path.join(__dirname, '..', '.data', 'devvault-local-store.json')
const RESUME_PATH = path.join(__dirname, '..', '.data', 'resumes', OWNER_ID, 'resume.pdf')
const EXPECTED_LOCAL_STORE_SHA256 = '99bea99440ca69da5c1e2d96fd23f65313fdd552f11c5e882100bdfe37035531'

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function main() {
  const [users, profiles, projects, skills, relationships, goals, certifications, roadmap, resume, percentageColumns] = await Promise.all([
    prisma.user.findMany({ select: { clerkUserId: true } }),
    prisma.profile.findMany({ select: { clerkUserId: true, username: true } }),
    prisma.project.findMany({ where: { ownerClerkUserId: OWNER_ID }, orderBy: { id: 'asc' } }),
    prisma.skill.findMany({ where: { ownerClerkUserId: OWNER_ID }, orderBy: { id: 'asc' } }),
    prisma.skillProject.findMany(),
    prisma.goal.findMany({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.certification.findMany({ where: { ownerClerkUserId: OWNER_ID }, omit: { assetData: true } }),
    prisma.certificationRoadmapItem.findMany({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.resumeAsset.findUnique({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Skill' AND column_name = 'percentage'`,
  ])

  assert.deepEqual(users, [{ clerkUserId: OWNER_ID }])
  assert.deepEqual(profiles, [{ clerkUserId: OWNER_ID, username: 'JJaaace' }])
  assert.deepEqual(projects.map((item) => item.id), [1, 2, 3, 4, 5])
  assert.deepEqual(skills.map((item) => item.id), Array.from({ length: 17 }, (_, index) => index + 1))
  assert.equal(relationships.length, 23)
  assert.equal(relationships.some((link) => !projects.some((project) => project.id === link.projectId)), false)
  assert.equal(relationships.some((link) => !skills.some((skill) => skill.id === link.skillId)), false)
  assert.equal(projects.filter((project) => project.featured).length, 1)
  assert.equal(new Set(goals.map((item) => item.id)).size, goals.length)
  assert.equal(new Set(certifications.map((item) => item.id)).size, certifications.length)
  assert.equal(new Set(roadmap.map((item) => item.id)).size, roadmap.length)
  assert.equal(goals.every((item) => item.ownerClerkUserId === OWNER_ID), true)
  assert.equal(certifications.every((item) => item.ownerClerkUserId === OWNER_ID), true)
  assert.equal(roadmap.every((item) => item.ownerClerkUserId === OWNER_ID), true)
  assert.equal(percentageColumns.length, 0)
  assert.ok(resume)
  assert.equal(resume.byteSize, resume.content.length)
  assert.equal(digest(resume.content), digest(fs.readFileSync(RESUME_PATH)))
  assert.equal(digest(fs.readFileSync(LOCAL_STORE_PATH)), EXPECTED_LOCAL_STORE_SHA256)

  console.log(JSON.stringify({
    ownerClerkUserId: OWNER_ID,
    username: profiles[0].username,
    counts: {
      users: users.length,
      profiles: profiles.length,
      projects: projects.length,
      skills: skills.length,
      relationships: relationships.length,
      goals: goals.length,
      certifications: certifications.length,
      roadmapItems: roadmap.length,
      resumes: 1,
    },
    projectIds: projects.map((item) => item.id),
    skillIds: skills.map((item) => item.id),
    featuredProjectIds: projects.filter((project) => project.featured).map((project) => project.id),
    orphanedRelationships: 0,
    skillPercentageColumnPresent: false,
    resumeSha256: digest(resume.content),
    localStoreSha256: EXPECTED_LOCAL_STORE_SHA256,
  }, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
