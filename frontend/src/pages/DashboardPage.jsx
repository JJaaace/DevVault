import { useAuth, useUser } from '@clerk/clerk-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { authenticatedRequest } from '../lib/api'
import { ProfileCompletionCard } from '../components/ProfileCompletionCard'
import { readStoredProfile, saveStoredProfile } from '../lib/profileStorage'
import { fetchProjects } from '../lib/projectsApi'
import { fetchSkills } from '../lib/skillsApi'
import {
  buildActivitySeries,
  buildCertificationsOverview,
  buildHeroDeadline,
  buildHeroProgress,
  buildHeroQuickActions,
  buildHeroQuickStats,
  buildInternshipTracker,
  buildProjectProgressSummary,
  buildRecentActivity,
  buildSkillOverviewSummary,
  buildUpcomingDeadlines,
  buildWorkspaceStats,
  getTimeGreeting,
} from '../lib/dashboardUtils'
import { ProgressRing } from '../components/dashboard/ProgressRing'
import { WorkspaceHero } from '../components/dashboard/WorkspaceHero'
import { WorkspaceWidget } from '../components/dashboard/WorkspaceWidget'
import { getProjectStatusMeta } from '../lib/projectUtils'
import { fetchWorkspaceResume, fetchWorkspaceResumePdf, uploadWorkspaceResume } from '../lib/resumeWorkspaceApi'
import { readWorkspacePreferences } from '../lib/workspacePreferences'

export function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [insights, setInsights] = useState([])
  const [resume, setResume] = useState(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resolvingResumeAction, setResolvingResumeAction] = useState(false)
  const [showCodingStreak, setShowCodingStreak] = useState(() => readWorkspacePreferences().showCodingStreak !== false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const lastGitHubSyncAtRef = useRef(null)
  const resumeInputRef = useRef(null)

  const refreshWorkspace = useCallback(async () => {
    const cachedProfile = readStoredProfile()

    if (cachedProfile) {
      setProfile(cachedProfile)
      lastGitHubSyncAtRef.current = cachedProfile.githubLastSyncedAt || lastGitHubSyncAtRef.current
      saveStoredProfile(cachedProfile)
    }

    const results = await Promise.allSettled([
      authenticatedRequest('/api/profile', {}, getToken),
      fetchProjects(getToken),
      fetchSkills(getToken),
      authenticatedRequest('/api/dashboard', {}, getToken),
      fetchWorkspaceResume(getToken),
    ])

    const messages = []

    const profileResult = results[0]
    if (profileResult.status === 'fulfilled') {
      const nextProfile = profileResult.value || cachedProfile
      const previousSyncAt = lastGitHubSyncAtRef.current
      const nextSyncAt = nextProfile?.githubLastSyncedAt || null

      setProfile(nextProfile)
      if (nextProfile) {
        saveStoredProfile(nextProfile)
      }

      if (previousSyncAt && nextSyncAt && previousSyncAt !== nextSyncAt) {
        toast.success('GitHub synchronization completed.')
      }

      lastGitHubSyncAtRef.current = nextSyncAt || previousSyncAt || null
    } else if (profileResult.reason?.message?.includes('404')) {
      setProfile(cachedProfile || null)
    } else {
      messages.push(profileResult.reason?.message || 'Unable to load profile.')
    }

    const projectResult = results[1]
    if (projectResult.status === 'fulfilled') {
      setProjects(Array.isArray(projectResult.value) ? projectResult.value : [])
    } else {
      messages.push(projectResult.reason?.message || 'Unable to load projects.')
    }

    const skillResult = results[2]
    if (skillResult.status === 'fulfilled') {
      setSkills(Array.isArray(skillResult.value) ? skillResult.value : [])
    } else {
      messages.push(skillResult.reason?.message || 'Unable to load skills.')
    }

    const insightsResult = results[3]
    if (insightsResult.status === 'fulfilled') {
      setInsights(Array.isArray(insightsResult.value?.insights) ? insightsResult.value.insights : [])
    } else {
      setInsights([])
    }

    const resumeResult = results[4]
    if (resumeResult.status === 'fulfilled') {
      setResume(resumeResult.value || null)
    }

    setError(messages[0] || '')
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    const handlePreferencesChanged = () => {
      setShowCodingStreak(readWorkspacePreferences().showCodingStreak !== false)
    }

    window.addEventListener('devvault:workspace-preferences-changed', handlePreferencesChanged)

    return () => {
      window.removeEventListener('devvault:workspace-preferences-changed', handlePreferencesChanged)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshWorkspace().catch((err) => {
        setError(err.message || 'Unable to load workspace.')
        setLoading(false)
      })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refreshWorkspace])

  const handleResumeUploadClick = () => {
    resumeInputRef.current?.click()
  }

  const handleResumeFileChange = async (event) => {
    const [file] = Array.from(event.target.files || [])
    if (!file) {
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF resume.')
      event.target.value = ''
      return
    }

    setUploadingResume(true)
    try {
      const nextResume = await uploadWorkspaceResume(file, getToken)
      setResume(nextResume)
      toast.success('Resume uploaded successfully.')
    } catch (uploadError) {
      toast.error(uploadError.message || 'Unable to upload resume.')
    } finally {
      setUploadingResume(false)
      event.target.value = ''
    }
  }

  const withResumePdf = async (callback) => {
    setResolvingResumeAction(true)
    try {
      const fileBlob = await fetchWorkspaceResumePdf(getToken)
      const blobUrl = URL.createObjectURL(fileBlob)
      try {
        await callback(blobUrl)
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 8000)
      }
    } catch (error) {
      toast.error(error.message || 'Unable to access resume.')
    } finally {
      setResolvingResumeAction(false)
    }
  }

  const handleViewResume = () => withResumePdf(async (blobUrl) => {
    window.open(blobUrl, '_blank', 'noopener,noreferrer')
  })

  const handleDownloadResume = () => withResumePdf(async (blobUrl) => {
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = resume?.fileName || 'Resume.pdf'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  })

  const hasResume = Boolean(resume?.uploaded)
  const resumeLastUpdated = resume?.lastUpdated
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(resume.lastUpdated))
    : 'N/A'

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshWorkspace().catch(() => {
        // background refresh failures should not interrupt the UI
      })
    }, 180000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [refreshWorkspace])

  const activityEntries = buildRecentActivity(profile, projects, skills)
  const activitySeries = buildActivitySeries(activityEntries)
  const workspaceStats = buildWorkspaceStats(profile, projects, skills, activityEntries)
  const projectSummary = buildProjectProgressSummary(projects)
  const skillSummary = buildSkillOverviewSummary(skills)
  const upcomingDeadlines = buildUpcomingDeadlines(projects)
  const certifications = buildCertificationsOverview()
  const internshipStages = buildInternshipTracker()
  const userName = user?.firstName || profile?.firstName || 'there'
  const greeting = getTimeGreeting()
  const heroDeadline = buildHeroDeadline(projects)
  const heroProgress = buildHeroProgress(profile, projects, skills)
  const heroQuickStats = buildHeroQuickStats(profile, projects, activityEntries)
  const heroQuickActions = buildHeroQuickActions(profile, projects, skills, heroDeadline)

  return (
    <div className="page-shell page-stack gap-4 pb-12">
      <WorkspaceHero
        greeting={greeting}
        userName={userName}
        activitySeries={activitySeries}
        currentStreak={workspaceStats.currentStreak}
        showCodingStreak={showCodingStreak}
        upcomingDeadline={heroDeadline}
        quickStats={heroQuickStats}
        quickActions={heroQuickActions}
        progress={heroProgress}
        syncState={profile?.githubSyncState}
      />

      {error ? (
        <div className="widget-card border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)] p-4 text-sm text-[#a83f1d]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] xl:items-stretch">
        <div className="flex min-w-0 flex-col gap-4 xl:h-full">
          <ProfileCompletionCard
            profile={profile}
            actionTo={profile ? '/profile/edit' : '/profile'}
            actionLabel={profile ? 'Refine profile' : 'Create profile'}
          />

          <WorkspaceWidget
            eyebrow="Projects"
            title="Project statuses"
            description={projects.length ? 'Track lifecycle stages across your portfolio.' : 'Start with one project and this card becomes your launch command center.'}
            action={<Link to="/projects" className="button-secondary px-4 py-2 text-sm">Open projects</Link>}
          >
            {loading ? (
              <div className="text-sm text-[var(--color-text-soft)]">Loading projects...</div>
            ) : projects.length ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ['PLANNING', projectSummary.statusCounts.PLANNING],
                    ['BUILDING', projectSummary.statusCounts.BUILDING],
                    ['COMPLETED', projectSummary.statusCounts.COMPLETED],
                    ['ARCHIVED', projectSummary.statusCounts.ARCHIVED],
                  ].map(([status, count]) => {
                    const meta = getProjectStatusMeta(status)
                    return (
                      <div key={status} className="rounded-[1.2rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`inline-flex ${meta.badgeClass}`}>{meta.label}</span>
                          <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="grid gap-3">
                  {projectSummary.recentProjects.map((project) => {
                    const meta = getProjectStatusMeta(project.status)
                    return (
                      <div key={project.id} className="rounded-[1.2rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-[var(--color-text)]">{project.title}</p>
                            <p className="text-xs text-[var(--color-text-soft)]">Recently updated</p>
                          </div>
                          <span className={`inline-flex ${meta.badgeClass}`}>{meta.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="chip chip--accent">{workspaceStats.projectCount} projects</span>
                  <span className="chip">{projectSummary.activeProjects.length} active</span>
                  <span className="chip">{projectSummary.statusCounts.COMPLETED} completed</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[var(--color-text-soft)]">No projects yet. Create one to start tracking statuses, deadlines, and launch momentum.</p>
                <Link to="/projects/new" className="button-primary w-fit px-4 py-2 text-sm">Create your first project</Link>
              </div>
            )}
          </WorkspaceWidget>

          <WorkspaceWidget
            eyebrow="Skills"
            title="Skills overview"
            description={skills.length ? 'Keep your growth visible through a focused progress view.' : 'Add your first skill to unlock the progress view.'}
            action={<Link to="/skills" className="button-secondary px-4 py-2 text-sm">Open skills</Link>}
          >
            {loading ? (
              <div className="text-sm text-[var(--color-text-soft)]">Loading skills...</div>
            ) : skills.length ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <ProgressRing value={skillSummary.average} label="avg" color="#d96a16" size={108}>
                    <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{skillSummary.average}%</span>
                  </ProgressRing>
                  <div className="flex flex-1 flex-col gap-3">
                    {skillSummary.topSkills.map((skill) => (
                      <div key={skill.id} className="rounded-[1.2rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-[var(--color-text)]">{skill.name}</p>
                            <p className="text-xs text-[var(--color-text-soft)]">{skill.category}</p>
                          </div>
                          <span className="text-sm font-semibold text-[var(--color-brand-ink)]">{skill.percentage}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.1)]">
                          <div className="h-full rounded-full" style={{ width: `${skill.percentage}%`, background: skill.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="chip chip--accent">{workspaceStats.skillCount} skills</span>
                  {skillSummary.categories.slice(0, 3).map((category) => (
                    <span key={category} className="chip">{category}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[var(--color-text-soft)]">Add your first skill to start seeing health-style progress tracking.</p>
                <Link to="/skills" className="button-primary w-fit px-4 py-2 text-sm">Add your first skill</Link>
              </div>
            )}
          </WorkspaceWidget>

          <WorkspaceWidget
            eyebrow="Activity"
            title="Recent activity"
            description="A lightweight feed of the most recent workspace changes."
            action={<Link to="/projects" className="button-secondary px-4 py-2 text-sm">View source items</Link>}
          >
            {activityEntries.length ? (
              <div className="space-y-3">
                {activityEntries.map((entry) => (
                  <div key={`${entry.type}-${entry.label}-${entry.date.toISOString()}`} className="flex gap-3 rounded-[1.15rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[linear-gradient(135deg,#f9c96e,#ea8b21,#d96a16)] shadow-[0_0_0_4px_rgba(234,139,33,0.08)]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[var(--color-text)]">{entry.label}</p>
                          <p className="text-sm text-[var(--color-text-soft)]">{entry.description}</p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-[var(--color-text-muted)]">
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(entry.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-soft)]">No activity yet. Create or update a profile, project, or skill to start the feed.</p>
            )}
          </WorkspaceWidget>
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:h-full">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 xl:flex-1 xl:grid-rows-[auto_auto_auto_1fr]">
            <WorkspaceWidget
              eyebrow="Intelligence"
              title="Actionable insights"
              description="Prioritized recommendations generated from your current workspace data."
            >
              {insights.length ? (
                <div className="space-y-3">
                  {insights.slice(0, 4).map((insight) => (
                    <div key={insight.id} className="rounded-[1.2rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-[var(--color-text)]">{insight.title}</p>
                        <span className={`chip ${insight.priority === 'high' ? 'chip--accent' : ''}`.trim()}>{insight.priority}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-text-soft)]">{insight.description}</p>
                      {insight.cta?.href ? (
                        <Link to={insight.cta.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--color-brand-ink)]">
                          {insight.cta.label || 'Open'}
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-soft)]">No insights yet. Add profile, projects, and skills to unlock recommendations.</p>
              )}
            </WorkspaceWidget>

            <WorkspaceWidget
              eyebrow="Career"
              title="Certifications"
              description="Keep badges, renewals, and credentials ready for recruiter review."
            >
              <div className="certifications-grid">
                {certifications.map((item) => (
                  <div key={item.name} className="certification-card">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{item.name}</p>
                        <p className="text-xs text-[var(--color-text-soft)]">{item.organization}</p>
                        {item.earnedDate ? (
                          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                            Earned {new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(item.earnedDate))}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-2xl" aria-hidden="true">{item.logo || '🏅'}</span>
                    </div>
                    <div className="mt-4">
                      <span className={`certification-status ${item.status === 'EARNED' ? 'certification-status--earned' : item.status === 'IN_PROGRESS' ? 'certification-status--in-progress' : 'certification-status--planned'}`.trim()}>
                        {item.status === 'EARNED' ? '✓ Earned' : item.status === 'IN_PROGRESS' ? '📖 In Progress' : '🎯 Planned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </WorkspaceWidget>

            <WorkspaceWidget
              eyebrow="Career"
              title="Resume"
              description="Manage your active recruiter-facing resume without leaving the workspace."
            >
              <div className="rounded-[1.2rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-4">
                <p className="text-sm font-medium text-[var(--color-text)]">{hasResume ? (resume.fileName || 'Resume.pdf') : 'No resume uploaded.'}</p>
                <p className="mt-1 text-xs text-[var(--color-text-soft)]">Last updated {resumeLastUpdated}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={handleResumeUploadClick} disabled={uploadingResume} className="button-primary px-3 py-2 text-xs disabled:opacity-60">
                    {uploadingResume ? 'Uploading...' : hasResume ? 'Replace Resume' : 'Upload Resume'}
                  </button>
                  {hasResume ? (
                    <>
                      <button type="button" onClick={handleViewResume} disabled={resolvingResumeAction} className="button-secondary px-3 py-2 text-xs disabled:opacity-60">
                        View Resume
                      </button>
                      <button type="button" onClick={handleDownloadResume} disabled={resolvingResumeAction} className="button-secondary px-3 py-2 text-xs disabled:opacity-60">
                        Download Resume
                      </button>
                    </>
                  ) : null}
                  <Link to="/resume-workspace" className="button-secondary px-3 py-2 text-xs">Open Resume Page</Link>
                </div>

                <input ref={resumeInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleResumeFileChange} />
              </div>
            </WorkspaceWidget>

            <WorkspaceWidget
              eyebrow="Career"
              title="Internship tracker"
              description="A clean pipeline for application flow and momentum."
              className="xl:h-full"
            >
              <div className="space-y-4">
                {internshipStages.map((stage, index) => (
                  <div key={stage.stage} className="rounded-[1.2rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{stage.stage}</p>
                        <p className="text-xs text-[var(--color-text-soft)]">{stage.description}</p>
                      </div>
                      <span className={`chip ${index === 1 ? 'chip--accent' : ''}`.trim()}>{stage.count}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.1)]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#f9c96e] via-[#ea8b21] to-[#d96a16]" style={{ width: `${Math.max(20, stage.count * 20)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </WorkspaceWidget>
          </div>

          <WorkspaceWidget
            eyebrow="Planning"
            title="Upcoming deadlines"
            description="Keep the next target date visible so projects keep moving."
          >
            {upcomingDeadlines.length ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((project) => (
                  <div key={project.id} className="rounded-[1.2rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{project.title}</p>
                        <p className="text-xs text-[var(--color-text-soft)]">Target {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(project.deadline)}</p>
                      </div>
                      <span className={`inline-flex ${getProjectStatusMeta(project.status).badgeClass}`}>{getProjectStatusMeta(project.status).label}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[var(--color-text-soft)]">No target dates yet. Use the deadline card above to set a due date and populate this planning lane.</p>
              </div>
            )}
          </WorkspaceWidget>
        </div>
      </div>
    </div>
  )
}
