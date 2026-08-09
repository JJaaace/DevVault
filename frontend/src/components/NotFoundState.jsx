import { Link, useParams } from 'react-router-dom'
import { DevVaultLogo } from './branding/DevVaultLogo'

export function NotFoundState({ publicMode = false }) {
  const { username } = useParams()
  const returnPath = publicMode && username
    ? `/portfolio/${encodeURIComponent(username)}`
    : publicMode
      ? '/'
      : '/dashboard'

  return (
    <section className="guest-state" aria-labelledby="not-found-title">
      <DevVaultLogo compact size="lg" />
      <p>Route not found</p>
      <h1 id="not-found-title">This part of the Vault does not exist.</h1>
      <span>The link may be outdated, or this area may not be available in the current view.</span>
      <Link className="guest-button guest-button--primary" to={returnPath}>{publicMode ? 'Return to portfolio' : 'Open Dashboard'}</Link>
    </section>
  )
}
