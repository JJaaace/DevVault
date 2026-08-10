import test from 'node:test'
import assert from 'node:assert/strict'
import { decorateProjectShowcase, shouldShowProjectLiveDemo } from './projectShowcaseCatalog.js'

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

test('DevVault suppresses its redundant live demo while other project demos remain available', () => {
  const devVault = decorateProjectShowcase({
    title: 'DevVault',
    liveDemoUrl: 'https://devvault.example.test',
    techStack: [],
  }, 0)
  const otherProject = decorateProjectShowcase({
    title: 'Password Strength Analyzer',
    liveDemoUrl: 'https://password.example.test',
    techStack: [],
  }, 1)

  assert.equal(shouldShowProjectLiveDemo(devVault), false)
  assert.equal(shouldShowProjectLiveDemo(otherProject), true)
})
