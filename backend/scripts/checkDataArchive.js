const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

function argument(name) {
  const prefix = `--${name}=`
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length) || ''
}

function commandVersion(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`${command} is required but was not found on PATH.`)
  return String(result.stdout || result.stderr).trim()
}

function main() {
  const archiveValue = argument('archive')
  if (!archiveValue) throw new Error('Usage: npm run db:archive:check -- --archive=/absolute/path/to/backup.dump')
  const directArchive = path.resolve(archiveValue)
  const repositoryArchive = path.resolve(__dirname, '..', '..', archiveValue)
  const archive = fs.existsSync(directArchive) ? directArchive : repositoryArchive
  if (!fs.existsSync(archive) || !fs.statSync(archive).isFile()) throw new Error('Archive file does not exist.')

  const pgDumpVersion = commandVersion('pg_dump')
  const pgRestoreVersion = commandVersion('pg_restore')
  const list = spawnSync('pg_restore', ['--list', archive], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  if (list.status !== 0) throw new Error(`pg_restore could not read the archive: ${String(list.stderr).trim()}`)
  const requiredTables = ['User', 'Profile', 'Project', 'Skill', 'SkillProject', 'Certification', 'Goal', 'CertificationRoadmapItem', 'ResumeAsset']
  const missingTableData = requiredTables.filter((table) => !new RegExp(`TABLE DATA public ${table}(?:\\s|$)`).test(list.stdout))
  const checksum = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex')
  const report = {
    status: missingTableData.length ? 'failed' : 'passed',
    archive,
    bytes: fs.statSync(archive).size,
    sha256: checksum,
    pgDumpVersion,
    pgRestoreVersion,
    requiredTableDataEntries: requiredTables.length,
    missingTableData,
    warning: 'Verification is read-only. Restore only into an empty database after committed migrations are applied.',
  }
  console.log(JSON.stringify(report, null, 2))
  if (missingTableData.length) process.exitCode = 1
}

try { main() } catch (error) { console.error(JSON.stringify({ status: 'failed', error: error.message }, null, 2)); process.exitCode = 1 }
