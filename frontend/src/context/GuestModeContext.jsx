import { createContext, useContext, useMemo } from 'react'
import { resolveGuestWorkspacePath } from '../lib/routeAccess'

const GuestModeContext = createContext({
  isGuestMode: false,
  portfolio: null,
  basePath: '',
  resolvePath: (path) => path,
})

export function GuestModeProvider({ portfolio, children }) {
  const basePath = `/portfolio/${encodeURIComponent(portfolio.profile.username)}/vault`
  const value = useMemo(() => ({
    isGuestMode: true,
    portfolio,
    basePath,
    resolvePath: (path) => resolveGuestWorkspacePath(basePath, path),
  }), [basePath, portfolio])

  return <GuestModeContext.Provider value={value}>{children}</GuestModeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGuestMode() {
  return useContext(GuestModeContext)
}
