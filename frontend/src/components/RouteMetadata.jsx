import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { frontendEnvironment } from '../config/runtime'

const OWNER_TITLES = {
  '/dashboard': 'Dashboard | DevVault',
  '/projects': 'Projects | DevVault',
  '/skills': 'Skills | DevVault',
  '/certifications': 'Certifications | DevVault',
  '/goals': 'Goals | DevVault',
  '/profile': 'Profile | DevVault',
  '/inside-vault': 'Inside the Vault | DevVault',
  '/resume-workspace': 'Resume | DevVault',
  '/settings': 'Settings | DevVault',
}

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
}

export function RouteMetadata() {
  const location = useLocation()

  useEffect(() => {
    const isPublic = location.pathname.startsWith('/portfolio/') || location.pathname.startsWith('/resume/')
    const ownerBase = Object.keys(OWNER_TITLES).find((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))
    document.title = isPublic ? 'DevVault | Developer Portfolio' : (OWNER_TITLES[ownerBase] || 'DevVault | Developer Workspace')
    upsertMeta('meta[name="robots"]', { name: 'robots', content: isPublic ? 'index,follow' : 'noindex,nofollow' })
    upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#1a120d' })

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = isPublic ? `${frontendEnvironment.publicAppUrl}${location.pathname}` : frontendEnvironment.publicAppUrl
  }, [location.pathname])

  return null
}
