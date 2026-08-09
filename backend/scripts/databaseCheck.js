const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { prisma } = require('../src/db/prisma')
const { createDatabaseReport, readExpectedManifest, compareExpectedCounts } = require('./lib/databaseDiagnostics')

function argument(name) {
  const prefix = `--${name}=`
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length) || ''
}

async function main() {
  const mode = argument('mode') || 'check'
  const manifest = readExpectedManifest(argument('expected'))
  const report = await createDatabaseReport(prisma)
  const expected = compareExpectedCounts(report.counts || {}, manifest)
  const failures = [
    ...report.schema.missingTables.map((table) => `Missing table: ${table}`),
    ...(report.migrations?.pending || []).map((migration) => `Pending migration: ${migration}`),
    ...(report.migrations?.unknown || []).map((migration) => `Unknown applied migration: ${migration}`),
    ...(report.integrityIssues ? [`Relational integrity issues: ${report.integrityIssues}`] : []),
    ...expected.mismatches.map((item) => `Expected ${item.key}=${item.expected}; found ${item.actual}`),
  ]

  console.log(JSON.stringify({ mode, ...report, expectedCounts: expected, status: failures.length ? 'failed' : 'passed', failures }, null, 2))
  if (failures.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'failed', reachable: false, error: error.message }, null, 2))
  process.exitCode = 1
}).finally(async () => prisma?.$disconnect())
