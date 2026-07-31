import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardCard } from '../components/DashboardCard'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectsEmptyState } from '../components/ProjectsEmptyState'
import { fetchProjects } from '../lib/projectsApi'
import { authenticatedRequest } from '../lib/api'
import { createProject } from '../lib/projectsApi'
import { buildGitHubProjectDrafts, extractGitHubUsername, fetchGitHubRepos } from '../lib/githubApi'

export function ProjectsPage() {
  const { getToken } = useAuth()
  const [projects, setProjects] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncingGitHub, setSyncingGitHub] = useState(false)

  useEffect(() => {
    async function loadProjects() {
      const [projectData, profileData] = await Promise.allSettled([
        fetchProjects(getToken),
        authenticatedRequest('/api/profile', {}, getToken),
      ])

      const messages = []

      if (projectData.status === 'fulfilled') {
        setProjects(Array.isArray(projectData.value) ? projectData.value : [])
      } else {
        messages.push(projectData.reason?.message || 'Unable to load projects.')
      }

      if (profileData.status === 'fulfilled') {
        setProfile(profileData.value || null)
      } else {
        messages.push(profileData.reason?.message || 'Unable to load profile.')
      }

      setError(messages[0] || '')
      setLoading(false)
    }

    loadProjects().catch((err) => {
      setError(err.message || 'Unable to load projects.')
      setLoading(false)
    })
  }, [getToken])

  const githubUsername = extractGitHubUsername(profile?.githubUrl)

  const handleSyncFromGitHub = async () => {
    if (!githubUsername) {
      toast.error('Add your GitHub URL to your profile first.')
      return
    }

    setSyncingGitHub(true)
    const loadingToast = toast.loading('Importing GitHub repositories...')

    try {
      const repos = await fetchGitHubRepos(githubUsername)
      const drafts = buildGitHubProjectDrafts(repos).slice(0, 6)
      const existingUrls = new Set(projects.map((project) => project.githubUrl).filter(Boolean))
      const newDrafts = drafts.filter((draft) => !existingUrls.has(draft.githubUrl))

      for (const draft of newDrafts) {
        await createProject(draft, getToken)
      }

      const refreshedProjects = await fetchProjects(getToken)
      setProjects(Array.isArray(refreshedProjects) ? refreshedProjects : [])
      toast.success(newDrafts.length ? `Imported ${newDrafts.length} GitHub repo${newDrafts.length === 1 ? '' : 's'}.` : 'No new GitHub repos to import.', { id: loadingToast })
    } catch (err) {
      toast.error(err.message || 'Unable to sync GitHub repos.', { id: loadingToast })
    } finally {
      setSyncingGitHub(false)
    }
  }

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
          <div className="flex flex-wrap gap-3">
            <Link to="/projects/new" className="button-primary px-5 py-3 text-sm md:text-base">
              New Project
            </Link>
            <button
              type="button"
              onClick={handleSyncFromGitHub}
              disabled={syncingGitHub || !githubUsername}
              className="button-secondary px-5 py-3 text-sm md:text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncingGitHub ? 'Syncing GitHub...' : 'Sync GitHub repos'}
            </button>
          </div>
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