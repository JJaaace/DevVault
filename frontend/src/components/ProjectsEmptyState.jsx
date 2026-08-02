import { Link } from 'react-router-dom'
import { ProjectGhostCard } from './ProjectGhostCard'

const exampleProjects = [
  {
    title: 'LaunchPad',
    description: 'A portfolio dashboard for keeping project launches organized and investor-ready.',
    status: 'BUILDING',
    techStack: ['React', 'Node.js', 'Prisma'],
  },
  {
    title: 'SkillSprint',
    description: 'A certification tracker that maps skills to learning milestones and proof of work.',
    status: 'PLANNING',
    techStack: ['Tailwind CSS', 'Clerk', 'PostgreSQL'],
  },
  {
    title: 'InternPath',
    description: 'A polished internship tracker for applications, timelines, and interview outcomes.',
    status: 'COMPLETED',
    techStack: ['TypeScript', 'Express', 'React Router'],
  },
]

function EmptyIllustration() {
  return (
    <div className="relative mx-auto flex h-56 w-full max-w-xl items-center justify-center overflow-hidden rounded-[1.75rem] border border-[rgba(126,89,45,0.12)] bg-[linear-gradient(180deg,rgba(255,251,245,0.95),rgba(247,238,227,0.95))]">
      <div className="absolute left-6 top-8 h-24 w-24 rounded-full bg-[rgba(249,201,110,0.35)] blur-2xl" />
      <div className="absolute right-8 top-12 h-28 w-28 rounded-full bg-[rgba(234,139,33,0.22)] blur-2xl" />
      <div className="absolute bottom-8 left-10 h-20 w-40 rounded-[1.25rem] border border-[rgba(214,160,89,0.24)] bg-[rgba(46,35,26,0.84)] shadow-[0_16px_40px_rgba(18,12,8,0.32)]" />
      <div className="absolute right-12 bottom-10 h-28 w-44 rounded-[1.35rem] border border-[rgba(214,160,89,0.24)] bg-[rgba(52,38,27,0.86)] shadow-[0_20px_50px_rgba(18,12,8,0.36)]" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-[linear-gradient(135deg,#f9c96e,#ea8b21,#d96a16)] text-3xl shadow-[0_18px_40px_rgba(234,139,33,0.28)]">
          ✦
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-brand-ink)]">Projects space</p>
      </div>
    </div>
  )
}

export function ProjectsEmptyState() {
  return (
    <div className="surface-card surface-card--strong px-6 py-10 md:px-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="text-center lg:text-left">
          <div className="mx-auto w-full max-w-xl lg:mx-0">
            <EmptyIllustration />
          </div>
          <h3 className="mt-8 text-3xl font-semibold tracking-tight text-[var(--color-text)] md:text-4xl">Your project portfolio starts here.</h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-soft)] lg:mx-0">
            Projects help you show recruiters what you are building, how you think, and the current lifecycle stage of each launch.
            Add one polished project and this space will start feeling like a real product dashboard.
          </p>
          <div className="mt-7 flex justify-center lg:justify-start">
            <Link to="/projects/new" className="button-primary px-6 py-3 text-sm md:px-7 md:py-3.5 md:text-base">
              Create Your First Project
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4">
            {exampleProjects.map((project, index) => (
              <div key={project.title} className={`fade-in-up stagger-${index + 1}`}>
                <ProjectGhostCard project={project} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}