import { Component } from 'react'
import { DevVaultLogo } from './branding/DevVaultLogo'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error('DevVault render failure', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main id="main-content" className="app-shell flex min-h-screen items-center justify-center px-6 text-center text-[var(--color-text)]">
        <div className="surface-card surface-card--strong max-w-lg px-8 py-10">
          <DevVaultLogo compact size="lg" />
          <p className="section-eyebrow mt-5">Vault interruption</p>
          <h1 className="mt-3 text-3xl font-semibold">DevVault hit an unexpected error.</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--color-text-soft)]">Your data has not been changed. Reload the page to reconnect to the workspace.</p>
          <button type="button" className="button-primary mt-6 px-5 py-3" onClick={() => window.location.reload()}>Reload DevVault</button>
        </div>
      </main>
    )
  }
}
