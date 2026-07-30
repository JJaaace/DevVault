import { authenticatedRequest } from './api'

export function fetchProjects(getToken) {
  return authenticatedRequest('/api/projects', {}, getToken)
}

export function fetchProject(projectId, getToken) {
  return authenticatedRequest(`/api/projects/${projectId}`, {}, getToken)
}

export function createProject(payload, getToken) {
  return authenticatedRequest('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, getToken)
}

export function updateProject(projectId, payload, getToken) {
  return authenticatedRequest(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, getToken)
}

export function deleteProject(projectId, getToken) {
  return authenticatedRequest(`/api/projects/${projectId}`, {
    method: 'DELETE',
  }, getToken)
}