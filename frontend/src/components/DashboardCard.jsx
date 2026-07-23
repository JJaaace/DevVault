export function DashboardCard({ title, description, children, accent = 'cyan' }) {
  const accentClass = {
    cyan: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300',
    slate: 'border-slate-700 bg-slate-900/70 text-slate-300',
  }[accent]

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
      <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${accentClass}`}>
        {title}
      </div>
      {description ? <p className="mt-3 text-sm text-slate-400">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}
