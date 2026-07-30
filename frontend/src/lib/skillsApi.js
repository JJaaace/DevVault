import { authenticatedRequest } from './api'

export function fetchSkills(getToken) {
  return authenticatedRequest('/api/skills', {}, getToken)
}

export function fetchSkill(skillId, getToken) {
  return authenticatedRequest(`/api/skills/${skillId}`, {}, getToken)
}

export function createSkill(payload, getToken) {
  return authenticatedRequest('/api/skills', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getToken)
}

export function updateSkill(skillId, payload, getToken) {
  return authenticatedRequest(`/api/skills/${skillId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, getToken)
}

export function deleteSkill(skillId, getToken) {
  return authenticatedRequest(`/api/skills/${skillId}`, {
    method: 'DELETE',
  }, getToken)
}