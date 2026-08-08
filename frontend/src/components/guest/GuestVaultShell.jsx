import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { DevVaultLogo } from '../branding/DevVaultLogo'
import { GuestModeProvider } from '../../context/GuestModeContext'
import { fetchPublicPortfolio } from '../../lib/portfolioApi'
import '../../guest-mode.css'

function VaultState({ title, message }) {
  return (
    <div className="guest-state">
      <DevVaultLogo compact size="lg" />
      <p>Guest access</p>
      <h1>{title}</h1>
      <span>{message}</span>
    </div>
  )
}

function GuestVaultNavigation({ profile }) {
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
    <header className="sticky top-0 z-40 px-4 pt-4">
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
          <Link to={`/portfolio/${profile.username}`} className="button-secondary px-3 py-2 text-xs">Exit Guest Mode</Link>
        </div>
      </div>
    </header>
  )
}

export function GuestVaultShell() {
  const { username } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchPublicPortfolio(username)
      .then((data) => { if (!cancelled) setPortfolio(data) })
      .catch((requestError) => { if (!cancelled) setError(requestError.message || 'Unable to open this Vault.') })
    return () => { cancelled = true }
  }, [username])

  if (error) return <VaultState title="Vault unavailable" message={error} />
  if (!portfolio?.profile) return <VaultState title="Opening Guest Mode" message="Preparing the read-only workspace…" />

  return (
    <GuestModeProvider portfolio={portfolio}>
      <div className="guest-vault-shell">
        <GuestVaultNavigation profile={portfolio.profile} />
        <main className="guest-vault-main">
          <Outlet />
        </main>
      </div>
    </GuestModeProvider>
  )
}
