import { AmbientParticleNetwork } from './ambient/AmbientParticleNetwork'

export function Layout({ children }) {
  return (
    <div className="app-shell min-h-screen text-[var(--color-text)]">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <AmbientParticleNetwork />
      {children}
    </div>
  )
}
