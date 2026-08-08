const assert = require('node:assert/strict')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const { prisma } = require('../src/db/prisma')

const OWNER_ID = 'dev-local-user'
const SOURCE_PATH = path.join(__dirname, '..', '.data', 'devvault-local-store.json')
const EXPECTED_SHA256 = '99bea99440ca69da5c1e2d96fd23f65313fdd552f11c5e882100bdfe37035531'
const EXPECTED_OVERWRITTEN_TITLES = new Map([
  [2, 'java-bank-system'],
  [3, 'cloud_cost_budget_tracker'],
  [4, 'java-password-manager'],
  [5, 'password-strength-analyzer'],
])

async function main() {
  const sourceBuffer = fs.readFileSync(SOURCE_PATH)
  assert.equal(crypto.createHash('sha256').update(sourceBuffer).digest('hex'), EXPECTED_SHA256)
  const sourceProjects = JSON.parse(sourceBuffer.toString('utf8')).projects
    .filter((project) => project.ownerClerkUserId === OWNER_ID && EXPECTED_OVERWRITTEN_TITLES.has(project.id))
    .sort((left, right) => left.id - right.id)
  assert.equal(sourceProjects.length, 4)

  const databaseProjects = await prisma.project.findMany({
    where: { ownerClerkUserId: OWNER_ID, id: { in: sourceProjects.map((project) => project.id) } },
    orderBy: { id: 'asc' },
  })
  assert.equal(databaseProjects.length, 4)

  databaseProjects.forEach((project) => {
    assert.equal(project.title, EXPECTED_OVERWRITTEN_TITLES.get(project.id), `Project ${project.id} title changed unexpectedly; no writes were made.`)
    assert.match(project.bannerImageUrl || '', /^https:\/\/avatars\.githubusercontent\.com\//, `Project ${project.id} artwork changed unexpectedly; no writes were made.`)
  })

  await prisma.$transaction(sourceProjects.map((source) => prisma.project.update({
    where: { id: source.id },
    data: {
      title: source.title,
      bannerImageUrl: source.bannerImageUrl,
      bannerImageSource: 'IMPORTED',
    },
  })))

  const restored = await prisma.project.findMany({
    where: { ownerClerkUserId: OWNER_ID, id: { in: sourceProjects.map((project) => project.id) } },
    orderBy: { id: 'asc' },
    select: { id: true, title: true, bannerImageUrl: true, bannerImageSource: true },
  })
  restored.forEach((project) => {
    const source = sourceProjects.find((item) => item.id === project.id)
    assert.equal(project.title, source.title)
    assert.equal(project.bannerImageUrl, source.bannerImageUrl)
    assert.equal(project.bannerImageSource, 'IMPORTED')
  })

  console.log(JSON.stringify({
    ownerClerkUserId: OWNER_ID,
    restored: restored.map((project) => ({ id: project.id, title: project.title, bannerImageSource: project.bannerImageSource })),
    sourceSha256: EXPECTED_SHA256,
  }, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
