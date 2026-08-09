const { isPostgresMode } = require('../config/persistence')
const { environment } = require('../config/environment')

let prisma = null

if (isPostgresMode()) {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: environment.databaseUrl })
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
