import { authenticatedRequest } from './api'

export const fetchGoals = (getToken) => authenticatedRequest('/api/goals', {}, getToken)
export const createGoal = (payload, getToken) => authenticatedRequest('/api/goals', { method: 'POST', body: JSON.stringify(payload) }, getToken)
export const updateGoal = (goalId, payload, getToken) => authenticatedRequest(`/api/goals/${goalId}`, { method: 'PUT', body: JSON.stringify(payload) }, getToken)
export const deleteGoal = (goalId, getToken) => authenticatedRequest(`/api/goals/${goalId}`, { method: 'DELETE' }, getToken)
export const reorderGoals = (orderedIds, getToken) => authenticatedRequest('/api/goals/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) }, getToken)
