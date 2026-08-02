import { useMemo, useState } from 'react'
import { getTechnologyMeta } from '../lib/technologyCatalog'

export function TechnologyLogo({ technologyKey, name, size = 'md' }) {
  const [iconFailed, setIconFailed] = useState(false)
  const techMeta = useMemo(() => getTechnologyMeta(technologyKey, name), [technologyKey, name])

  const sizeClass = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'

  const showFallback = iconFailed || !techMeta.iconUrl
  const initials = techMeta.initials || String(name || techMeta.label || 'T').slice(0, 2).toUpperCase()

  return (
    <div
      className={`${sizeClass} tech-logo-shell`.trim()}
      style={{ '--tech-accent': techMeta.accent }}
      aria-hidden="true"
    >
      {showFallback ? (
        <span className="text-xs font-semibold tracking-[0.14em] text-[var(--color-text)]">{initials}</span>
      ) : (
        <img
          src={techMeta.iconUrl}
          alt={`${techMeta.label} logo`}
          loading="lazy"
          className="h-2/3 w-2/3 object-contain"
          onError={() => setIconFailed(true)}
        />
      )}
    </div>
  )
}
