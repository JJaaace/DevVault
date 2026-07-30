import { SkillProgressRing } from './SkillProgressRing'
import { formatSkillRelativeDate, getSkillLevelMeta } from '../lib/skillUtils'

function RelatedProjectChip({ project }) {
  return <span className="chip chip--accent">{project.title}</span>
}

export function SkillCard({ skill, onEdit, onDelete }) {
  const levelMeta = getSkillLevelMeta(skill.experienceLevel)
  const relatedProjects = skill.relatedProjects || []

  return (
    <article className="widget-card overflow-hidden hover-lift">
      <div className="h-1 w-full" style={{ background: skill.color }} />
      <div className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <SkillProgressRing percentage={skill.percentage} color={skill.color} label={levelMeta.label} />
            <div>
              <p className="section-eyebrow">{skill.category}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{skill.name}</h3>
              <p className={`mt-2 text-sm font-medium ${levelMeta.toneClass}`}>{levelMeta.label}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">{skill.notes || 'No notes yet. Use this space to capture what you learned or where you are focusing next.'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span className="chip chip--accent">{skill.percentage}%</span>
            <span className="chip">{formatSkillRelativeDate(skill.lastUsed)}</span>
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
            Color {skill.color.toUpperCase()}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onEdit} className="button-secondary px-4 py-2 text-sm">
              Edit
            </button>
            <button type="button" onClick={onDelete} className="button-secondary px-4 py-2 text-sm">
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}