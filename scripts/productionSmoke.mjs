const APP_URL = String(process.env.APP_URL || '').trim().replace(/\/$/, '')
const API_URL = String(process.env.API_URL || '').trim().replace(/\/$/, '')
const USERNAME = String(process.env.PORTFOLIO_USERNAME || '').trim()
const failures = []
const results = []

if (!APP_URL || !API_URL || !USERNAME) {
  console.error('APP_URL, API_URL, and PORTFOLIO_USERNAME are required.')
  process.exit(1)
}

async function check(name, action) {
  try {
    await action()
    results.push({ name, status: 'PASS' })
  } catch (error) {
    results.push({ name, status: 'FAIL', detail: error.message })
    failures.push(`${name}: ${error.message}`)
  }
}

async function response(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try { return await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' }) }
  finally { clearTimeout(timer) }
}

async function json(path) {
  const res = await response(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.json()
  if (!body?.success) throw new Error('API response did not use the success contract.')
  return body.data
}

const encoded = encodeURIComponent(USERNAME)
let portfolio

await check('Backend health', async () => {
  const health = await json('/health')
  if (health.status !== 'ok') throw new Error('Process health is not ok.')
})
await check('Backend readiness', async () => {
  const readiness = await json('/ready')
  if (readiness.status !== 'ready' || readiness.database !== 'reachable') throw new Error('Database readiness failed.')
})

for (const route of [
  `/portfolio/${encoded}`,
  `/portfolio/${encoded}/vault`,
  `/portfolio/${encoded}/vault/about`,
  `/portfolio/${encoded}/vault/projects`,
  `/portfolio/${encoded}/vault/skills`,
  `/portfolio/${encoded}/vault/certifications`,
  `/portfolio/${encoded}/vault/resume`,
]) {
  await check(`Frontend ${route}`, async () => {
    const res = await response(`${APP_URL}${route}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = await res.text()
    if (!body.includes('id="root"')) throw new Error('SPA application shell was not returned.')
  })
}

await check('Public portfolio API and privacy DTO', async () => {
  portfolio = await json(`/api/public/portfolio/${encoded}`)
  if (!portfolio?.profile || !Array.isArray(portfolio.projects) || !Array.isArray(portfolio.skills) || !Array.isArray(portfolio.certifications)) {
    throw new Error('Portfolio response is incomplete.')
  }
  const serialized = JSON.stringify(portfolio)
  for (const forbidden of ['ownerClerkUserId', 'clerkUserId', 'privateNotes', 'githubSyncState']) {
    if (serialized.includes(`"${forbidden}"`)) throw new Error(`Public DTO exposes ${forbidden}.`)
  }
  if ((portfolio.goals || []).some((goal) => Object.hasOwn(goal, 'notes') || Object.hasOwn(goal, 'resources'))) throw new Error('Public goals expose private fields.')
  if ((portfolio.certifications || []).some((cert) => Object.hasOwn(cert, 'notes') || Object.hasOwn(cert, 'assetData'))) throw new Error('Public certifications expose private fields.')
})

await check('Public projects represented', async () => { if (!portfolio?.projects?.length) throw new Error('No public projects returned.') })
await check('Public skills represented', async () => { if (!portfolio?.skills?.length) throw new Error('No public skills returned.') })
await check('Public certifications represented', async () => { if (!portfolio?.certifications?.length) throw new Error('No public certifications returned.') })

await check('Public profile image', async () => {
  if (!portfolio?.profile?.profileImageUrl) return
  const path = portfolio.profile.profileImageUrl.replace(API_URL, '')
  const res = await response(`${API_URL}${path}`)
  if (!res.ok || !String(res.headers.get('content-type')).startsWith('image/')) throw new Error(`HTTP ${res.status} or invalid content type.`)
})

await check('Public resume', async () => {
  if (!portfolio?.resume?.uploaded) return
  const path = portfolio.resume.fileUrl.replace(API_URL, '')
  const res = await response(`${API_URL}${path}`)
  if (!res.ok || res.headers.get('content-type') !== 'application/pdf') throw new Error(`HTTP ${res.status} or invalid content type.`)
})

for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
  await check(`Guest mutation rejected (${method})`, async () => {
    const res = await response(`${API_URL}/api/public/portfolio/${encoded}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify({ bio: 'unauthorized smoke-test write' }),
    })
    if (![404, 405].includes(res.status)) throw new Error(`Expected 404/405; received ${res.status}.`)
  })
}

console.log('\nDEVVAULT PRODUCTION SMOKE\n')
for (const result of results) console.log(`${result.name.padEnd(48, '.')} ${result.status}${result.detail ? ` — ${result.detail}` : ''}`)
console.log(failures.length ? `\nFAILED (${failures.length})` : '\nPUBLIC PRODUCTION SMOKE PASSED')
if (failures.length) process.exitCode = 1
