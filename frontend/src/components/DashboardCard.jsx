export function DashboardCard({ title, description, children, accent = 'amber' }) {
  const accentClass = {
    amber: 'chip--accent',
    stone: '',
    glass: '',
  }[accent]

  return (
    <div className="widget-card hover-lift p-6">
      <div className={`chip ${accentClass}`.trim()}>
        {title}
      </div>
      {description ? <p className="mt-3 text-sm text-[var(--color-text-soft)]">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}
