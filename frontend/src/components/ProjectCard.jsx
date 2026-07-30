import { Link } from 'react-router-dom'
import { formatProjectDate, formatProjectRelativeDate, getProjectStatusMeta } from '../lib/projectUtils'

function BannerFallback() {
  return (
    <div className="relative flex aspect-[16/9] items-end overflow-hidden rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(249,201,110,0.4),rgba(234,139,33,0.38),rgba(217,106,22,0.42))] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.38),transparent_28%)]" />
      <div className="relative flex items-center gap-3 rounded-full border border-white/30 bg-white/30 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
        Project banner
      </div>
    </div>
  )
}

export function ProjectCard({ project, readOnly = false }) {
  const statusMeta = getProjectStatusMeta(project.status)
  const techStack = project.techStack || []

  return (
    <article className="widget-card overflow-hidden hover-lift">
      <div className="p-4 pb-0">
        {project.bannerImageUrl ? (
          <img
            src={project.bannerImageUrl}
            alt={`${project.title} banner`}
            className="aspect-[16/9] w-full rounded-[1.35rem] object-cover"
          />
        ) : (
          <BannerFallback />
        )}
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`inline-flex ${statusMeta.badgeClass}`}>
              {statusMeta.label}
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              {project.title}
            </h3>
          </div>
          <div className="rounded-full border border-[rgba(126,89,45,0.14)] bg-white/70 px-3 py-2 text-sm font-semibold text-[var(--color-brand-ink)]">
            {project.completionPercentage}%
          </div>
        </div>

        <p className="text-sm leading-7 text-[var(--color-text-soft)]">{project.description}</p>

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

        <div className="flex items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
          <span>{formatProjectRelativeDate(project.updatedAt)}</span>
          <span>{project.dateStarted ? `Started ${formatProjectDate(project.dateStarted)}` : 'Ready to launch'}</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={project.githubUrl || '#'}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!project.githubUrl}
            className={`button-secondary justify-center px-4 py-2 text-sm ${!project.githubUrl ? 'pointer-events-none opacity-50' : ''}`}
          >
            GitHub
          </a>
          <a
            href={project.liveDemoUrl || '#'}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!project.liveDemoUrl}
            className={`button-secondary justify-center px-4 py-2 text-sm ${!project.liveDemoUrl ? 'pointer-events-none opacity-50' : ''}`}
          >
            Live demo
          </a>
          {readOnly ? null : (
            <Link to={`/projects/${project.id}/edit`} className="button-primary justify-center px-4 py-2 text-sm">
              Edit
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}