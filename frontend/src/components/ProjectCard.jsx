import { Link } from 'react-router-dom'
import { formatProjectDate, formatProjectRelativeDate, getProjectStatusMeta } from '../lib/projectUtils'

function BannerFallback() {
  return (
    <div className="project-banner-fallback relative flex aspect-[16/8] items-end overflow-hidden rounded-[1rem] p-3">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,224,178,0.36),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(227,132,57,0.25),transparent_28%)]" />
      <div className="relative flex items-center gap-2 rounded-full border border-white/20 bg-[rgba(32,23,15,0.46)] px-2.5 py-1.5 text-[11px] font-semibold text-[rgba(255,243,222,0.92)] backdrop-blur-md">
        Showcase banner
      </div>
    </div>
  )
}

export function ProjectCard({ project, readOnly = false }) {
  const statusMeta = getProjectStatusMeta(project.status)
  const techStack = project.techStack || []
  const keyFeatures = project.keyFeatures || []

  return (
    <article className="widget-card project-showcase-card project-showcase-card--compact h-full overflow-hidden hover-lift">
      <div className="group/project relative p-3.5 pb-0">
        <div className="project-banner-shell">
          {project.bannerImageUrl ? (
            <img
              src={project.bannerImageUrl}
              alt={`${project.title} banner`}
              className="project-banner-image aspect-[16/8] w-full rounded-[1rem] object-cover"
            />
          ) : (
            <BannerFallback />
          )}
        </div>
        <div className="project-banner-glow" />
      </div>

      <div className="space-y-3.5 p-4 md:p-[1.125rem]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`inline-flex text-[10px] ${statusMeta.badgeClass}`}>
              {statusMeta.label}
            </div>
            <h3 className="mt-2.5 text-xl font-semibold tracking-tight text-[var(--color-text)] md:text-[1.33rem]">
              {project.title}
            </h3>
            {project.displayOrder ? (
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Feature slot #{project.displayOrder}</p>
            ) : null}
          </div>
        </div>

        <p className="project-description text-sm leading-6 text-[var(--color-text-soft)]">{project.description}</p>

        {techStack.length ? (
          <div className="flex flex-wrap gap-2">
            {techStack.map((item) => (
              <span key={item} className="chip tech-tag text-[11px]">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {keyFeatures.length ? (
          <div className="project-features-grid">
            {keyFeatures.slice(0, 3).map((feature) => (
              <div key={feature} className="project-feature-item">
                {feature}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
          <span>{formatProjectRelativeDate(project.updatedAt)}</span>
          <span>{project.dateStarted ? `Started ${formatProjectDate(project.dateStarted)}` : 'Ready to launch'}</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href={project.githubUrl || '#'}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!project.githubUrl}
            className={`button-secondary min-w-[6.9rem] justify-center px-3 py-1.5 text-xs ${!project.githubUrl ? 'pointer-events-none opacity-50' : ''}`}
          >
            GitHub
          </a>
          <a
            href={project.liveDemoUrl || '#'}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!project.liveDemoUrl}
            className={`button-secondary min-w-[6.9rem] justify-center px-3 py-1.5 text-xs ${!project.liveDemoUrl ? 'pointer-events-none opacity-50' : ''}`}
          >
            Live demo
          </a>
          {readOnly ? null : (
            <Link to={`/projects/${project.id}/edit`} className="button-primary min-w-[6.9rem] justify-center px-3 py-1.5 text-xs">
              Edit
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}