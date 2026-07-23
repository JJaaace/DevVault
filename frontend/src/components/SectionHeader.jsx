export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">{eyebrow}</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
        {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
