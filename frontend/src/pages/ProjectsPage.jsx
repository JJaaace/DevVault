import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCard } from '../components/DashboardCard'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectsEmptyState } from '../components/ProjectsEmptyState'
import { fetchProjects } from '../lib/projectsApi'

export function ProjectsPage() {
  const { getToken } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchProjects(getToken)
        setProjects(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Unable to load projects.')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [getToken])

  return (
    <div className="page-shell page-shell--wide page-stack pb-14">
      <section className="surface-card surface-card--hero px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Projects</p>
            <h2 className="section-title mt-3 text-4xl md:text-5xl">Build, launch, and track every project in one polished space.</h2>
            <p className="section-copy mt-4 max-w-2xl text-sm leading-7 md:text-base">
              Keep your work ready for recruiters with clean status tracking, design-forward cards, and a single source of truth for every launch.
            </p>
          </div>
          <Link to="/projects/new" className="button-primary px-5 py-3 text-sm md:text-base">
            New Project
          </Link>
        </div>
      </section>

      {error ? (
        <div className="widget-card border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)] p-4 text-sm text-[#a83f1d]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">Loading projects...</div>
      ) : projects.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <ProjectsEmptyState />
      )}

      <DashboardCard title="What to add next" description="Use these sections to make the Projects workspace feel complete.">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <span className="chip chip--accent">Roadmap milestones</span>
          <span className="chip">Feature flags</span>
          <span className="chip">Demo walkthroughs</span>
          <span className="chip">Launch notes</span>
        </div>
      </DashboardCard>
    </div>
  )
}