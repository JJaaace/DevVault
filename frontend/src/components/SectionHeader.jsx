export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="section-eyebrow">{eyebrow}</p>
        <h3 className="section-title mt-2 text-2xl">{title}</h3>
        {description ? <p className="section-copy mt-2 text-sm">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
