export function MetricTile({ label, value, note }) {
  return (
    <div className="rounded-[1.35rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.84)] px-4 py-3 shadow-[0_14px_30px_rgba(18,12,8,0.3)] backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
      {note ? <p className="mt-1 text-xs text-[var(--color-text-soft)]">{note}</p> : null}
    </div>
  )
}