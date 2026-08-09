import assert from 'node:assert/strict'
import test from 'node:test'
import { getPortfolioPath, resolvePortfolioResourcePath } from './portfolioRoutes.js'

test('portfolio paths derive from the canonical profile username', () => {
  assert.equal(getPortfolioPath('new username'), '/portfolio/new%20username')
  assert.equal(getPortfolioPath(''), '/profile')
})

test('username-specific portfolio resources resolve without changing stored goal data', () => {
  assert.equal(resolvePortfolioResourcePath('/portfolio/old-name', 'current-name'), '/portfolio/current-name')
  assert.equal(
    resolvePortfolioResourcePath('/portfolio/old-name/vault/projects?featured=true', 'current-name'),
    '/portfolio/current-name/vault/projects?featured=true',
  )
  assert.equal(resolvePortfolioResourcePath('/projects', 'current-name'), '/projects')
  assert.equal(resolvePortfolioResourcePath('https://example.com/portfolio/old-name', 'current-name'), 'https://example.com/portfolio/old-name')
  assert.equal(resolvePortfolioResourcePath('/portfolio/old-name', ''), '/profile')
})
