import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { isOwnerWorkspaceRoute, isPublicPortfolioRoute, resolveGuestWorkspacePath, shouldInitializeClerk } from './routeAccess.js'

const currentDirectory = dirname(fileURLToPath(import.meta.url))

test('public recruiter and nested Guest Vault routes never require Clerk', () => {
  for (const path of [
    '/portfolio/JJaaace',
    '/portfolio/JJaaace/',
    '/portfolio/JJaaace/vault',
    '/portfolio/JJaaace/vault/projects',
    '/portfolio/JJaaace/vault/skills?technology=React',
    '/portfolio/JJaaace/vault/about',
    '/portfolio/JJaaace/vault/certifications',
    '/portfolio/JJaaace/vault/resume',
    '/portfolio/a%20developer/vault/resume',
    '/resume/JJaaace',
  ]) {
    assert.equal(isPublicPortfolioRoute(path), true, path)
    assert.equal(isOwnerWorkspaceRoute(path), false, path)
    assert.equal(shouldInitializeClerk(path), false, path)
  }
})

test('public rendering is selected before Clerk initialization and uses the public API client', () => {
  const mainSource = fs.readFileSync(join(currentDirectory, '..', 'main.jsx'), 'utf8')
  const appSource = fs.readFileSync(join(currentDirectory, '..', 'App.jsx'), 'utf8')
  const portfolioApiSource = fs.readFileSync(join(currentDirectory, 'portfolioApi.js'), 'utf8')
  const guestShellSource = fs.readFileSync(join(currentDirectory, '..', 'components', 'guest', 'GuestVaultShell.jsx'), 'utf8')

  const publicBranch = mainSource.indexOf('if (!shouldInitializeClerk(pathname))')
  const clerkProvider = mainSource.indexOf('<ClerkProvider')
  assert.ok(publicBranch >= 0 && publicBranch < clerkProvider, 'public route branch must run before ClerkProvider')
  assert.match(appSource, /if \(isGuestRoute\) return <><RouteMetadata \/><GuestRoutes \/><\/>/)
  assert.match(portfolioApiSource, /publicRequest\(`\/api\/public\/portfolio\//)
  assert.doesNotMatch(portfolioApiSource, /authenticatedRequest/)
  assert.match(guestShellSource, /fetchPublicPortfolio\(username/)
  assert.doesNotMatch(guestShellSource, /ProtectedRoute|RedirectToSignIn|SignedIn|SignedOut/)
})

test('Vercel rewrites direct public route requests to the SPA entry point', () => {
  const vercelConfig = JSON.parse(fs.readFileSync(join(currentDirectory, '..', '..', 'vercel.json'), 'utf8'))
  assert.deepEqual(vercelConfig.rewrites, [{ source: '/(.*)', destination: '/index.html' }])
})

test('owner workspace routes remain authenticated routes', () => {
  for (const path of [
    '/dashboard', '/inside-vault', '/projects', '/projects/new', '/projects/12/edit',
    '/skills', '/certifications', '/goals', '/profile', '/profile/edit',
    '/resume-workspace', '/settings',
  ]) {
    assert.equal(isOwnerWorkspaceRoute(path), true, path)
    assert.equal(isPublicPortfolioRoute(path), false, path)
    assert.equal(shouldInitializeClerk(path), true, path)
  }

  const appSource = fs.readFileSync(join(currentDirectory, '..', 'App.jsx'), 'utf8')
  const protectedSource = fs.readFileSync(join(currentDirectory, '..', 'components', 'ProtectedRoute.jsx'), 'utf8')
  assert.match(appSource, /<ProtectedRoute>/)
  assert.match(protectedSource, /<SignedOut>[\s\S]*<Navigate to="\/login" replace \/>/)
})

test('Guest Vault navigation maps owner destinations back into the public vault', () => {
  const base = '/portfolio/JJaaace/vault'
  const ownerDestinations = [
    '/dashboard', '/inside-vault', '/projects', '/projects/7/edit', '/skills?technology=React',
    '/certifications', '/resume-workspace', '/goals?goal=2', '/profile', '/settings',
  ]

  for (const destination of ownerDestinations) {
    const resolved = resolveGuestWorkspacePath(base, destination)
    assert.equal(resolved.startsWith(`${base}`), true, `${destination} resolved to ${resolved}`)
    assert.equal(isOwnerWorkspaceRoute(resolved), false, resolved)
  }

  for (const accidentalDestination of ['/login', '/signup', '/unknown-future-workspace-route']) {
    assert.equal(resolveGuestWorkspacePath(base, accidentalDestination), base)
  }
})
