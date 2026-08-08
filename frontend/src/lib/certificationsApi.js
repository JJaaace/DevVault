import { authenticatedBlobRequest, authenticatedRequest } from './api'

export const fetchCertifications = (getToken) => authenticatedRequest('/api/certifications', {}, getToken)
export const fetchCertificationAsset = (id, getToken) => authenticatedBlobRequest(`/api/certifications/${id}/asset`, {}, getToken)
export const createCertification = (payload, getToken) => authenticatedRequest('/api/certifications', { method: 'POST', body: JSON.stringify(payload) }, getToken)
export const updateCertification = (id, payload, getToken) => authenticatedRequest(`/api/certifications/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, getToken)
export const deleteCertification = (id, getToken) => authenticatedRequest(`/api/certifications/${id}`, { method: 'DELETE' }, getToken)
export const reorderCertifications = (orderedIds, getToken) => authenticatedRequest('/api/certifications/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) }, getToken)
export const setFeaturedCertifications = (featuredIds, getToken) => authenticatedRequest('/api/certifications/featured', { method: 'PUT', body: JSON.stringify({ featuredIds }) }, getToken)
export const fetchCertificationRoadmap = (getToken) => authenticatedRequest('/api/certifications/roadmap', {}, getToken)
export const updateCertificationRoadmap = (items, getToken) => authenticatedRequest('/api/certifications/roadmap', { method: 'PUT', body: JSON.stringify({ items }) }, getToken)
export const importLegacyCertifications = (payload, getToken) => authenticatedRequest('/api/certifications/import-legacy', { method: 'POST', body: JSON.stringify(payload), timeoutMs: 30000, retryCount: 0 }, getToken)
