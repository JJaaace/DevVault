import { createContext, useContext, useMemo } from 'react'

const GuestModeContext = createContext({
  isGuestMode: false,
  portfolio: null,
  basePath: '',
  resolvePath: (path) => path,
})

function mapWorkspacePath(basePath, path) {
  const value = String(path || '')
  if (!value.startsWith('/')) return value
  if (value.startsWith('/portfolio/')) return value

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
  return value
}

export function GuestModeProvider({ portfolio, children }) {
  const basePath = `/portfolio/${encodeURIComponent(portfolio.profile.username)}/vault`
  const value = useMemo(() => ({
    isGuestMode: true,
    portfolio,
    basePath,
    resolvePath: (path) => mapWorkspacePath(basePath, path),
  }), [basePath, portfolio])

  return <GuestModeContext.Provider value={value}>{children}</GuestModeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGuestMode() {
  return useContext(GuestModeContext)
}
