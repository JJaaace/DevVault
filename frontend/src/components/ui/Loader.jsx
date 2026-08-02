export function Loader({ label = 'Loading...', className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2 text-sm text-[var(--color-text-soft)] ${className}`.trim()} role="status" aria-live="polite">
      <span className="ui-loader-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
