import { AmbientParticleNetwork } from './ambient/AmbientParticleNetwork'

export function Layout({ children }) {
  return (
    <div className="app-shell min-h-screen text-[var(--color-text)]">
      <AmbientParticleNetwork />
      {children}
    </div>
  )
}
