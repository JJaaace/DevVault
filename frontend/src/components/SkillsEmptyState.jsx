import { SkillGhostCard } from './SkillGhostCard'

const exampleSkills = [
  {
    name: 'React',
    technologyKey: 'react',
    category: 'Frontend',
    experienceLevel: 'INTERMEDIATE',
    yearsExperience: 2,
    firstUsedYear: 2024,
    projectsBuilt: 3,
    color: '#ea8b21',
    notes: 'Building polished, recruiter-ready interfaces with reusable components.',
    relatedProjects: ['Portfolio Dashboard', 'DevVault'],
  },
  {
    name: 'Prisma',
    technologyKey: 'postgres',
    category: 'Backend',
    experienceLevel: 'ADVANCED',
    yearsExperience: 3,
    firstUsedYear: 2023,
    projectsBuilt: 5,
    color: '#d96a16',
    notes: 'Modeling data cleanly and keeping feature logic aligned with the database.',
    relatedProjects: ['Projects API', 'Profile System'],
  },
  {
    name: 'Python',
    technologyKey: 'python',
    category: 'Automation',
    experienceLevel: 'ADVANCED_BEGINNER',
    yearsExperience: 3,
    firstUsedYear: 2023,
    projectsBuilt: 4,
    color: '#f0a44d',
    notes: 'Automating portfolio workflows and building interview-ready tooling.',
    relatedProjects: ['Password Analyzer', 'Cloud Budget Tracker'],
  },
]

export function SkillsEmptyState({ onCreate }) {
  return (
    <div className="surface-card surface-card--strong px-6 py-10 md:px-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="text-center lg:text-left">
          <div className="mx-auto flex h-56 w-full max-w-xl items-center justify-center overflow-hidden rounded-[1.75rem] border border-[rgba(214,160,89,0.2)] bg-[linear-gradient(180deg,rgba(50,36,26,0.92),rgba(35,26,20,0.9))] shadow-[0_20px_50px_rgba(18,12,8,0.3)] lg:mx-0">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f9c96e,#ea8b21,#d96a16)] text-4xl text-[var(--color-brand-ink)] shadow-[0_18px_40px_rgba(234,139,33,0.28)]">
              ◔
            </div>
          </div>

          <h3 className="mt-8 text-3xl font-semibold tracking-tight text-[var(--color-text)] md:text-4xl">
            Build a real experience portfolio.
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-soft)] lg:mx-0">
            Track each technology with years, first-used timeline, and project count. This gives recruiters accurate skill context without misleading percentage bars.
          </p>
          <div className="mt-6 flex justify-center lg:justify-start">
            <button type="button" onClick={onCreate} className="button-primary px-6 py-3 text-sm md:px-7 md:py-3.5 md:text-base">
              Create Your First Skill
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {exampleSkills.map((skill, index) => (
            <div key={skill.name} className={`fade-in-up stagger-${index + 1}`}>
              <SkillGhostCard skill={skill} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}