import { publicRequest } from './api'
import { frontendEnvironment } from '../config/runtime'

const portfolioCache = new Map()
const PORTFOLIO_CACHE_MS = 30000

export function invalidatePublicPortfolioCache(username) {
  const cacheKey = String(username || '').trim().toLowerCase()
  if (cacheKey) portfolioCache.delete(cacheKey)
  else portfolioCache.clear()
}

export function getPublicAppUrl() {
  const configured = frontendEnvironment.publicAppUrl
  if (configured) return configured
  return typeof window !== 'undefined' ? window.location.origin : ''
}

export function getPublicAssetUrl(path) {
  if (!path || /^(data:|blob:|https?:)/i.test(path)) return path || ''
  const apiBase = frontendEnvironment.apiBaseUrl
  return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`
}

export async function fetchPublicPortfolio(username, { force = false } = {}) {
  const cacheKey = String(username || '').trim().toLowerCase()
  const cached = portfolioCache.get(cacheKey)
  if (!force && cached && Date.now() - cached.createdAt < PORTFOLIO_CACHE_MS) return cached.promise

  const promise = publicRequest(`/api/public/portfolio/${encodeURIComponent(username)}`).then((portfolio) => ({
    ...portfolio,
    profile: portfolio.profile ? { ...portfolio.profile, profileImageUrl: getPublicAssetUrl(portfolio.profile.profileImageUrl) } : null,
    projects: (portfolio.projects || []).map((project) => ({ ...project, bannerImageUrl: getPublicAssetUrl(project.bannerImageUrl) })),
    certifications: (portfolio.certifications || []).map((certification) => ({ ...certification, assetUrl: getPublicAssetUrl(certification.assetUrl) })),
    resume: portfolio.resume ? { ...portfolio.resume, fileUrl: getPublicAssetUrl(portfolio.resume.fileUrl) } : null,
  })).catch((error) => {
    portfolioCache.delete(cacheKey)
    throw error
  })
  portfolioCache.set(cacheKey, { createdAt: Date.now(), promise })
  return promise
}
