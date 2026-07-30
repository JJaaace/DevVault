export function MetricTile({ label, value, note }) {
  return (
    <div className="rounded-[1.35rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.75)] px-4 py-3 shadow-[0_14px_30px_rgba(110,76,34,0.06)] backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
      {note ? <p className="mt-1 text-xs text-[var(--color-text-soft)]">{note}</p> : null}
    </div>
  )
}