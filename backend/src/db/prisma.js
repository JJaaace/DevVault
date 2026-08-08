const { isPostgresMode } = require('../config/persistence')

let prisma = null

if (isPostgresMode()) {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
}

function getPrisma() {
  if (!prisma) {
    throw new Error('Prisma is unavailable because PERSISTENCE_MODE is not set to postgres.')
  }
  return prisma
}

module.exports = {
  getPrisma,
  prisma,
}
