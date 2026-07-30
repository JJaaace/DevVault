export function WorkspaceWidget({ eyebrow, title, description, action, children, className = '' }) {
  return (
    <section className={`widget-card hover-lift p-6 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-7 text-[var(--color-text-soft)]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}