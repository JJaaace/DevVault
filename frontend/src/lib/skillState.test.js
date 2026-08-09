import assert from 'node:assert/strict'
import test from 'node:test'
import { applySavedSkill, buildSkillUpdatePayload, getGuestSkillSource } from './skillState.js'

test('authenticated Skills source is safe when no Guest portfolio exists', () => {
  assert.deepEqual(getGuestSkillSource(false, null), { profile: null, skills: [], projects: [] })
  assert.deepEqual(getGuestSkillSource(true, {}), { profile: null, skills: [], projects: [] })
})

test('confirmed skill response immediately replaces the stale card without changing relationships', () => {
  const original = { id: 1, name: 'Java', experienceLevel: 'EXPERT', favorite: true, relatedProjects: [{ id: 1 }, { id: 2 }] }
  const saved = { ...original, experienceLevel: 'ADVANCED' }
  const result = applySavedSkill([original, { id: 2, name: 'Python', favorite: false }], saved)

  assert.equal(result[0].experienceLevel, 'ADVANCED')
  assert.deepEqual(result[0].relatedProjects, [{ id: 1 }, { id: 2 }])
})

test('one persisted favorite replaces the previous favorite in local React state', () => {
  const result = applySavedSkill(
    [{ id: 1, name: 'Java', favorite: true }, { id: 2, name: 'Python', favorite: false }],
    { id: 2, name: 'Python', favorite: true },
  )

  assert.equal(result.find((skill) => skill.id === 1).favorite, false)
  assert.equal(result.find((skill) => skill.id === 2).favorite, true)
})

test('favorite mutations preserve every editable field and project IDs', () => {
  const payload = buildSkillUpdatePayload({
    id: 1,
    name: 'Java',
    technologyKey: 'java',
    category: 'Programming Languages',
    experienceLevel: 'EXPERT',
    yearsExperience: 2,
    firstUsedYear: 2024,
    color: '#ea8b21',
    lastUsed: '2026-08-02T00:00:00.000Z',
    notes: 'Canonical note',
    publicVisible: true,
    favorite: false,
    relatedProjects: [{ id: 1 }, { id: 2 }],
  }, { favorite: true })

  assert.equal(payload.favorite, true)
  assert.equal(payload.experienceLevel, 'EXPERT')
  assert.deepEqual(payload.relatedProjectIds, [1, 2])
})
