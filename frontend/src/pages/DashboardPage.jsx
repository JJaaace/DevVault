import { useAuth, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authenticatedRequest } from '../lib/api'
import { ProfileCompletionCard } from '../components/ProfileCompletionCard'
import { readStoredProfile, saveStoredProfile } from '../lib/profileStorage'
import { fetchProjects } from '../lib/projectsApi'
import { fetchSkills } from '../lib/skillsApi'
import {
  buildActivitySeries,
  buildCertificationsOverview,
  buildHeroDeadline,
  buildHeroFocus,
  buildHeroProgress,
  buildHeroQuickActions,
  buildHeroQuickStats,
  buildInternshipTracker,
  buildLearningGoals,
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

export function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadWorkspace() {
      const cachedProfile = readStoredProfile()

      if (cachedProfile) {
        setProfile(cachedProfile)
        saveStoredProfile(cachedProfile)
      }

      const results = await Promise.allSettled([
        authenticatedRequest('/api/profile', {}, getToken),
        fetchProjects(getToken),
        fetchSkills(getToken),
      ])

      const messages = []

      const profileResult = results[0]
      if (profileResult.status === 'fulfilled') {
        const nextProfile = profileResult.value || cachedProfile
        setProfile(nextProfile)
        if (nextProfile) {
          saveStoredProfile(nextProfile)
        }
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

      setError(messages[0] || '')
      setLoading(false)
    }

    loadWorkspace().catch((err) => {
      setError(err.message || 'Unable to load workspace.')
      setLoading(false)
    })
  }, [getToken])

  const activityEntries = buildRecentActivity(profile, projects, skills)
  const activitySeries = buildActivitySeries(activityEntries)
  const workspaceStats = buildWorkspaceStats(profile, projects, skills, activityEntries)
  const projectSummary = buildProjectProgressSummary(projects)
  const skillSummary = buildSkillOverviewSummary(skills)
  const learningGoals = buildLearningGoals(profile, projects, skills)
  const upcomingDeadlines = buildUpcomingDeadlines(projects)
  const certifications = buildCertificationsOverview()
  const internshipStages = buildInternshipTracker()
  const userName = user?.firstName || profile?.firstName || 'there'
  const greeting = getTimeGreeting()
  const heroFocus = buildHeroFocus(profile, projects, skills)
  const heroDeadline = buildHeroDeadline(projects)
  const heroProgress = buildHeroProgress(profile, projects, skills)
  const heroQuickStats = buildHeroQuickStats(profile, projects, skills, activityEntries)
  const heroQuickActions = buildHeroQuickActions(profile, projects, skills, heroDeadline)

  return (
    <div className="page-shell page-stack pb-14">
      <WorkspaceHero
        greeting={greeting}
        userName={userName}
        activitySeries={activitySeries}
        currentStreak={workspaceStats.currentStreak}
        currentFocus={heroFocus}
        upcomingDeadline={heroDeadline}
        quickStats={heroQuickStats}
        quickActions={heroQuickActions}
        progress={heroProgress}
      />

      {error ? (
        <div className="widget-card border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)] p-4 text-sm text-[#a83f1d]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <ProfileCompletionCard
            profile={profile}
            actionTo={profile ? '/profile/edit' : '/profile'}
            actionLabel={profile ? 'Refine profile' : 'Create profile'}
          />
        </div>

        <div className="xl:col-span-8">
          <WorkspaceWidget
            eyebrow="Projects"
            title="Projects progress"
            description={projects.length ? 'Track momentum across your live project portfolio.' : 'Start with one project and this card becomes your launch command center.'}
            action={<Link to="/projects" className="button-secondary px-4 py-2 text-sm">Open projects</Link>}
          >
            {loading ? (
              <div className="text-sm text-[var(--color-text-soft)]">Loading projects...</div>
            ) : projects.length ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <ProgressRing value={projectSummary.average} label="avg" color="#ea8b21" size={128}>
                    <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{projectSummary.average}%</span>
                  </ProgressRing>
                  <div className="grid flex-1 gap-3">
                    {projectSummary.topProjects.map((project) => (
                      <div key={project.id} className="rounded-[1.2rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-[var(--color-text)]">{project.title}</p>
                            <p className="text-xs text-[var(--color-text-soft)]">{project.status.replace('_', ' ')}</p>
                          </div>
                          <span className="text-sm font-semibold text-[var(--color-brand-ink)]">{project.completionPercentage}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.1)]">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#f9c96e] via-[#ea8b21] to-[#d96a16]" style={{ width: `${project.completionPercentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="chip chip--accent">{workspaceStats.projectCount} projects</span>
                  <span className="chip">{projectSummary.activeProjects.length} active</span>
                  <span className="chip">{projects.filter((project) => project.status === 'COMPLETED').length} completed</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[var(--color-text-soft)]">No projects yet. Create one to start tracking progress, deadlines, and launch momentum.</p>
                <Link to="/projects/new" className="button-primary w-fit px-4 py-2 text-sm">Create your first project</Link>
              </div>
            )}
          </WorkspaceWidget>
        </div>

        <div className="xl:col-span-6">
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
                  <ProgressRing value={skillSummary.average} label="avg" color="#d96a16" size={120}>
                    <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{skillSummary.average}%</span>
                  </ProgressRing>
                  <div className="flex flex-1 flex-col gap-3">
                    {skillSummary.topSkills.map((skill) => (
                      <div key={skill.id} className="rounded-[1.2rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
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
        </div>

        <div className="xl:col-span-6">
          <WorkspaceWidget
            eyebrow="Career"
            title="Certifications"
            description="Keep badges, renewals, and credentials ready for recruiter review."
          >
            <div className="space-y-4">
              {certifications.map((item) => (
                <div key={item.name} className="rounded-[1.2rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-soft)]">{item.note}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-brand-ink)]">{item.progress}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.1)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#f9c96e] via-[#ea8b21] to-[#d96a16]" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </WorkspaceWidget>
        </div>

        <div className="xl:col-span-6">
          <WorkspaceWidget
            eyebrow="Career"
            title="Internship tracker"
            description="A clean pipeline for application flow and momentum."
          >
            <div className="space-y-4">
              {internshipStages.map((stage, index) => (
                <div key={stage.stage} className="rounded-[1.2rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
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

        <div className="xl:col-span-7">
          <WorkspaceWidget
            eyebrow="Activity"
            title="Recent activity"
            description="A lightweight feed of the most recent workspace changes."
            action={<Link to="/projects" className="button-secondary px-4 py-2 text-sm">View source items</Link>}
          >
            {activityEntries.length ? (
              <div className="space-y-3">
                {activityEntries.map((entry) => (
                  <div key={`${entry.type}-${entry.label}-${entry.date.toISOString()}`} className="flex gap-3 rounded-[1.15rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
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

        <div className="xl:col-span-5">
          <WorkspaceWidget
            eyebrow="Focus"
            title="Learning goals"
            description="A simple, motivating view of where to put energy next."
          >
            <div className="space-y-4">
              {learningGoals.map((goal) => (
                <div key={goal.title} className="rounded-[1.2rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{goal.title}</p>
                      <p className="text-xs text-[var(--color-text-soft)]">{goal.note}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-brand-ink)]">{goal.progress}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.1)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#f9c96e] via-[#ea8b21] to-[#d96a16]" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </WorkspaceWidget>
        </div>

        <div className="xl:col-span-6">
          <WorkspaceWidget
            eyebrow="Planning"
            title="Upcoming deadlines"
            description="Keep the next target date visible so projects keep moving."
          >
            {upcomingDeadlines.length ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((project) => (
                  <div key={project.id} className="rounded-[1.2rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{project.title}</p>
                        <p className="text-xs text-[var(--color-text-soft)]">Target {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(project.deadline)}</p>
                      </div>
                      <span className="chip chip--accent">{project.completionPercentage}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.1)]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#f9c96e] via-[#ea8b21] to-[#d96a16]" style={{ width: `${project.completionPercentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[var(--color-text-soft)]">No target dates yet. Set a due date on a project to populate this planning lane.</p>
                <Link to="/projects" className="button-primary w-fit px-4 py-2 text-sm">Set a project deadline</Link>
              </div>
            )}
          </WorkspaceWidget>
        </div>
      </div>
    </div>
  )
}
