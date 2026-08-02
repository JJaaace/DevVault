import { authenticatedRequest } from './api'

export function startGitHubSync(getToken) {
  return authenticatedRequest('/api/github-sync', {
    method: 'POST',
  }, getToken)
}

export function fetchGitHubSyncStatus(syncId, getToken) {
  return authenticatedRequest(`/api/github-sync/${syncId}`, {}, getToken)
}