const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findProfileByClerkId(clerkUserId) {
  return prisma.profile.findUnique({
    where: { clerkUserId },
  })
}

module.exports = {
  findProfileByClerkId,
}
