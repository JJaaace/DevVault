const PUBLIC_PORTFOLIO_PATTERN = /^\/portfolio\/[^/?#]+(?:\/[^?#]*)?\/?$/i
const LEGACY_PUBLIC_RESUME_PATTERN = /^\/resume\/[^/?#]+\/?$/i

const OWNER_WORKSPACE_PATTERNS = [
  /^\/dashboard\/?$/i,
  /^\/inside-vault\/?$/i,
  /^\/projects(?:\/.*)?$/i,
  /^\/skills\/?$/i,
  /^\/certifications\/?$/i,
  /^\/goals\/?$/i,
  /^\/profile(?:\/.*)?$/i,
  /^\/resume-workspace\/?$/i,
  /^\/settings\/?$/i,
]

export function isPublicPortfolioRoute(pathname) {
  const path = String(pathname || '').split(/[?#]/, 1)[0]
  return PUBLIC_PORTFOLIO_PATTERN.test(path) || LEGACY_PUBLIC_RESUME_PATTERN.test(path)
}

export function isOwnerWorkspaceRoute(pathname) {
  const path = String(pathname || '').split(/[?#]/, 1)[0]
  return OWNER_WORKSPACE_PATTERNS.some((pattern) => pattern.test(path))
}

export function shouldInitializeClerk(pathname) {
  return !isPublicPortfolioRoute(pathname)
}

export function resolveGuestWorkspacePath(basePath, destination) {
  const value = String(destination || '')
  if (!value.startsWith('/')) return value
  if (isPublicPortfolioRoute(value)) return value

  if (value === '/dashboard') return basePath
  if (value.startsWith('/inside-vault')) return `${basePath}/about`
  if (value.startsWith('/projects')) return `${basePath}/projects`
  if (value.startsWith('/skills')) {
    const query = value.includes('?') ? value.slice(value.indexOf('?')) : ''
    return `${basePath}/skills${query}`
  }
  if (value.startsWith('/certifications')) return `${basePath}/certifications`
  if (value.startsWith('/resume-workspace')) return `${basePath}/resume`
  if (value.startsWith('/goals') || value.startsWith('/profile') || value.startsWith('/settings')) return basePath
  // Keep future or accidental app-relative links inside the read-only shell.
  // External URLs and in-page hashes do not start with `/` and pass through above.
  return basePath
}
