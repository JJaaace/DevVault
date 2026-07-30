import { getProjectStatusMeta } from '../lib/projectUtils'

export function ProjectGhostCard({ project }) {
  const statusMeta = getProjectStatusMeta(project.status)
  const techStack = project.techStack || []

  return (
    <article className="widget-card overflow-hidden border-dashed border-[rgba(126,89,45,0.16)] bg-[rgba(255,253,249,0.7)] p-4 opacity-85 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(110,76,34,0.12)]">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/60 bg-[linear-gradient(135deg,rgba(249,201,110,0.26),rgba(255,243,224,0.9),rgba(234,139,33,0.18))]">
        <div className="aspect-[16/9]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.65),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.34),transparent_28%)]" />
        <div className="absolute left-4 top-4 inline-flex rounded-full border border-white/50 bg-white/65 px-3 py-1 text-xs font-semibold text-[var(--color-brand-ink)] backdrop-blur-md">
          {statusMeta.label}
        </div>
      </div>

      <div className="space-y-4 p-2 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">{project.title}</h4>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">{project.description}</p>
          </div>
          <div className="rounded-full border border-[rgba(126,89,45,0.14)] bg-white/70 px-3 py-2 text-sm font-semibold text-[var(--color-brand-ink)]">
            {project.completionPercentage}%
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
            <span>Progress</span>
            <span>{project.completionPercentage}% complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.1)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f9c96e] via-[#ea8b21] to-[#d96a16] transition-all"
              style={{ width: `${project.completionPercentage}%` }}
            />
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