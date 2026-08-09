import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalTechnologyKey, resolveCertificationTechnology } from './certificationTechnology.js'

const skills = [
  { id: 8, name: 'Node.js', technologyKey: 'nodejs' },
  { id: 10, name: 'PostgreSQL', technologyKey: 'postgres' },
  { id: 11, name: 'Prisma ORM', technologyKey: 'prisma' },
  { id: 16, name: 'REST APIs', technologyKey: 'rest-apis' },
  { id: 17, name: 'AWS', technologyKey: 'aws' },
]

test('canonical technology aliases resolve to stable keys', () => {
  assert.equal(canonicalTechnologyKey('NodeJS'), 'nodejs')
  assert.equal(canonicalTechnologyKey('REST APIs'), 'rest-api')
  assert.equal(canonicalTechnologyKey('Prisma ORM'), 'prisma')
  assert.equal(canonicalTechnologyKey('Postgres'), 'postgresql')
})

test('certification technologies link only when a tracked Skill exists', () => {
  assert.equal(resolveCertificationTechnology('REST API', skills).skill?.id, 16)
  assert.equal(resolveCertificationTechnology('PostgreSQL', skills).skill?.id, 10)
  assert.equal(resolveCertificationTechnology('AWS', skills).skill?.id, 17)
  assert.equal(resolveCertificationTechnology('EC2', skills).skill, null)
  assert.equal(resolveCertificationTechnology('HTTP', skills).skillKey, null)
})
