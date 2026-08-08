import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/inside-vault', label: 'Inside the Vault' },
  { to: '/projects', label: 'Projects' },
  { to: '/skills', label: 'Skills' },
  { to: '/resume-workspace', label: 'Resume' },
  { to: '/certifications', label: 'Certifications' },
  { to: '/goals', label: 'Goals' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]

function getNavLinkClass({ isActive }) {
  return [
    'nav-link',
    'nav-link--workspace',
    isActive ? 'nav-link--active' : '',
  ].filter(Boolean).join(' ')
}

function WorkspaceNavLink({ item, onClick }) {
  return (
    <NavLink to={item.to} end={item.end} className={getNavLinkClass} onClick={onClick}>
      <span className="nav-link-label">{item.label}</span>
    </NavLink>
  )
}

function WorkspaceNavGroup({ mobile = false, onNavigate }) {
  const location = useLocation()
  const navRef = useRef(null)
  const indicatorRef = useRef(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) return undefined
    const updateIndicator = () => {
      const activeLink = nav.querySelector('[aria-current="page"]')
      if (!activeLink) return
      indicator.style.width = `${activeLink.offsetWidth}px`
      indicator.style.height = `${activeLink.offsetHeight}px`
      indicator.style.transform = `translate(${activeLink.offsetLeft}px, ${activeLink.offsetTop}px)`
      indicator.style.opacity = '1'
    }
    updateIndicator()
    const observer = new ResizeObserver(updateIndicator)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [location.pathname])

  return (
    <nav
      ref={navRef}
      id={mobile ? 'workspace-mobile-navigation' : undefined}
      aria-label={mobile ? 'Workspace mobile' : 'Workspace'}
      className={mobile
        ? 'nav-links nav-links--workspace absolute right-0 top-[calc(100%+0.75rem)] z-50 grid min-w-56 gap-2 rounded-[1.25rem] border border-[rgba(214,160,89,0.24)] bg-[rgba(31,23,17,0.98)] p-3 shadow-[0_24px_70px_rgba(9,6,4,0.62)] md:hidden'
        : 'nav-links nav-links--workspace hidden gap-2 md:flex md:flex-wrap md:justify-end'}
    >
      <span ref={indicatorRef} className="nav-link-indicator" aria-hidden="true" />
      {navigationItems.map((item) => (
        <WorkspaceNavLink key={item.to} item={item} onClick={onNavigate} />
      ))}
    </nav>
  )
}

export function WorkspaceNavigation() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        className="button-secondary px-4 py-2 text-sm md:hidden"
        aria-expanded={open}
        aria-controls="workspace-mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
      <WorkspaceNavGroup />
      {open ? <WorkspaceNavGroup mobile onNavigate={() => setOpen(false)} /> : null}
    </div>
  )
}
