import { memo } from 'react'
import { Link } from 'react-router-dom'
import { DevVaultLogo } from '../branding/DevVaultLogo'
import { getProjectStatusMeta } from '../../lib/projectUtils'
import { shouldShowProjectLiveDemo } from '../../lib/projectShowcaseCatalog'
import { useGuestMode } from '../../context/GuestModeContext'
import { useAuthenticatedMediaUrl } from '../../hooks/useAuthenticatedMediaUrl'

const TECH_ICONS = {
  react: '⚛',
  typescript: 'TS',
  javascript: 'JS',
  python: 'Py',
  aws: '☁',
  node: '⬢',
  'node.js': '⬢',
  postgresql: 'PG',
  prisma: 'Pr',
  ai: 'AI',
  cybersecurity: '🛡',
  analytics: '∆',
}

function getTechToken(tech) {
  const normalized = String(tech || '').toLowerCase()
  return TECH_ICONS[normalized] || '•'
}

function BannerFallback() {
  return (
    <div className="projects-gallery-fallback">
      <div className="projects-gallery-fallback-grid" />
      <div className="projects-gallery-fallback-badge">Product Showcase</div>
    </div>
  )
}

function getStatusClass(status) {
  if (status === 'COMPLETED') {
    return 'projects-gallery-status projects-gallery-status--completed'
  }

  if (status === 'ARCHIVED') {
    return 'projects-gallery-status projects-gallery-status--archived'
  }

  if (status === 'BUILDING') {
    return 'projects-gallery-status projects-gallery-status--building'
  }

  return 'projects-gallery-status projects-gallery-status--planning'
}

function ProjectsGalleryCardComponent({
  project,
  index,
  readOnly = false,
  getToken,
}) {
  const { resolvePath, isGuestMode } = useGuestMode()
  const statusMeta = getProjectStatusMeta(project.showcase.status)
  const techStack = project.showcase.techStack || []
  const keyFeatures = project.showcase.keyFeatures || []
  const useDevVaultLogo = project.showcase.logoVariant === 'devvault-mark'
  const showLiveDemo = shouldShowProjectLiveDemo(project)
  const { src: artworkSrc } = useAuthenticatedMediaUrl(project.showcase.image, getToken, { enabled: !isGuestMode })

  return (
    <article
      className={`projects-gallery-card ${project.showcase.featured ? 'projects-gallery-card--featured' : ''}`.trim()}
      style={{ '--showcase-delay': `${Math.min(index, 10) * 90}ms` }}
      tabIndex={0}
    >
      <div className="projects-gallery-media">
        {useDevVaultLogo ? (
          <div className="projects-gallery-logo-banner" aria-label="DevVault logo showcase">
            <div className="projects-gallery-logo-shell">
              <DevVaultLogo compact size="xl" />
            </div>
          </div>
        ) : artworkSrc ? (
          <img
            src={artworkSrc}
            alt={`${project.showcase.title} artwork`}
            loading="lazy"
            decoding="async"
            className="projects-gallery-image"
          />
        ) : (
          <BannerFallback />
        )}
        <div className="projects-gallery-reflection" />
        <div className="projects-gallery-base-overlay" />
        <div className="projects-gallery-head">
          <div className="projects-gallery-status-row">
            <span className={getStatusClass(project.showcase.status)}>{statusMeta.label}</span>
            {project.showcase.featured ? <span className="projects-gallery-featured">Featured</span> : null}
          </div>
          <h3 className="projects-gallery-title">{project.showcase.title}</h3>
          {techStack.length ? (
            <div className="projects-gallery-tech-row">
              {techStack.slice(0, 4).map((tech) => (
                <span key={tech} className="projects-gallery-tech-pill">
                  <span className="projects-gallery-tech-icon" aria-hidden="true">{getTechToken(tech)}</span>
                  {tech}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="projects-gallery-hover-overlay">
          <p className="projects-gallery-description">{project.showcase.description}</p>
          {keyFeatures.length ? (
            <ul className="projects-gallery-feature-list">
              {keyFeatures.slice(0, 3).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          ) : null}

          <div className="projects-gallery-hover-tech">
            {techStack.slice(0, 6).map((tech) => (
              <span key={`${project.id}-${tech}`} className="projects-gallery-tech-pill projects-gallery-tech-pill--hover">
                <span className="projects-gallery-tech-icon" aria-hidden="true">{getTechToken(tech)}</span>
                {tech}
              </span>
            ))}
          </div>

          <div className="projects-gallery-actions">
            <a
              href={project.showcase.github || '#'}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!project.showcase.github}
              className={`projects-gallery-action projects-gallery-action--secondary ${!project.showcase.github ? 'pointer-events-none opacity-50' : ''}`.trim()}
            >
              GitHub
            </a>
            <a
              href={showLiveDemo ? project.showcase.demo : '#'}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!showLiveDemo}
              tabIndex={showLiveDemo ? undefined : -1}
              onClick={showLiveDemo ? undefined : (event) => event.preventDefault()}
              className={`projects-gallery-action projects-gallery-action--secondary ${!showLiveDemo ? 'pointer-events-none opacity-50' : ''}`.trim()}
            >
              Live Demo
            </a>
            {!readOnly ? (
              <Link to={`/projects/${project.id}/edit`} className="projects-gallery-action projects-gallery-action--primary">Edit</Link>
            ) : (
              <Link to={resolvePath('/projects')} className="projects-gallery-action projects-gallery-action--primary">Guest View</Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export const ProjectsGalleryCard = memo(ProjectsGalleryCardComponent)
