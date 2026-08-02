import { TechnologyLogo } from './TechnologyLogo'
import { formatSkillDate, formatYearsExperience, getSkillLevelMeta } from '../lib/skillUtils'

function RelatedProjectChip({ project }) {
  return <span className="chip chip--accent">{project.title}</span>
}

export function SkillCard({ skill, onEdit, onDelete, readOnly = false }) {
  const levelMeta = getSkillLevelMeta(skill.experienceLevel)
  const relatedProjects = skill.relatedProjects || []
  const yearsExperience = formatYearsExperience(skill.yearsExperience)
  const firstUsedYear = skill.firstUsedYear || 'N/A'
  const projectsBuilt = Number(skill.projectsBuilt || 0)

  return (
    <article className="widget-card skill-card-premium overflow-hidden hover-lift">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${skill.color}, transparent)` }} />
      <div className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <TechnologyLogo technologyKey={skill.technologyKey} name={skill.name} size="lg" />
            <div className="min-w-0">
              <p className="section-eyebrow">{skill.category}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{skill.name}</h3>
              <p className={`mt-2 text-sm font-medium ${levelMeta.toneClass}`}>{levelMeta.label}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">{skill.notes || 'Document practical experience highlights, impact, and what this technology unlocked in your projects.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm sm:w-[21rem]">
            <div className="skill-metric-card">
              <p className="skill-metric-label">Years</p>
              <p className="skill-metric-value">{yearsExperience}</p>
            </div>
            <div className="skill-metric-card">
              <p className="skill-metric-label">First Used</p>
              <p className="skill-metric-value">{firstUsedYear}</p>
            </div>
            <div className="skill-metric-card">
              <p className="skill-metric-label">Projects Built</p>
              <p className="skill-metric-value">{projectsBuilt}</p>
            </div>
            <div className="skill-metric-card">
              <p className="skill-metric-label">Last Used</p>
              <p className="skill-metric-value">{formatSkillDate(skill.lastUsed) || 'Recently'}</p>
            </div>
          </div>
        </div>

        {relatedProjects.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {relatedProjects.map((project) => (
              <RelatedProjectChip key={project.id} project={project} />
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
            Tech key {skill.technologyKey || 'custom'}
          </p>
          {readOnly ? null : (
            <div className="flex gap-3">
              <button type="button" onClick={onEdit} className="button-secondary px-4 py-2 text-sm">
                Edit
              </button>
              <button type="button" onClick={onDelete} className="button-secondary px-4 py-2 text-sm">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}