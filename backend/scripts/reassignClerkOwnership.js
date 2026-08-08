const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const { prisma } = require('../src/db/prisma')

async function main() {
  const [fromClerkUserId, toClerkUserId] = process.argv.slice(2).map((value) => String(value || '').trim())
  if (!fromClerkUserId || !toClerkUserId || fromClerkUserId === toClerkUserId) {
    throw new Error('Usage: node scripts/reassignClerkOwnership.js <existing-clerk-user-id> <new-clerk-user-id>')
  }

  const [sourceUser, sourceProfile, destinationUser, destinationProfile] = await Promise.all([
    prisma.user.findUnique({ where: { clerkUserId: fromClerkUserId } }),
    prisma.profile.findUnique({ where: { clerkUserId: fromClerkUserId } }),
    prisma.user.findUnique({ where: { clerkUserId: toClerkUserId } }),
    prisma.profile.findUnique({ where: { clerkUserId: toClerkUserId } }),
  ])

  if (!sourceUser || !sourceProfile) throw new Error('Source owner/profile was not found; no writes were made.')
  if (destinationUser || destinationProfile) throw new Error('Destination owner/profile already exists; no writes were made.')

  const before = await Promise.all([
    prisma.project.count({ where: { ownerClerkUserId: fromClerkUserId } }),
    prisma.skill.count({ where: { ownerClerkUserId: fromClerkUserId } }),
    prisma.goal.count({ where: { ownerClerkUserId: fromClerkUserId } }),
    prisma.certification.count({ where: { ownerClerkUserId: fromClerkUserId } }),
    prisma.resumeAsset.count({ where: { ownerClerkUserId: fromClerkUserId } }),
  ])

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({ where: { clerkUserId: fromClerkUserId }, data: { clerkUserId: toClerkUserId } })
    await transaction.profile.update({ where: { clerkUserId: fromClerkUserId }, data: { clerkUserId: toClerkUserId } })
  })

  const after = await Promise.all([
    prisma.project.count({ where: { ownerClerkUserId: toClerkUserId } }),
    prisma.skill.count({ where: { ownerClerkUserId: toClerkUserId } }),
    prisma.goal.count({ where: { ownerClerkUserId: toClerkUserId } }),
    prisma.certification.count({ where: { ownerClerkUserId: toClerkUserId } }),
    prisma.resumeAsset.count({ where: { ownerClerkUserId: toClerkUserId } }),
  ])

  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Ownership verification failed after the transaction.')
  console.log(JSON.stringify({ fromClerkUserId, toClerkUserId, projects: after[0], skills: after[1], goals: after[2], certifications: after[3], resumes: after[4] }, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
