import { publicRequest } from './api'

export function getPublicAppUrl() {
  const configured = String(import.meta.env.VITE_PUBLIC_APP_URL || '').trim().replace(/\/$/, '')
  if (configured) return configured
  return typeof window !== 'undefined' ? window.location.origin : ''
}

export function getPublicAssetUrl(path) {
  if (!path || /^(data:|blob:|https?:)/i.test(path)) return path || ''
  const apiBase = String(import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5001')).trim().replace(/\/$/, '')
  return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`
}

export async function fetchPublicPortfolio(username) {
  const portfolio = await publicRequest(`/api/public/portfolio/${encodeURIComponent(username)}`)
  return {
    ...portfolio,
    profile: portfolio.profile ? { ...portfolio.profile, profileImageUrl: getPublicAssetUrl(portfolio.profile.profileImageUrl) } : null,
    projects: (portfolio.projects || []).map((project) => ({ ...project, bannerImageUrl: getPublicAssetUrl(project.bannerImageUrl) })),
    certifications: (portfolio.certifications || []).map((certification) => ({ ...certification, assetUrl: getPublicAssetUrl(certification.assetUrl) })),
    resume: portfolio.resume ? { ...portfolio.resume, fileUrl: getPublicAssetUrl(portfolio.resume.fileUrl) } : null,
  }
}
