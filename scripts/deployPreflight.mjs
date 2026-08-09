import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const productionBuildEnv = {
  ...process.env,
  VITE_API_BASE_URL: 'https://api.devvault.invalid',
  VITE_PUBLIC_APP_URL: 'https://devvault.invalid',
  VITE_CLERK_PUBLISHABLE_KEY: 'pk_live_cHJlZmxpZ2h0X29ubHlfbm90X2Ffc2VjcmV0',
}

const tasks = [
  ['Frontend lint', 'npm', ['--prefix', 'frontend', 'run', 'lint']],
  ['Frontend tests', 'npm', ['--prefix', 'frontend', 'test']],
  ['Backend tests', 'npm', ['--prefix', 'backend', 'test']],
  ['Guest Mode security boundary', 'npm', ['--prefix', 'backend', 'run', 'test:security']],
  ['GitHub sync write boundary', 'npm', ['--prefix', 'backend', 'run', 'test:github-boundary']],
  ['Prisma Client generation', 'npm', ['--prefix', 'backend', 'run', 'prisma:generate']],
  ['Prisma schema validation', 'npm', ['--prefix', 'backend', 'run', 'prisma:validate']],
  ['Committed migrations', 'npm', ['--prefix', 'backend', 'run', 'prisma:migrate:status']],
  ['Database safety', 'npm', ['--prefix', 'backend', 'run', 'db:production:check']],
  ['Environment and repository policy', process.execPath, ['scripts/repositoryPolicyCheck.mjs']],
  ['Patch formatting', 'git', ['diff', '--check']],
  ['Frontend production build', 'npm', ['--prefix', 'frontend', 'run', 'build'], productionBuildEnv],
]

const results = []
for (const [name, command, args, env] of tasks) {
  const result = spawnSync(command, args, { cwd: root, env: env || process.env, encoding: 'utf8', stdio: 'pipe', maxBuffer: 30 * 1024 * 1024 })
  const passed = result.status === 0
  results.push({ name, passed, output: `${result.stdout || ''}${result.stderr || ''}`.trim() })
  if (!passed) break
}

console.log('\nDEVVAULT PRODUCTION PREFLIGHT\n')
for (const result of results) console.log(`${result.name.padEnd(42, '.')} ${result.passed ? 'PASS' : 'FAIL'}`)
const failed = results.find((result) => !result.passed)
if (failed) {
  console.error(`\n${failed.name} output:\n${failed.output}`)
  console.error('\nNOT READY — resolve the failed check and rerun deploy:preflight.')
  process.exitCode = 1
} else {
  console.log('\nREADY FOR EXTERNAL DEPLOYMENT SETUP')
  console.log('This result does not create providers, transfer data, or validate real production credentials.')
}
