import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DashboardCard } from '../components/DashboardCard'
import { ProfileCard } from '../components/ProfileCard'
import { ProjectCard } from '../components/ProjectCard'
import { SectionHeader } from '../components/SectionHeader'
import { SkillCard } from '../components/SkillCard'
import { fetchPublicPortfolio } from '../lib/portfolioApi'

function sortByUpdatedAtDesc(items = []) {
  return [...items].sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
}

export function PortfolioPage() {
  const { username } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const data = await fetchPublicPortfolio(username)
        setPortfolio(data)
      } catch (err) {
        setError(err.message || 'Unable to load portfolio.')
      } finally {
        setLoading(false)
      }
    }

    loadPortfolio()
  }, [username])

  const parseErrorMessage = (message) => {
    if (!message) {
      return 'Unable to load portfolio.'
    }

    try {
      const parsed = JSON.parse(message)
      if (parsed?.message) {
        return parsed.message
      }
    } catch {
      // fall through to the raw message
    }

    return message
  }

  const profile = portfolio?.profile || null
  const projects = useMemo(() => portfolio?.projects ?? [], [portfolio])
  const skills = useMemo(() => portfolio?.skills ?? [], [portfolio])
  const publicUrl = typeof window !== 'undefined' && username ? `${window.location.origin}/portfolio/${username}` : ''

  const topProjects = useMemo(
    () => sortByUpdatedAtDesc(projects).slice(0, 3),
    [projects],
  )

  const topSkills = useMemo(
    () => [...skills].sort((left, right) => right.percentage - left.percentage).slice(0, 4),
    [skills],
  )

  const recentActivity = useMemo(() => {
    const entries = [
      ...projects.map((project) => ({
        type: 'project',
        label: project.title,
        detail: `${project.status.replace('_', ' ').toLowerCase()} · ${project.completionPercentage}% complete`,
        updatedAt: project.updatedAt || project.createdAt,
      })),
      ...skills.map((skill) => ({
        type: 'skill',
        label: skill.name,
        detail: `${skill.category} · ${skill.percentage}% complete`,
        updatedAt: skill.updatedAt || skill.createdAt,
      })),
    ]

    return entries.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)).slice(0, 5)
  }, [projects, skills])

  if (loading) {
    return (
      <div className="page-shell page-shell--wide page-stack pb-14">
        <div className="widget-card p-8 text-sm text-[var(--color-text-soft)]">Loading portfolio...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell page-shell--wide page-stack pb-14">
        <section className="surface-card p-6 md:p-8">
          <SectionHeader
            eyebrow="Public portfolio"
            title="Portfolio unavailable"
            description={parseErrorMessage(error)}
            action={<Link to="/login" className="button-secondary px-4 py-2 text-sm">Return to DevVault</Link>}
          />
        </section>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page-shell page-shell--wide page-stack pb-14">
        <section className="surface-card p-6 md:p-8">
          <SectionHeader
            eyebrow="Public portfolio"
            title="Portfolio not found"
            description="This public view link does not match an existing portfolio yet."
            action={<Link to="/login" className="button-secondary px-4 py-2 text-sm">Return to DevVault</Link>}
          />
        </section>
      </div>
    )
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')

  return (
    <div className="page-shell page-shell--wide page-stack pb-14">
      <section className="surface-card surface-card--hero overflow-hidden px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(135deg,rgba(249,201,110,0.28),rgba(234,139,33,0.2),rgba(217,106,22,0.18))]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Public portfolio</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--color-text)] md:text-5xl">
              {fullName || profile.username}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-soft)]">
              {profile.currentRole || 'Developer portfolio'} · {profile.location || 'Location not added yet'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="chip chip--accent">Read only</span>
            <span className="chip">{projects.length} projects</span>
            <span className="chip">{skills.length} skills</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ProfileCard profile={profile} />

        <DashboardCard title="Portfolio link" description="Share this URL with recruiters or friends so they can view your work without editing anything.">
          <div className="space-y-3">
            <div className="rounded-[1.1rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm text-[var(--color-text-soft)]">
              {publicUrl}
            </div>
            <Link to="/dashboard" className="button-secondary px-4 py-2 text-sm">Back to workspace</Link>
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Projects" description="Published work and launch momentum.">
          <p className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">{projects.length}</p>
        </DashboardCard>
        <DashboardCard title="Skills" description="Tracked competencies and study focus.">
          <p className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">{skills.length}</p>
        </DashboardCard>
        <DashboardCard title="Most active" description={topProjects[0]?.title || 'No projects yet'}>
          <p className="text-sm text-[var(--color-text-soft)]">{topProjects[0]?.completionPercentage || 0}% complete</p>
        </DashboardCard>
        <DashboardCard title="Top skill" description={topSkills[0]?.name || 'No skills yet'}>
          <p className="text-sm text-[var(--color-text-soft)]">{topSkills[0]?.percentage || 0}% complete</p>
        </DashboardCard>
      </div>

      {topProjects.length ? (
        <section className="page-stack">
          <SectionHeader eyebrow="Projects" title="Project highlights" description="Your most recent and relevant projects for a public portfolio view." />
          <div className="grid gap-6 lg:grid-cols-2">
            {topProjects.map((project) => (
              <ProjectCard key={project.id} project={project} readOnly />
            ))}
          </div>
        </section>
      ) : null}

      {topSkills.length ? (
        <section className="page-stack">
          <SectionHeader eyebrow="Skills" title="Skill highlights" description="A small set of your strongest or most relevant skills." />
          <div className="grid gap-6 lg:grid-cols-2">
            {topSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} readOnly />
            ))}
          </div>
        </section>
      ) : null}

      {recentActivity.length ? (
        <DashboardCard title="Recent activity" description="The latest project and skill updates on this portfolio.">
          <div className="space-y-3">
            {recentActivity.map((entry) => (
              <div key={`${entry.type}-${entry.label}-${entry.updatedAt}`} className="flex items-start justify-between gap-3 rounded-[1.1rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                <div>
                  <p className="font-medium text-[var(--color-text)]">{entry.label}</p>
                  <p className="text-sm text-[var(--color-text-soft)]">{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      ) : null}
    </div>
  )
}