const assert = require('node:assert/strict')
const crypto = require('crypto')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { prisma } = require('../src/db/prisma')

function options() {
  const args = process.argv.slice(2)
  const read = (name) => args.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3).trim() || ''
  return { from: read('from'), to: read('to'), confirm: read('confirm'), apply: args.includes('--apply') }
}

function digest(value) {
  return value === null || value === undefined ? null : crypto.createHash('sha256').update(value).digest('hex')
}

async function snapshot(client, clerkUserId) {
  const [user, profile, projects, skills, goals, certifications, roadmapItems, resume, relationships] = await Promise.all([
    client.user.findUnique({ where: { clerkUserId } }),
    client.profile.findUnique({ where: { clerkUserId } }),
    client.project.findMany({ where: { ownerClerkUserId: clerkUserId }, select: { id: true } }),
    client.skill.findMany({ where: { ownerClerkUserId: clerkUserId }, select: { id: true } }),
    client.goal.findMany({ where: { ownerClerkUserId: clerkUserId }, select: { id: true } }),
    client.certification.findMany({ where: { ownerClerkUserId: clerkUserId }, select: { id: true, assetData: true } }),
    client.certificationRoadmapItem.findMany({ where: { ownerClerkUserId: clerkUserId }, select: { id: true } }),
    client.resumeAsset.findUnique({ where: { ownerClerkUserId: clerkUserId } }),
    client.skillProject.findMany({
      where: { skill: { ownerClerkUserId: clerkUserId } },
      orderBy: [{ skillId: 'asc' }, { projectId: 'asc' }],
      select: { skillId: true, projectId: true },
    }),
  ])
  const ids = (items) => items.map((item) => item.id).sort((a, b) => a - b)
  return {
    exists: Boolean(user || profile || projects.length || skills.length || goals.length || certifications.length || roadmapItems.length || resume),
    user: Boolean(user), profile: Boolean(profile),
    counts: { projects: projects.length, skills: skills.length, relationships: relationships.length, goals: goals.length, certifications: certifications.length, roadmapItems: roadmapItems.length, resumes: resume ? 1 : 0 },
    ids: { projects: ids(projects), skills: ids(skills), goals: ids(goals), certifications: ids(certifications), roadmapItems: ids(roadmapItems), relationships },
    media: {
      profileImageSha256: digest(profile?.profileImageUrl || null),
      certificationBytes: certifications.reduce((sum, item) => sum + (item.assetData?.length || 0), 0),
      certificationAssetSha256: digest(Buffer.concat(certifications.filter((item) => item.assetData).sort((a, b) => a.id - b.id).map((item) => Buffer.from(item.assetData)))),
      resumeBytes: resume?.content?.length || 0,
      resumeSha256: digest(resume?.content || null),
    },
  }
}

function comparable(snapshotValue) {
  return { user: snapshotValue.user, profile: snapshotValue.profile, counts: snapshotValue.counts, ids: snapshotValue.ids, media: snapshotValue.media }
}

async function main() {
  const cli = options()
  if (!cli.from || !cli.to) throw new Error('Provide --from=EXISTING_ID and --to=user_PRODUCTION_ID.')
  if (cli.from === cli.to) throw new Error('Source and destination Clerk IDs must be different.')
  if (!/^user_[A-Za-z0-9_-]+$/.test(cli.to)) throw new Error('Destination must look like a Clerk user ID beginning with user_.')
  if (cli.apply && cli.confirm !== 'REASSIGN') throw new Error('Apply requires --confirm=REASSIGN. Run preview and take a fresh backup first.')

  const source = await snapshot(prisma, cli.from)
  const destination = await snapshot(prisma, cli.to)
  if (!source.user || !source.profile) throw new Error('Source User and Profile were not both found; no writes were made.')
  if (destination.exists) throw new Error('Destination already owns or identifies DevVault records; no writes were made.')

  const preview = { mode: cli.apply ? 'apply' : 'preview', from: cli.from, to: cli.to, affected: source.counts, media: source.media, destinationConflict: false }
  if (!cli.apply) {
    console.log(JSON.stringify({ ...preview, status: 'preview-only', next: 'Take a fresh backup, then run ownership:apply with --confirm=REASSIGN.' }, null, 2))
    return
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({ where: { clerkUserId: cli.from }, data: { clerkUserId: cli.to } })
    await transaction.profile.update({ where: { clerkUserId: cli.from }, data: { clerkUserId: cli.to } })
    const after = await snapshot(transaction, cli.to)
    const sourceRemaining = await snapshot(transaction, cli.from)
    assert.deepEqual(comparable(after), comparable(source), 'Post-handoff data differs; transaction will roll back.')
    assert.equal(sourceRemaining.exists, false, 'Source ownership still exists; transaction will roll back.')
  }, { timeout: 30000 })

  const verified = await snapshot(prisma, cli.to)
  assert.deepEqual(comparable(verified), comparable(source), 'Committed ownership verification failed.')
  console.log(JSON.stringify({ ...preview, status: 'applied-and-verified' }, null, 2))
}

main().catch((error) => { console.error(JSON.stringify({ status: 'failed', error: error.message }, null, 2)); process.exitCode = 1 }).finally(() => prisma.$disconnect())
