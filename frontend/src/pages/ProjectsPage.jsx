import { useAuth } from '@clerk/clerk-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DashboardCard } from '../components/DashboardCard'
import { GitHubSyncStatusCard } from '../components/GitHubSyncStatusCard'
import { ProjectsGalleryCard } from '../components/projects/ProjectsGalleryCard'
import { ProjectsEmptyState } from '../components/ProjectsEmptyState'
import { fetchProjects } from '../lib/projectsApi'
import { authenticatedRequest } from '../lib/api'
import { fetchGitHubSyncStatus, startGitHubSync } from '../lib/githubSyncApi'
import { decorateProjectShowcase } from '../lib/projectShowcaseCatalog'

export function ProjectsPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [projects, setProjects] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncState, setSyncState] = useState(null)
  const [galleryVisible, setGalleryVisible] = useState(false)
  const galleryRef = useRef(null)
  const syncJobId = syncState?.syncId
  const syncJobStatus = syncState?.status

  useEffect(() => {
    if (!syncJobId || (syncJobStatus !== 'queued' && syncJobStatus !== 'running')) {
      return undefined
    }

    let cancelled = false
    let timeoutId = null

    const pollSyncStatus = async () => {
      try {
        const nextState = await fetchGitHubSyncStatus(syncJobId, getToken)
        if (cancelled) {
          return
        }

        setSyncState(nextState)

        if (nextState.status === 'completed') {
          if (nextState.result?.profile) {
            setProfile(nextState.result.profile)
          }

          const refreshedProjects = await fetchProjects(getToken)
          setProjects(Array.isArray(refreshedProjects) ? refreshedProjects : [])

          if (nextState.errors?.length) {
            toast.warning(nextState.message || 'GitHub sync completed with warnings.')
          } else {
            toast.success(nextState.message || 'GitHub sync completed.')
          }
          return
        }

        if (nextState.status === 'failed') {
          toast.error(nextState.message || 'Unable to sync GitHub repos.')
          return
        }

        timeoutId = window.setTimeout(pollSyncStatus, 1500)
      } catch (err) {
        if (cancelled) {
          return
        }

        const message = err.message || 'Unable to load GitHub sync status.'
        setSyncState((current) => ({
          ...(current || { syncId: syncJobId }),
          status: 'failed',
          message,
          error: message,
          errors: [message],
          progress: current?.progress || 0,
          completedAt: new Date().toISOString(),
        }))
        toast.error(message)
      }
    }

    timeoutId = window.setTimeout(pollSyncStatus, 1500)

    return () => {
      cancelled = true
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [getToken, syncJobId, syncJobStatus])

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

  const hasGitHubUrl = Boolean(profile?.githubUrl)
  const orderedProjects = useMemo(() => [...projects].sort((left, right) => {
    const leftOrder = Number.isInteger(left.displayOrder) ? left.displayOrder : Number.MAX_SAFE_INTEGER
    const rightOrder = Number.isInteger(right.displayOrder) ? right.displayOrder : Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt)
  }), [projects])

  const showcaseProjects = useMemo(
    () => orderedProjects.map((project, index) => decorateProjectShowcase(project, index)),
    [orderedProjects],
  )

  useEffect(() => {
    if (!showcaseProjects.length || galleryVisible || !galleryRef.current) {
      return
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          setGalleryVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(galleryRef.current)

    return () => {
      observer.disconnect()
    }
  }, [showcaseProjects.length, galleryVisible])

  const handleSyncFromGitHub = async () => {
    if (!hasGitHubUrl) {
      toast.error('Add your GitHub URL to your profile first.')
      return
    }

    if (!isLoaded || !isSignedIn) {
      toast.error('Sign in to synchronize GitHub repos.')
      return
    }

    const loadingToast = toast.loading('Starting GitHub synchronization...')

    try {
      const job = await startGitHubSync(getToken)
      setSyncState(job)
      toast.success('GitHub synchronization started.', { id: loadingToast })
    } catch (err) {
      const message = err.status === 401 || err.status === 403
        ? 'Sign in again to sync GitHub repos.'
        : err.message || 'Unable to sync GitHub repos.'
      toast.error(message, { id: loadingToast })
      setSyncState({
        syncId: null,
        status: 'failed',
        progress: 0,
        step: 'GitHub sync failed',
        message,
        errors: [message],
      })
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
              disabled={syncState?.status === 'queued' || syncState?.status === 'running' || !hasGitHubUrl || !isLoaded || !isSignedIn}
              className="button-secondary px-5 py-3 text-sm md:text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncState?.status === 'queued' || syncState?.status === 'running' ? 'Syncing GitHub...' : 'Sync GitHub repos'}
            </button>
          </div>
        </div>

        {profile?.githubLastSyncedAt ? <p className="mt-4 text-sm text-[var(--color-text-soft)]">Last GitHub sync: {new Date(profile.githubLastSyncedAt).toLocaleString()}</p> : null}

      </section>

      <GitHubSyncStatusCard syncState={syncState} />

      {error ? (
        <div className="widget-card border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)] p-4 text-sm text-[#a83f1d]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">Loading projects...</div>
      ) : showcaseProjects.length ? (
        <div
          ref={galleryRef}
          className={`projects-gallery-grid ${galleryVisible ? 'projects-gallery-grid--visible' : ''}`.trim()}
        >
          {showcaseProjects.map((project, index) => (
            <div
              key={project.id}
              className="projects-gallery-item"
              style={{ '--enter-delay': `${Math.min(index, 8) * 95}ms` }}
            >
              <ProjectsGalleryCard
                project={project}
                index={index}
              />
            </div>
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