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
    '/portfolio/a%20developer/vault/resume',
    '/resume/JJaaace',
  ]) {
    assert.equal(isPublicPortfolioRoute(path), true, path)
    assert.equal(isOwnerWorkspaceRoute(path), false, path)
    assert.equal(shouldInitializeClerk(path), false, path)
  }
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
})
