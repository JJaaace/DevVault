import { useAuth } from '@clerk/clerk-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { GitHubSyncStatusCard } from '../components/GitHubSyncStatusCard'
import { ProjectsGalleryCard } from '../components/projects/ProjectsGalleryCard'
import { ProjectsEmptyState } from '../components/ProjectsEmptyState'
import { fetchProjects } from '../lib/projectsApi'
import { authenticatedRequest } from '../lib/api'
import { fetchGitHubSyncStatus, startGitHubSync } from '../lib/githubSyncApi'
import { decorateProjectShowcase } from '../lib/projectShowcaseCatalog'
import { useGuestMode } from '../context/GuestModeContext'

const LAST_PROJECT_SYNC_CACHE_KEY = 'devvault:last-github-project-sync'

function readLastProjectSync() {
  if (typeof window === 'undefined') return null
  try {
    const cached = JSON.parse(window.localStorage.getItem(LAST_PROJECT_SYNC_CACHE_KEY) || 'null')
    return cached?.status === 'completed' ? cached : null
  } catch {
    return null
  }
}

function ProjectsPageContent({ auth }) {
  const { getToken, isLoaded, isSignedIn } = auth
  const { isGuestMode, portfolio } = useGuestMode()
  const [projects, setProjects] = useState(() => isGuestMode ? portfolio.projects || [] : [])
  const [profile, setProfile] = useState(() => isGuestMode ? portfolio.profile : null)
  const [loading, setLoading] = useState(!isGuestMode)
  const [error, setError] = useState('')
  const [syncState, setSyncState] = useState(() => isGuestMode ? null : readLastProjectSync())
  const [galleryVisible, setGalleryVisible] = useState(false)
  const galleryRef = useRef(null)
  const syncJobId = syncState?.syncId
  const syncJobStatus = syncState?.status

  useEffect(() => {
    if (isGuestMode) return undefined
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
          try {
            window.localStorage.setItem(LAST_PROJECT_SYNC_CACHE_KEY, JSON.stringify(nextState))
          } catch {
            // The completed result still remains visible for this session.
          }
          const refreshedProjects = await fetchProjects(getToken)
          setProjects(Array.isArray(refreshedProjects) ? refreshedProjects : [])

          if (nextState.errors?.length) {
            toast.warning(nextState.message || 'GitHub project sync completed with warnings.')
          } else {
            toast.success(nextState.message || 'GitHub project sync completed.')
          }
          return
        }

        if (nextState.status === 'failed') {
          toast.error(nextState.message || 'Unable to sync GitHub projects.')
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
  }, [getToken, isGuestMode, syncJobId, syncJobStatus])

  useEffect(() => {
    if (isGuestMode) return
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
  }, [getToken, isGuestMode])

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

    const loadingToast = toast.loading('Starting project-only GitHub sync...')

    try {
      const job = await startGitHubSync(getToken)
      setSyncState(job)
      toast.success('GitHub project sync started.', { id: loadingToast })
    } catch (err) {
      const message = err.status === 401 || err.status === 403
        ? 'Sign in again to sync GitHub projects.'
        : err.message || 'Unable to sync GitHub projects.'
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
      <section id="github-sync" className="surface-card surface-card--hero scroll-mt-28 px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Projects</p>
            <h2 className="section-title mt-3 text-4xl md:text-5xl">Build, launch, and track every project in one polished space.</h2>
            <p className="section-copy mt-4 max-w-2xl text-sm leading-7 md:text-base">
              Keep your work ready for recruiters with clean status tracking, design-forward cards, and a single source of truth for every launch.
            </p>
          </div>
          {!isGuestMode ? <div className="flex flex-wrap gap-3">
            <Link to="/projects/new" className="button-primary px-5 py-3 text-sm md:text-base">
              New Project
            </Link>
            <button
              type="button"
              onClick={handleSyncFromGitHub}
              disabled={syncState?.status === 'queued' || syncState?.status === 'running' || !hasGitHubUrl || !isLoaded || !isSignedIn}
              className="button-secondary px-5 py-3 text-sm md:text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncState?.status === 'queued' || syncState?.status === 'running' ? 'Syncing projects...' : 'Sync GitHub Projects'}
            </button>
          </div> : <span className="guest-read-only-badge">Guest view · Read only</span>}
        </div>

        {!isGuestMode ? <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">Project-only safety: refreshes linked repository metadata. It never changes your profile, skills, certifications, goals, resume, project descriptions, artwork, status, ordering, technology stack, or demo links. New repositories stay available for review and are not auto-added.</p> : null}

      </section>

      {!isGuestMode ? <GitHubSyncStatusCard syncState={syncState} /> : null}

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
                readOnly={isGuestMode}
              />
            </div>
          ))}
        </div>
      ) : (
        <ProjectsEmptyState />
      )}

    </div>
  )
}

function AuthenticatedProjectsPage() {
  return <ProjectsPageContent auth={useAuth()} />
}

export function ProjectsPage() {
  const { isGuestMode } = useGuestMode()
  return isGuestMode
    ? <ProjectsPageContent auth={{ getToken: async () => '', isLoaded: true, isSignedIn: false }} />
    : <AuthenticatedProjectsPage />
}
