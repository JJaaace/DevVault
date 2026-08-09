const fs = require('fs')
const path = require('path')

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'prisma', 'migrations')
const EXPECTED_TABLES = [
  'User', 'Profile', 'Project', 'Skill', 'SkillProject', 'Goal',
  'Certification', 'CertificationRoadmapItem', 'ResumeAsset', '_prisma_migrations',
]

async function loadCounts(client) {
  const [users, profiles, projects, skills, relationships, certifications, goals, roadmapItems, resumes] = await Promise.all([
    client.user.count(), client.profile.count(), client.project.count(), client.skill.count(),
    client.skillProject.count(), client.certification.count(), client.goal.count(),
    client.certificationRoadmapItem.count(), client.resumeAsset.count(),
  ])
  return { users, profiles, projects, skills, relationships, certifications, goals, roadmapItems, resumes }
}

async function loadIntegrity(client) {
  const [orphanedRelationships, crossOwnerRelationships, ownersWithMultipleFavoriteSkills, orphanedProfiles, orphanedProjects, orphanedSkills, orphanedGoals, orphanedCertifications, orphanedRoadmapItems, orphanedResumes] = await Promise.all([
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "SkillProject" sp LEFT JOIN "Skill" s ON s.id = sp."skillId" LEFT JOIN "Project" p ON p.id = sp."projectId" WHERE s.id IS NULL OR p.id IS NULL`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "SkillProject" sp JOIN "Skill" s ON s.id = sp."skillId" JOIN "Project" p ON p.id = sp."projectId" WHERE s."ownerClerkUserId" <> p."ownerClerkUserId"`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM (SELECT "ownerClerkUserId" FROM "Skill" WHERE "favorite" = true GROUP BY "ownerClerkUserId" HAVING COUNT(*) > 1) favorites`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "Profile" p LEFT JOIN "User" u ON u."clerkUserId" = p."clerkUserId" WHERE u.id IS NULL`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "Project" r LEFT JOIN "User" u ON u."clerkUserId" = r."ownerClerkUserId" WHERE u.id IS NULL`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "Skill" r LEFT JOIN "User" u ON u."clerkUserId" = r."ownerClerkUserId" WHERE u.id IS NULL`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "Goal" r LEFT JOIN "User" u ON u."clerkUserId" = r."ownerClerkUserId" WHERE u.id IS NULL`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "Certification" r LEFT JOIN "User" u ON u."clerkUserId" = r."ownerClerkUserId" WHERE u.id IS NULL`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "CertificationRoadmapItem" r LEFT JOIN "User" u ON u."clerkUserId" = r."ownerClerkUserId" WHERE u.id IS NULL`,
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM "ResumeAsset" r LEFT JOIN "User" u ON u."clerkUserId" = r."ownerClerkUserId" WHERE u.id IS NULL`,
  ])
  return {
    orphanedRelationships: orphanedRelationships[0].count,
    crossOwnerRelationships: crossOwnerRelationships[0].count,
    ownersWithMultipleFavoriteSkills: ownersWithMultipleFavoriteSkills[0].count,
    orphanedProfiles: orphanedProfiles[0].count,
    orphanedProjects: orphanedProjects[0].count,
    orphanedSkills: orphanedSkills[0].count,
    orphanedGoals: orphanedGoals[0].count,
    orphanedCertifications: orphanedCertifications[0].count,
    orphanedRoadmapItems: orphanedRoadmapItems[0].count,
    orphanedResumes: orphanedResumes[0].count,
  }
}

async function loadMigrationStatus(client) {
  const committed = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  const appliedRows = await client.$queryRaw`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`
  const applied = appliedRows.map((row) => row.migration_name)
  return {
    committed,
    applied,
    pending: committed.filter((name) => !applied.includes(name)),
    unknown: applied.filter((name) => !committed.includes(name)),
  }
}

async function createDatabaseReport(client) {
  const versionRows = await client.$queryRaw`SELECT current_setting('server_version') AS version`
  const tableRows = await client.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  const tables = tableRows.map((row) => row.table_name).sort()
  const missingTables = EXPECTED_TABLES.filter((name) => !tables.includes(name))
  const counts = missingTables.length ? null : await loadCounts(client)
  const integrity = missingTables.length ? null : await loadIntegrity(client)
  const migrations = tables.includes('_prisma_migrations') ? await loadMigrationStatus(client) : null
  const integrityIssues = integrity ? Object.values(integrity).reduce((sum, value) => sum + value, 0) : null

  return {
    reachable: true,
    postgresVersion: versionRows[0]?.version || 'unknown',
    schema: { expectedTables: EXPECTED_TABLES.length, availableTables: EXPECTED_TABLES.length - missingTables.length, missingTables },
    migrations,
    counts,
    databaseAppearsEmpty: counts ? Object.values(counts).every((value) => value === 0) : null,
    integrity,
    integrityIssues,
  }
}

function readExpectedManifest(manifestPath) {
  if (!manifestPath) return null
  const resolved = path.resolve(manifestPath)
  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'))
  if (!parsed || typeof parsed !== 'object' || !parsed.counts || typeof parsed.counts !== 'object') {
    throw new Error('Expected-count manifest must contain a counts object.')
  }
  return { path: resolved, counts: parsed.counts }
}

function compareExpectedCounts(actual, manifest) {
  if (!manifest) return { checked: false, mismatches: [] }
  const mismatches = Object.entries(manifest.counts).flatMap(([key, expected]) => {
    if (!Object.hasOwn(actual, key)) return [{ key, expected, actual: 'unknown count name' }]
    return Number(actual[key]) === Number(expected) ? [] : [{ key, expected: Number(expected), actual: actual[key] }]
  })
  return { checked: true, manifest: manifest.path, mismatches }
}

module.exports = { createDatabaseReport, readExpectedManifest, compareExpectedCounts, EXPECTED_TABLES }
