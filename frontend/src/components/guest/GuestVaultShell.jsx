import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { DevVaultLogo } from '../branding/DevVaultLogo'
import { GuestModeProvider } from '../../context/GuestModeContext'
import { fetchPublicPortfolio } from '../../lib/portfolioApi'
import '../../guest-mode.css'

function VaultState({ title, message, retry }) {
  return (
    <div className="guest-state">
      <DevVaultLogo compact size="lg" />
      <p>Guest access</p>
      <h1>{title}</h1>
      <span>{message}</span>
      {retry ? <button type="button" onClick={retry} className="guest-button guest-button--primary">Try again</button> : null}
    </div>
  )
}

function GuestVaultNavigation({ profile }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const base = `/portfolio/${encodeURIComponent(profile.username)}/vault`
  const links = [
    ['Dashboard', base, true],
    ['Inside the Vault', `${base}/about`],
    ['Projects', `${base}/projects`],
    ['Skills', `${base}/skills`],
    ['Resume', `${base}/resume`],
    ['Certifications', `${base}/certifications`],
  ]

  return (
    <header className="guest-vault-header sticky top-0 z-40 px-4 pt-4">
      <div className="nav-shell nav-shell--workspace guest-vault-nav mx-auto max-w-6xl gap-4">
        <Link to={base} className="nav-brand">
          <DevVaultLogo compact />
          <div>
            <p className="nav-kicker">DevVault</p>
            <h1 className="nav-title">Workspace <span className="guest-read-only-badge">Read only</span></h1>
          </div>
        </Link>
        <nav className="guest-vault-links" aria-label="Guest workspace">
          {links.map(([label, to, end]) => (
            <NavLink key={label} to={to} end={Boolean(end)} className={({ isActive }) => `nav-link nav-link--workspace ${isActive ? 'nav-link--active' : ''}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="guest-vault-actions">
          {profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : null}
          {profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
          <Link to={`/portfolio/${encodeURIComponent(profile.username)}`} className="guest-lock-vault px-3 py-2 text-xs">Lock the Vault</Link>
          <button
            type="button"
            className="guest-vault-menu-button"
            aria-expanded={menuOpen}
            aria-controls="guest-vault-mobile-navigation"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
        {menuOpen ? (
          <nav id="guest-vault-mobile-navigation" className="guest-vault-mobile-menu" aria-label="Guest workspace mobile">
            {links.map(([label, to, end]) => (
              <NavLink key={label} to={to} end={Boolean(end)} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link nav-link--workspace ${isActive ? 'nav-link--active' : ''}`}>{label}</NavLink>
            ))}
            <Link to={`/portfolio/${encodeURIComponent(profile.username)}`} onClick={() => setMenuOpen(false)} className="guest-lock-vault guest-vault-mobile-overview">Return to recruiter overview</Link>
          </nav>
        ) : null}
      </div>
    </header>
  )
}

export function GuestVaultShell() {
  const { username } = useParams()
  const location = useLocation()
  const [portfolio, setPortfolio] = useState(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchPublicPortfolio(username, { force: reloadKey > 0 })
      .then((data) => { if (!cancelled) setPortfolio(data) })
      .catch((requestError) => { if (!cancelled) setError(requestError || new Error('Unable to open this Vault.')) })
    return () => { cancelled = true }
  }, [reloadKey, username])

  useEffect(() => {
    if (!portfolio?.profile) return
    const section = location.pathname.split('/').filter(Boolean).at(-1)
    const sectionTitle = {
      about: 'Inside the Vault', projects: 'Projects', skills: 'Skills',
      certifications: 'Credentials', resume: 'Resume', vault: 'DevVault',
    }[section] || 'DevVault'
    document.title = `${sectionTitle} | ${portfolio.profile.firstName} ${portfolio.profile.lastName}`
  }, [location.pathname, portfolio])

  if (error) return <VaultState title={error.status === 404 ? 'Portfolio not found' : 'Vault unavailable'} message={error.message || error} retry={() => { setError(''); setReloadKey((value) => value + 1) }} />
  if (!portfolio?.profile) return <VaultState title="Opening Guest Mode" message="Preparing the read-only workspace…" />

  return (
    <GuestModeProvider portfolio={portfolio}>
      <div className="guest-vault-shell">
        <GuestVaultNavigation profile={portfolio.profile} />
        <main id="main-content" className="guest-vault-main">
          <Outlet />
        </main>
      </div>
    </GuestModeProvider>
  )
}
