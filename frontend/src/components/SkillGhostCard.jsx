import { TechnologyLogo } from './TechnologyLogo'
import { formatYearsExperience } from '../lib/skillUtils'

export function SkillGhostCard({ skill }) {
  return (
    <article className="widget-card overflow-hidden border-dashed border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.78)] p-5 opacity-80 transition duration-300 hover:-translate-y-1 hover:bg-[rgba(57,41,29,0.9)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <TechnologyLogo technologyKey={skill.technologyKey} name={skill.name} />
        <div className="flex-1">
          <p className="section-eyebrow">{skill.category}</p>
          <h4 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">{skill.name}</h4>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {formatYearsExperience(skill.yearsExperience)} • first used {skill.firstUsedYear}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-text-soft)]">{skill.notes}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(skill.relatedProjects || []).map((project) => (
              <span key={project} className="chip chip--accent">{project}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}