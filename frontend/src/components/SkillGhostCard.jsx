import { SkillProgressRing } from './SkillProgressRing'

export function SkillGhostCard({ skill }) {
  return (
    <article className="widget-card overflow-hidden border-dashed border-[rgba(126,89,45,0.16)] bg-[rgba(255,253,249,0.72)] p-5 opacity-80 transition duration-300 hover:-translate-y-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <SkillProgressRing percentage={skill.percentage} color={skill.color} label={skill.experienceLevel} />
        <div className="flex-1">
          <p className="section-eyebrow">{skill.category}</p>
          <h4 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">{skill.name}</h4>
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