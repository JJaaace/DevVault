import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { validateFrontendEnvironment } from '../frontend/config/environment.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = []
const checks = []

function check(name, condition, detail) {
  checks.push({ name, status: condition ? 'PASS' : 'FAIL', detail: condition ? '' : detail })
  if (!condition) failures.push(`${name}: ${detail}`)
}

const frontendExamplePath = path.join(root, 'frontend', '.env.example')
const backendExamplePath = path.join(root, 'backend', '.env.example')
const frontendExample = fs.readFileSync(frontendExamplePath, 'utf8')
const backendExample = fs.readFileSync(backendExamplePath, 'utf8')
for (const name of ['VITE_API_BASE_URL', 'VITE_CLERK_PUBLISHABLE_KEY', 'VITE_PUBLIC_APP_URL']) {
  check(`Frontend template includes ${name}`, new RegExp(`^${name}=`, 'm').test(frontendExample), 'Missing variable.')
}
for (const name of ['NODE_ENV', 'PERSISTENCE_MODE', 'DATABASE_URL', 'CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'CORS_ORIGINS', 'GITHUB_TOKEN']) {
  check(`Backend template includes ${name}`, new RegExp(`^${name}=`, 'm').test(backendExample), 'Missing variable.')
}
check('Frontend template contains placeholders only', /REPLACE_ME/.test(frontendExample) && !/pk_live_(?!REPLACE_ME)[A-Za-z0-9]{16,}/.test(frontendExample), 'Template may contain a real publishable key.')
check('Backend template contains placeholders only', /REPLACE_ME/.test(backendExample) && !/sk_live_(?!REPLACE_ME)[A-Za-z0-9]{16,}/.test(backendExample), 'Template may contain a real secret key.')

const productionValidation = validateFrontendEnvironment({
  VITE_API_BASE_URL: 'https://api.devvault.invalid',
  VITE_PUBLIC_APP_URL: 'https://devvault.invalid',
  VITE_CLERK_PUBLISHABLE_KEY: 'pk_live_cHJlZmxpZ2h0X29ubHlfbm90X2Ffc2VjcmV0',
}, { production: true, throwOnError: false })
check('Frontend production validation accepts complete non-local configuration', productionValidation.errors.length === 0, productionValidation.errors.join(' '))
const localValidation = validateFrontendEnvironment({
  VITE_API_BASE_URL: 'http://localhost:5001',
  VITE_PUBLIC_APP_URL: 'http://127.0.0.1:5176',
  VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_local',
}, { production: true, throwOnError: false })
check('Frontend production validation rejects local/test configuration', localValidation.errors.length >= 3, 'Local URLs or test Clerk configuration were accepted.')

const trackedResult = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
const tracked = trackedResult.stdout.split('\0').filter(Boolean)
const sensitiveNames = tracked.filter((file) => /(^|\/)(\.env(?:\..+)?|.+\.(?:dump|backup|pem|key|p12|pdf))$/i.test(file) && !file.endsWith('.env.example'))
check('No sensitive runtime files are tracked', sensitiveNames.length === 0, sensitiveNames.join(', '))

const highRiskPatterns = [
  /sk_live_[A-Za-z0-9]{16,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/,
]
const exposed = []
for (const file of tracked) {
  if (/\.env\.example$/.test(file) || file.startsWith('backend/.agents/')) continue
  const absolute = path.join(root, file)
  let content
  try { content = fs.readFileSync(absolute, 'utf8') } catch { continue }
  if (highRiskPatterns.some((pattern) => pattern.test(content))) exposed.push(file)
}
check('No high-risk credential patterns exist in tracked source', exposed.length === 0, exposed.join(', '))

const revisions = spawnSync('git', ['rev-list', '--all'], { cwd: root, encoding: 'utf8' }).stdout.split(/\s+/).filter(Boolean)
const historicalFiles = new Set()
const historyPattern = 'sk_live_[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|postgres(ql)?://[^[:space:]]+:[^[:space:]]+@'
for (const revision of revisions) {
  const result = spawnSync('git', ['grep', '-Il', '-E', historyPattern, revision, '--', '.', ':(exclude)backend/.agents'], { cwd: root, encoding: 'utf8' })
  for (const line of result.stdout.split('\n').filter(Boolean)) historicalFiles.add(line.replace(/^[^:]+:/, ''))
}
const unsafeHistoricalFiles = [...historicalFiles].filter((file) => !file.endsWith('.env.example'))
check('Git history high-risk patterns are limited to placeholder templates', unsafeHistoricalFiles.length === 0, unsafeHistoricalFiles.join(', '))

const publicRoutes = fs.readFileSync(path.join(root, 'backend', 'src', 'routes', 'public.js'), 'utf8')
check('Public API router declares GET handlers only', !/router\.(post|put|patch|delete)\s*\(/i.test(publicRoutes), 'A public mutation route is declared.')
const githubSync = fs.readFileSync(path.join(root, 'backend', 'src', 'services', 'githubSyncService.js'), 'utf8')
check('GitHub sync has no profile mutation call', !/prisma\.profile\.(update|upsert|create|delete)/.test(githubSync), 'GitHub sync can mutate Profile.')

console.log(JSON.stringify({ status: failures.length ? 'failed' : 'passed', checks, failures }, null, 2))
if (failures.length) process.exitCode = 1
