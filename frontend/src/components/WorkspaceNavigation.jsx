import { NavLink } from 'react-router-dom'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/skills', label: 'Skills' },
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

export function WorkspaceNavigation() {
  return (
    <nav
      aria-label="Workspace"
      className="nav-links nav-links--workspace flex w-full flex-nowrap gap-2 overflow-x-auto pb-1 md:w-auto md:flex-wrap md:justify-end md:overflow-visible"
    >
      {navigationItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={getNavLinkClass}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}