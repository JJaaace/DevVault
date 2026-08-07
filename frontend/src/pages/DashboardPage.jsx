import { useAuth, useUser } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authenticatedRequest } from '../lib/api'
import { readStoredProfile, saveStoredProfile } from '../lib/profileStorage'
import { fetchProjects } from '../lib/projectsApi'
import { fetchSkills } from '../lib/skillsApi'
import { getTimeGreeting, buildRecentActivity } from '../lib/dashboardUtils'
import { fetchWorkspaceResume, uploadWorkspaceResume } from '../lib/resumeWorkspaceApi'

// certifications key — CertificationsPage persists to this key
const CERTS_KEY = 'devvault.certifications.collection.v2'

// ─── Static seed copies of Goals / Certs to use when localStorage is empty ──
const FALLBACK_GOALS = [
  { id: 'summer-software-engineering-internship', title: 'Summer Software Engineering Internship', status: 'complete', targetCompletion: '2026-08-01', category: 'Career' },
  { id: 'build-devvault', title: 'Build DevVault', status: 'current', targetCompletion: '2026-09-15', category: 'Projects' },
  { id: 'deploy-portfolio', title: 'Deploy Portfolio', status: 'future', targetCompletion: '2026-10-01', category: 'Projects' },
  { id: 'aws-cloud-practitioner-goal', title: 'AWS Cloud Practitioner', status: 'current', targetCompletion: '2026-11-01', category: 'Certifications' },
  { id: 'security-plus', title: 'Security+', status: 'future', targetCompletion: '2027-03-01', category: 'Certifications' },
  { id: 'graduate-ohio-state', title: 'Graduate Ohio State', status: 'future', targetCompletion: '2027-05-01', category: 'Education' },
  { id: 'build-technical-voice', title: 'Build a Strong Technical Voice', status: 'current', targetCompletion: '2026-12-01', category: 'Personal Development' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readLocalJson(key) {
  if (!key || typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem(key) || 'null') } catch { return null }
}

function formatShortDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

function formatMonthYear(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d)
}

const STATUS_META = {
  PLANNING:  { label: 'Planning',   color: 'rgba(214,160,89,0.22)',  text: 'var(--color-text-soft)' },
  BUILDING:  { label: 'Building',   color: 'rgba(231,155,63,0.38)',  text: 'var(--color-brand-ink)' },
  COMPLETED: { label: 'Completed',  color: 'rgba(247,204,129,0.44)', text: 'var(--color-brand-ink)' },
  ARCHIVED:  { label: 'Archived',   color: 'rgba(180,140,80,0.22)',  text: 'var(--color-text-muted)' },
}

function statusMeta(status) {
  return STATUS_META[String(status || '').replace('IN_PROGRESS', 'BUILDING')] || STATUS_META.PLANNING
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const target = Number(value) || 0
    const start = Date.now()
    const from = 0

    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return <>{display}</>
}

// ─── Reusable card shell ──────────────────────────────────────────────────────
function DCard({ children, className = '', href, delay = 0 }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -4, boxShadow: '0 28px 64px rgba(14,9,6,0.44)' }}
      className={`db-card ${className}`}
    >
      {children}
    </motion.div>
  )
  if (href) return <Link to={href} className="block">{inner}</Link>
  return inner
}

function DEyebrow({ children }) {
  return <p className="db-eyebrow">{children}</p>
}

function DTitle({ children, className = '' }) {
  return <h3 className={`db-title ${className}`}>{children}</h3>
}

// ─── Stat tile (hero row) ─────────────────────────────────────────────────────
function StatTile({ icon, label, value, sub, delay = 0, href }) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className="db-stat-tile"
    >
      <span className="db-stat-icon">{icon}</span>
      <div>
        <p className="db-stat-label">{label}</p>
        <p className="db-stat-value">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </p>
        {sub ? <p className="db-stat-sub">{sub}</p> : null}
      </div>
    </motion.div>
  )
  if (href) return <Link to={href} className="block">{content}</Link>
  return content
}

// ─── Profile snapshot ─────────────────────────────────────────────────────────
function ProfileSnapshot({ profile }) {
  const imageUrl = profile?.profileImageUrl || profile?.profileImage
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
  const school = profile?.school || profile?.university

  return (
    <DCard delay={0.06} href="/profile">
      <DEyebrow>Profile</DEyebrow>
      <div className="db-profile-row">
        {imageUrl ? (
          <img src={imageUrl} alt={fullName} className="db-profile-avatar" />
        ) : (
          <div className="db-profile-avatar-fallback">
            {(fullName || 'U').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <DTitle>{fullName || 'Your Name'}</DTitle>
          {profile?.currentRole ? <p className="db-meta">{profile.currentRole}</p> : null}
          {profile?.pronouns ? <p className="db-meta">{profile.pronouns}</p> : null}
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        {school ? (
          <div className="db-info-row">
            <span className="db-info-label">School</span>
            <span className="db-info-value">{school}</span>
          </div>
        ) : null}
        {profile?.major ? (
          <div className="db-info-row">
            <span className="db-info-label">Major</span>
            <span className="db-info-value">{profile.major}</span>
          </div>
        ) : null}
        {profile?.graduationYear ? (
          <div className="db-info-row">
            <span className="db-info-label">Graduating</span>
            <span className="db-info-value">{profile.graduationYear}</span>
          </div>
        ) : null}
        {profile?.favoriteLanguage ? (
          <div className="db-info-row">
            <span className="db-info-label">Fav Language</span>
            <span className="db-info-value">{profile.favoriteLanguage}</span>
          </div>
        ) : null}
        {profile?.favoriteFramework ? (
          <div className="db-info-row">
            <span className="db-info-label">Fav Framework</span>
            <span className="db-info-value">{profile.favoriteFramework}</span>
          </div>
        ) : null}
      </div>
      {(profile?.githubUrl || profile?.linkedinUrl || profile?.twitterUrl) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile?.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="db-chip" onClick={(e) => e.stopPropagation()}>GitHub</a> : null}
          {profile?.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="db-chip" onClick={(e) => e.stopPropagation()}>LinkedIn</a> : null}
          {profile?.twitterUrl ? <a href={profile.twitterUrl} target="_blank" rel="noreferrer" className="db-chip" onClick={(e) => e.stopPropagation()}>Twitter</a> : null}
        </div>
      ) : null}
    </DCard>
  )
}

// ─── Current project card ─────────────────────────────────────────────────────
function CurrentProjectCard({ projects }) {
  const navigate = useNavigate()
  const active = projects
    .filter((p) => {
      const s = String(p.status || '').replace('IN_PROGRESS', 'BUILDING')
      return s === 'BUILDING' || s === 'PLANNING'
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0]

  if (!active) {
    return (
      <DCard delay={0.08}>
        <DEyebrow>Current Project</DEyebrow>
        <DTitle className="mt-2">No active projects</DTitle>
        <p className="db-meta mt-2">Create a project to see it here.</p>
        <Link to="/projects" className="db-action-btn mt-4 inline-flex">Open Projects</Link>
      </DCard>
    )
  }

  const meta = statusMeta(active.status)
  const stack = (active.techStack || active.githubLanguages || []).slice(0, 5)

  return (
    <DCard delay={0.08}>
      {active.bannerImageUrl ? (
        <img src={active.bannerImageUrl} alt={active.title} className="db-project-banner" />
      ) : (
        <div className="db-project-banner-placeholder" />
      )}
      <div className="mt-4">
        <DEyebrow>Current Project</DEyebrow>
        <div className="mt-2 flex items-start justify-between gap-3">
          <DTitle>{active.title}</DTitle>
          <span
            className="db-status-pill flex-shrink-0"
            style={{ background: meta.color, color: meta.text }}
          >
            {meta.label}
          </span>
        </div>
        {active.description ? (
          <p className="db-meta mt-2 line-clamp-2">{active.description}</p>
        ) : null}
        {active.updatedAt ? (
          <p className="db-meta mt-1 text-[0.72rem]">Updated {formatShortDate(active.updatedAt)}</p>
        ) : null}
        {stack.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stack.map((t) => <span key={t} className="db-chip">{t}</span>)}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="db-action-btn mt-4 w-full"
        >
          Open Project
        </button>
      </div>
    </DCard>
  )
}

// ─── Tech stack snapshot ──────────────────────────────────────────────────────
function TechStackCard({ skills }) {
  const [hovered, setHovered] = useState(null)

  const techList = skills
    .sort((a, b) => (b.yearsExperience || 0) - (a.yearsExperience || 0))
    .slice(0, 18)

  return (
    <DCard delay={0.1}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <DEyebrow>Tech Stack</DEyebrow>
          <DTitle className="mt-1">Skills snapshot</DTitle>
        </div>
        <Link to="/skills" className="db-chip db-chip--accent flex-shrink-0">View all</Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {techList.map((skill, i) => (
          <motion.button
            key={skill.id || skill.name}
            type="button"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 + i * 0.04, duration: 0.28 }}
            className={`db-tech-chip ${hovered === skill.id ? 'db-tech-chip--active' : ''}`}
            onMouseEnter={() => setHovered(skill.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {skill.name}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {hovered ? (() => {
          const sk = skills.find((s) => s.id === hovered)
          if (!sk) return null
          const projs = (sk.relatedProjects || []).map((p) => typeof p === 'string' ? p : p.title).filter(Boolean)
          return (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="db-tech-tooltip"
            >
              <p className="font-semibold text-[var(--color-text)]">{sk.name}</p>
              {sk.yearsExperience ? <p className="db-meta">{sk.yearsExperience} yr{sk.yearsExperience !== 1 ? 's' : ''} experience</p> : null}
              {sk.projectsBuilt != null ? <p className="db-meta">{sk.projectsBuilt} project{sk.projectsBuilt !== 1 ? 's' : ''} built</p> : null}
              {projs.length ? <p className="db-meta">{projs.slice(0, 2).join(' · ')}</p> : null}
            </motion.div>
          )
        })() : null}
      </AnimatePresence>
    </DCard>
  )
}

// ─── Featured certification ───────────────────────────────────────────────────
function FeaturedCertCard({ certs }) {
  const featured = certs
    .filter((c) => c.status === 'earned')
    .sort((a, b) => new Date(b.issueDate || 0) - new Date(a.issueDate || 0))[0]
    || certs.find((c) => c.status === 'in-progress')

  if (!featured) {
    return (
      <DCard delay={0.12} href="/certifications">
        <DEyebrow>Certifications</DEyebrow>
        <DTitle className="mt-1">No certifications yet</DTitle>
        <p className="db-meta mt-2">Add certifications to see them here.</p>
      </DCard>
    )
  }

  return (
    <DCard delay={0.12} href="/certifications">
      <DEyebrow>Latest Certification</DEyebrow>
      <div className="mt-3 flex items-center gap-3">
        <div
          className="db-cert-logo"
          style={featured.accentColor ? { background: `color-mix(in srgb, ${featured.accentColor} 22%, rgba(64,44,28,0.9))`, borderColor: `color-mix(in srgb, ${featured.accentColor} 44%, rgba(247,204,129,0.28))` } : undefined}
        >
          {featured.logo}
        </div>
        <div className="min-w-0 flex-1">
          <DTitle>{featured.name}</DTitle>
          <p className="db-meta">{featured.provider}</p>
          {featured.issueDate ? <p className="db-meta">{formatMonthYear(featured.issueDate)}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(featured.skillsGained || []).slice(0, 4).map((s) => (
          <span key={s} className="db-chip">{s}</span>
        ))}
      </div>
      <p className="db-action-label mt-3">View all certifications →</p>
    </DCard>
  )
}

// ─── Current focus (from Goals) ───────────────────────────────────────────────
function CurrentFocusCard({ goals }) {
  const active = goals.filter((g) => g.status === 'current').slice(0, 3)
  const pinned = goals.filter((g) => g.pinned && g.status !== 'archived').slice(0, 2)
  const focused = active.length ? active : pinned

  return (
    <DCard delay={0.14}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <DEyebrow>Current Focus</DEyebrow>
          <DTitle className="mt-1">What I'm working on</DTitle>
        </div>
        <Link to="/goals" className="db-chip db-chip--accent flex-shrink-0">All goals</Link>
      </div>
      {focused.length ? (
        <div className="mt-4 space-y-2.5">
          {focused.map((goal, i) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.07, duration: 0.3 }}
              className="db-focus-row"
            >
              <span className="db-focus-dot" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">{goal.title}</p>
                <p className="db-meta">{goal.category}{goal.targetCompletion ? ` · ${formatShortDate(goal.targetCompletion)}` : ''}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="db-meta mt-3">No active goals. Add goals to see your current focus here.</p>
      )}
    </DCard>
  )
}

// ─── Upcoming milestone ───────────────────────────────────────────────────────
function UpcomingMilestoneCard({ goals }) {
  const upcoming = goals
    .filter((g) => g.status !== 'complete' && g.status !== 'archived' && g.targetCompletion)
    .sort((a, b) => new Date(a.targetCompletion) - new Date(b.targetCompletion))
    .slice(0, 3)

  return (
    <DCard delay={0.16} href="/goals">
      <DEyebrow>Upcoming Milestones</DEyebrow>
      <DTitle className="mt-1">Next on the roadmap</DTitle>
      {upcoming.length ? (
        <div className="mt-4 space-y-3">
          {upcoming.map((goal, i) => (
            <div key={goal.id} className="db-milestone-row">
              <span className="db-milestone-num">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">{goal.title}</p>
                {goal.targetCompletion ? (
                  <p className="db-meta">{formatShortDate(goal.targetCompletion)}</p>
                ) : null}
              </div>
              <span className="db-chip flex-shrink-0">{goal.category}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="db-meta mt-3">No upcoming milestones yet.</p>
      )}
    </DCard>
  )
}

// ─── Recent activity ──────────────────────────────────────────────────────────
function RecentActivityCard({ profile, projects, skills, resume }) {
  const entries = buildRecentActivity(profile, projects, skills)

  const resumeEntry = resume?.uploaded && resume?.lastUpdated
    ? [{ type: 'resume', label: 'Resume uploaded', description: resume.fileName || 'Resume.pdf', date: new Date(resume.lastUpdated) }]
    : []

  const all = [...resumeEntry, ...entries]
    .sort((a, b) => b.date - a.date)
    .slice(0, 7)

  const ICONS = { profile: '👤', project: '🛠', skill: '💻', resume: '📄' }

  return (
    <DCard delay={0.18}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <DEyebrow>Activity</DEyebrow>
          <DTitle className="mt-1">Recent changes</DTitle>
        </div>
      </div>
      {all.length ? (
        <div className="mt-4 space-y-2.5">
          {all.map((entry, i) => (
            <motion.div
              key={`${entry.type}-${entry.label}-${entry.date.toISOString()}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 + i * 0.05, duration: 0.28 }}
              className="db-activity-row"
            >
              <span className="db-activity-icon">{ICONS[entry.type] || '·'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">{entry.label}</p>
                <p className="db-meta">{entry.description}</p>
              </div>
              <span className="db-meta flex-shrink-0 text-right">
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(entry.date)}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="db-meta mt-4">No activity yet.</p>
      )}
    </DCard>
  )
}

// ─── Projects overview ────────────────────────────────────────────────────────
function ProjectsOverviewCard({ projects }) {
  const recent = [...projects]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 4)

  const counts = projects.reduce((acc, p) => {
    const s = String(p.status || '').replace('IN_PROGRESS', 'BUILDING')
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  return (
    <DCard delay={0.1}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <DEyebrow>Projects</DEyebrow>
          <DTitle className="mt-1">All {projects.length} project{projects.length !== 1 ? 's' : ''}</DTitle>
        </div>
        <Link to="/projects" className="db-chip db-chip--accent flex-shrink-0">Open</Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {['PLANNING', 'BUILDING', 'COMPLETED', 'ARCHIVED'].map((s) => {
          const m = statusMeta(s)
          return (
            <div key={s} className="db-count-tile" style={{ borderColor: m.color }}>
              <p className="db-count-num" style={{ color: m.text }}>
                <AnimatedNumber value={counts[s] || 0} />
              </p>
              <p className="db-count-label">{m.label}</p>
            </div>
          )
        })}
      </div>

      {recent.length ? (
        <div className="mt-4 space-y-2">
          {recent.map((p) => {
            const m = statusMeta(p.status)
            return (
              <div key={p.id} className="db-project-row">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text)]">{p.title}</p>
                  <p className="db-meta">{formatShortDate(p.updatedAt || p.createdAt)}</p>
                </div>
                <span className="db-status-pill flex-shrink-0" style={{ background: m.color, color: m.text }}>{m.label}</span>
              </div>
            )
          })}
        </div>
      ) : null}
    </DCard>
  )
}

// ─── Certifications strip (all earned) ───────────────────────────────────────
function CertificationsCard({ certs }) {
  const earned = certs.filter((c) => c.status === 'earned')
  const inProgress = certs.filter((c) => c.status === 'in-progress')
  const planned = certs.filter((c) => c.status === 'planned')

  return (
    <DCard delay={0.2} href="/certifications">
      <div className="flex items-start justify-between gap-4">
        <div>
          <DEyebrow>Certifications</DEyebrow>
          <DTitle className="mt-1">Achievement gallery</DTitle>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <span className="db-chip db-chip--accent">{earned.length} earned</span>
          {inProgress.length ? <span className="db-chip">{inProgress.length} in progress</span> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {certs.slice(0, 8).map((cert) => (
          <div
            key={cert.id}
            className="db-cert-mini"
            style={cert.accentColor ? { borderColor: `color-mix(in srgb, ${cert.accentColor} 36%, rgba(214,160,89,0.22))` } : undefined}
            title={cert.name}
          >
            <span className="text-base">{cert.logo}</span>
            <span className="db-meta truncate max-w-[7rem]">{cert.name}</span>
            <span
              className="db-cert-mini-dot flex-shrink-0"
              style={{
                background: cert.status === 'earned' ? '#f7cc81' : cert.status === 'in-progress' ? '#e79b3f' : 'rgba(200,145,84,0.5)',
              }}
            />
          </div>
        ))}
      </div>
      {planned.length ? (
        <p className="db-meta mt-3">{planned.length} planned · <span className="text-[var(--color-brand-ink)]">View roadmap →</span></p>
      ) : null}
    </DCard>
  )
}

// ─── Resume card ──────────────────────────────────────────────────────────────
function ResumeCard({ resume, onUploadClick, uploading }) {
  const has = Boolean(resume?.uploaded)
  return (
    <DCard delay={0.22}>
      <DEyebrow>Resume</DEyebrow>
      <DTitle className="mt-1">{has ? (resume.fileName || 'Resume.pdf') : 'No resume uploaded'}</DTitle>
      {has && resume?.lastUpdated ? (
        <p className="db-meta mt-1">Last updated {formatShortDate(resume.lastUpdated)}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploading}
          className="db-action-btn"
        >
          {uploading ? 'Uploading…' : has ? 'Replace' : 'Upload PDF'}
        </button>
        <Link to="/resume-workspace" className="db-chip">Open workspace</Link>
      </div>
    </DCard>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()

  const [profile, setProfile] = useState(() => readStoredProfile())
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [resume, setResume] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  // read certifications from localStorage (CertificationsPage persists them)
  const [certs, setCerts] = useState(() => {
    const stored = readLocalJson(CERTS_KEY)
    return Array.isArray(stored) ? stored : []
  })

  // goals live in-memory on GoalsPage; we use the fallback copy here
  const goals = FALLBACK_GOALS

  const resumeInputRef = useRef(null)

  const refresh = useCallback(async () => {
    const [profileRes, projectRes, skillRes, resumeRes] = await Promise.allSettled([
      authenticatedRequest('/api/profile', {}, getToken),
      fetchProjects(getToken),
      fetchSkills(getToken),
      fetchWorkspaceResume(getToken),
    ])

    if (profileRes.status === 'fulfilled' && profileRes.value) {
      setProfile(profileRes.value)
      saveStoredProfile(profileRes.value)
    }
    if (projectRes.status === 'fulfilled') {
      setProjects(Array.isArray(projectRes.value) ? projectRes.value : [])
    }
    if (skillRes.status === 'fulfilled') {
      setSkills(Array.isArray(skillRes.value) ? skillRes.value : [])
    }
    if (resumeRes.status === 'fulfilled') {
      setResume(resumeRes.value || null)
    }

    // re-read certs from localStorage in case the user updated them
    const storedCerts = readLocalJson(CERTS_KEY)
    if (Array.isArray(storedCerts)) setCerts(storedCerts)

    setLoading(false)
  }, [getToken])

  useEffect(() => {
    const id = window.setTimeout(() => refresh().catch(() => setLoading(false)), 0)
    return () => window.clearTimeout(id)
  }, [refresh])

  // background refresh every 3 min
  useEffect(() => {
    const id = window.setInterval(() => refresh().catch(() => {}), 180000)
    return () => window.clearInterval(id)
  }, [refresh])

  const handleUploadClick = () => resumeInputRef.current?.click()

  const handleFileChange = async (e) => {
    const [file] = Array.from(e.target.files || [])
    if (!file) return
    const isPdf = String(file.type || '').includes('pdf') || /\.pdf$/i.test(file.name)
    if (!isPdf) { e.target.value = ''; return }

    setUploading(true)
    try {
      const next = await uploadWorkspaceResume(file, getToken)
      setResume(next)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const userName = user?.firstName || profile?.firstName || 'there'
  const greeting = getTimeGreeting()

  const earnedCerts = certs.filter((c) => c.status === 'earned').length

  return (
    <div className="page-shell page-shell--wide page-stack gap-5 pb-14 db-page">

      {/* ── Hero ── */}
      <section className="db-hero">
        <div className="db-hero-glow" />
        <div className="relative z-10">
          <p className="db-eyebrow">{greeting}</p>
          <h1 className="db-hero-name">
            {userName}
            {profile?.openToWork ? (
              <span className="db-open-badge">
                <span className="db-open-dot" />
                {profile.jobType ? `Open to ${profile.jobType}` : 'Open to work'}
              </span>
            ) : null}
          </h1>
          {profile?.tagline ? (
            <p className="db-hero-tagline">{profile.tagline}</p>
          ) : profile?.currentRole ? (
            <p className="db-hero-tagline">{profile.currentRole}</p>
          ) : null}
        </div>

        <div className="db-stat-row">
          {[
            { icon: '🛠', label: 'Projects',      value: projects.length,                        href: '/projects' },
            { icon: '💻', label: 'Skills',         value: skills.length,                          href: '/skills' },
            { icon: '🏆', label: 'Certifications', value: earnedCerts,                            href: '/certifications' },
            { icon: '📚', label: 'Years Coding',   value: profile?.yearsCoding ?? '—',            href: null },
            { icon: '🎓', label: 'Graduating',     value: profile?.graduationYear ?? '—',         href: null },
            { icon: '🏫', label: 'School',         value: profile?.school?.split(' ').pop() ?? '—', href: '/profile' },
          ].map(({ icon, label, value, href }, i) => (
            <StatTile key={label} icon={icon} label={label} value={value} href={href} delay={0.04 + i * 0.05} />
          ))}
        </div>
      </section>

      {loading ? (
        <div className="db-card">
          <p className="db-meta">Loading workspace data…</p>
        </div>
      ) : null}

      {/* ── Row 1: Profile + Current Project + Current Focus ── */}
      <div className="db-grid-3">
        <ProfileSnapshot profile={profile} />
        <CurrentProjectCard projects={projects} />
        <CurrentFocusCard goals={goals} />
      </div>

      {/* ── Row 2: Tech stack (wide) + Featured cert ── */}
      <div className="db-grid-2-1">
        <TechStackCard skills={skills} />
        <FeaturedCertCard certs={certs} />
      </div>

      {/* ── Row 3: Projects overview + Upcoming milestones + Activity ── */}
      <div className="db-grid-3">
        <ProjectsOverviewCard projects={projects} />
        <UpcomingMilestoneCard goals={goals} />
        <RecentActivityCard profile={profile} projects={projects} skills={skills} resume={resume} />
      </div>

      {/* ── Row 4: All certifications + Resume ── */}
      <div className="db-grid-2-1">
        <CertificationsCard certs={certs} />
        <ResumeCard resume={resume} onUploadClick={handleUploadClick} uploading={uploading} />
      </div>

      <input ref={resumeInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
    </div>
  )
}


