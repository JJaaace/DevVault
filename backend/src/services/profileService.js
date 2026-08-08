const { getPrisma } = require('../db/prisma')

async function findProfileByClerkId(clerkUserId) {
  const prisma = getPrisma()
  return prisma.profile.findUnique({
    where: { clerkUserId },
  })
}

module.exports = {
  findProfileByClerkId,
}
