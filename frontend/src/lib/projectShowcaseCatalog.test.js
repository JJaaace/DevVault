import test from 'node:test'
import assert from 'node:assert/strict'
import { decorateProjectShowcase } from './projectShowcaseCatalog.js'

test('curated project artwork wins over catalog and GitHub artwork', () => {
  const project = decorateProjectShowcase({
    title: 'DevVault',
    bannerImageUrl: '/custom/devvault.png',
    bannerImageSource: 'CURATED',
    featured: true,
    techStack: [],
  }, 0)
  assert.equal(project.showcase.image, '/custom/devvault.png')
  assert.equal(project.showcase.featured, true)
})

test('catalog artwork wins over low-authority GitHub owner avatars', () => {
  const project = decorateProjectShowcase({
    title: 'DevVault',
    bannerImageUrl: 'https://avatars.githubusercontent.com/u/1',
    bannerImageSource: 'GITHUB',
    featured: false,
    techStack: [],
  }, 0)
  assert.equal(project.showcase.image, '/project-showcase/devvault.svg')
  assert.equal(project.showcase.featured, false)
})
