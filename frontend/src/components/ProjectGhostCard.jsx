import { getProjectStatusMeta } from '../lib/projectUtils'

export function ProjectGhostCard({ project }) {
  const statusMeta = getProjectStatusMeta(project.status)
  const techStack = project.techStack || []

  return (
    <article className="widget-card overflow-hidden border-dashed border-[rgba(214,160,89,0.24)] bg-[rgba(44,33,24,0.8)] p-4 opacity-85 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(18,12,8,0.34)]">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-[rgba(214,160,89,0.24)] bg-[linear-gradient(135deg,rgba(249,201,110,0.22),rgba(64,46,32,0.82),rgba(234,139,33,0.2))]">
        <div className="aspect-[16/9]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.65),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.34),transparent_28%)]" />
        <div className="absolute left-4 top-4 inline-flex rounded-full border border-[rgba(214,160,89,0.24)] bg-[rgba(50,37,27,0.88)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-ink)] backdrop-blur-md">
          {statusMeta.label}
        </div>
      </div>

      <div className="space-y-4 p-2 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">{project.title}</h4>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">{project.description}</p>
          </div>
          <div className={`inline-flex ${statusMeta.badgeClass}`}>
            {statusMeta.label}
          </div>
        </div>

        {techStack.length ? (
          <div className="flex flex-wrap gap-2">
            {techStack.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}