import { useAuth, useUser } from '@clerk/clerk-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { TechnologyLogo } from '../components/TechnologyLogo'
import { authenticatedRequest } from '../lib/api'
import { getTimeGreeting } from '../lib/dashboardUtils'
import { decorateProjectShowcase } from '../lib/projectShowcaseCatalog'
import { useGuestMode } from '../context/GuestModeContext'

function Link({ to, ...props }) {
  const { resolvePath } = useGuestMode()
  return <RouterLink to={resolvePath(to)} {...props} />
}

const PROJECT_STATUS = {
  PLANNING: 'Planning',
  BUILDING: 'Building',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
}

const GOAL_STATUS = {
  current: 'In progress',
  future: 'Planning',
  complete: 'Complete',
  archived: 'Archived',
}

const EXPERIENCE_LABEL = {
  BEGINNER: 'Learning',
  ADVANCED_BEGINNER: 'Developing',
  INTERMEDIATE: 'Comfortable',
  ADVANCED: 'Confident',
  EXPERT: 'Advanced',
}

const ICON_PATHS = {
  github: 'M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.02c-3.22.7-3.9-1.36-3.9-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.3-5.28-1.29-5.28-5.68 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.4-2.71 5.38-5.3 5.67.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z',
  linkedin: 'M5.35 7.75H1.1V21.3h4.25V7.75ZM3.23 1A2.47 2.47 0 1 0 3.2 5.94 2.47 2.47 0 0 0 3.23 1ZM21.3 13.54c0-4.08-2.18-5.98-5.09-5.98-2.34 0-3.39 1.29-3.97 2.2V7.75H8v13.54h4.25v-6.7c0-1.77.34-3.49 2.54-3.49 2.16 0 2.19 2.02 2.19 3.6v6.59h4.25l.07-7.75Z',
  resume: 'M6 2h8l4 4v16H6V2Zm8 1.5V7h3.5M9 11h6M9 15h6M9 19h4',
  portfolio: 'M4 6h16v14H4V6Zm4 0V3h8v3M4 11h16M10 11v2h4v-2',
  email: 'M3 5h18v14H3V5Zm1 1 8 7 8-7',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  location: 'M12 21s6-5.4 6-12A6 6 0 0 0 6 9c0 6.6 6 12 6 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  school: 'm3 9 9-5 9 5-9 5-9-5Zm3 2.5V17c3.8 2.7 8.2 2.7 12 0v-5.5M21 9v7',
  briefcase: 'M4 7h16v13H4V7Zm4 0V4h8v3M4 12h16M10 12v2h4v-2',
  external: 'M14 4h6v6M20 4l-9 9M18 13v7H4V6h7',
}

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={name === 'github' || name === 'linkedin' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name] || ICON_PATHS.arrow} />
    </svg>
  )
}

function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

function getProfileIdentity(profile) {
  const taglineParts = String(profile?.tagline || '').split('|').map((part) => part.trim()).filter(Boolean)
  const primary = taglineParts.find((part) => /(engineer|developer)/i.test(part) && !/^student\b/i.test(part))
    || profile?.currentRole
    || taglineParts[0]
    || 'Developer'
  const supporting = taglineParts.filter((part) => part !== primary).join(' · ')
  return { primary, supporting }
}

function AnimatedNumber({ value }) {
  const reduceMotion = useReducedMotion()
  const target = Number(value) || 0
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (reduceMotion) return undefined
    let frameId
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / 650, 1)
      setDisplay(Math.round(target * (1 - ((1 - progress) ** 3))))
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [reduceMotion, target])

  return reduceMotion ? target : display
}

function SpotlightSurface({ children, className = '' }) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType === 'touch' || !ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`)
    ref.current.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`)
  }

  return (
    <div ref={ref} onPointerMove={handlePointerMove} className={`db-surface db-spotlight ${className}`.trim()}>
      {children}
    </div>
  )
}

function Reveal({ children, className = '', delay = 0 }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.46, delay: reduceMotion ? 0 : delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="db-section-heading">
      <div>
        <p className="db-eyebrow">{eyebrow}</p>
        <h2 className="db-section-title">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function CareerAction({ href, to, icon, label, variant, external = false }) {
  const className = `db-career-action db-career-action--${variant}`
  const content = <><Icon name={icon} /><span>{label}</span><Icon name="arrow" size={15} /></>
  if (to) return <Link to={to} className={className}>{content}</Link>
  return <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className={className}>{content}</a>
}

function IdentityHero({ profile, email, commandDeck }) {
  const reduceMotion = useReducedMotion()
  const { isGuestMode, basePath } = useGuestMode()
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.username || 'Your profile'
  const initials = fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const schoolLine = [profile?.major, profile?.school].filter(Boolean).join(' · ')
  const identity = getProfileIdentity(profile)
  const portfolioPath = isGuestMode ? basePath.replace(/\/vault$/, '') : profile?.username && profile?.portfolioEnabled ? `/portfolio/${profile.username}` : '/profile'
  const actions = [
    profile?.githubUrl && { href: profile.githubUrl, icon: 'github', label: 'GitHub', variant: 'github', external: true },
    profile?.linkedinUrl && { href: profile.linkedinUrl, icon: 'linkedin', label: 'LinkedIn', variant: 'linkedin', external: true },
    { to: '/resume-workspace', icon: 'resume', label: commandDeck?.evidence?.hasResume ? 'Resume' : 'Add Resume', variant: 'resume' },
    { to: portfolioPath, icon: 'portfolio', label: isGuestMode ? 'Recruiter Overview' : profile?.portfolioEnabled ? 'Public Portfolio' : 'Enable Portfolio', variant: 'portfolio' },
    email && { href: `mailto:${email}`, icon: 'email', label: 'Email', variant: 'email' },
  ].filter(Boolean)

  return (
    <SpotlightSurface className="db-identity">
      <div className="db-identity-bloom" aria-hidden="true" />
      <div className="db-identity-main">
        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.48, delay: 0.08 }}
          className="db-portrait-shell"
        >
          {profile?.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={`${fullName} profile`} className="db-portrait" />
          ) : (
            <div className="db-portrait db-portrait--fallback" aria-label={`${fullName} initials`}>{initials}</div>
          )}
        </motion.div>

        <div className="db-identity-copy">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="db-eyebrow">
            {getTimeGreeting()} · Developer workspace
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.42 }} className="db-identity-name">
            {fullName}
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <p className="db-identity-role">{identity.primary}</p>
            {identity.supporting ? <p className="db-identity-tagline">{identity.supporting}</p> : null}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="db-identity-facts">
            {schoolLine ? <span><Icon name="school" size={16} />{schoolLine}</span> : null}
            {profile?.location ? <span><Icon name="location" size={16} />{profile.location}</span> : null}
            {profile?.graduationYear ? <span><Icon name="briefcase" size={16} />Class of {profile.graduationYear}</span> : null}
          </motion.div>

          {profile?.openToWork ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34 }} className="db-open-state">
              <span className="db-live-dot" />
              {profile.jobType ? `Open to ${profile.jobType}` : 'Open to work'}
            </motion.div>
          ) : null}
        </div>
      </div>

      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.055, delayChildren: 0.34 } } }} className="db-career-actions">
        {actions.map((action) => (
          <motion.div key={action.label} className={`db-career-action-wrap db-career-action-wrap--${action.variant}`} variants={{ hidden: { opacity: 0, y: reduceMotion ? 0 : 8 }, visible: { opacity: 1, y: 0 } }}>
            <CareerAction {...action} />
          </motion.div>
        ))}
      </motion.div>
    </SpotlightSurface>
  )
}

function StatusRail({ profile, commandDeck }) {
  const { isGuestMode } = useGuestMode()
  const currentProject = commandDeck?.currentProject
  const learning = commandDeck?.credentialSpotlight?.learning
  const milestone = commandDeck?.nextMilestone
  const statuses = [
    currentProject && { label: 'Building now', value: currentProject.title, href: '/projects', active: true },
    learning && { label: 'Current learning', value: learning.name, href: '/certifications', active: true },
    milestone && { label: 'Next milestone', value: milestone.title, detail: formatDate(milestone.targetCompletion), href: `/goals?goal=${milestone.id}` },
    !isGuestMode && profile?.githubUrl && { label: 'GitHub projects', value: 'Linked repository metadata', href: '/projects#github-sync' },
    profile?.openToWork && { label: 'Availability', value: profile.jobType ? `Open to ${profile.jobType}` : 'Open to work', href: '/profile', active: true },
  ].filter(Boolean)

  return (
    <SpotlightSurface className="db-now">
      <div className="db-now-header">
        <div>
          <p className="db-eyebrow">Live status</p>
          <h2>Now</h2>
        </div>
        <span className="db-now-signal"><span />Live</span>
      </div>
      <div className="db-now-list">
        {statuses.length ? statuses.map((status, index) => (
          <motion.div key={status.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 + index * 0.07 }}>
            <Link to={status.href} className="db-now-item">
              <span className={status.active ? 'db-live-dot' : 'db-status-dot'} />
              <span className="min-w-0">
                <span className="db-now-label">{status.label}</span>
                <strong>{status.value}</strong>
                {status.detail ? <small>{status.detail}</small> : null}
              </span>
              <Icon name="arrow" size={15} />
            </Link>
          </motion.div>
        )) : <p className="db-empty-copy">Add active projects, goals, or credentials to establish your current state.</p>}
      </div>
    </SpotlightSurface>
  )
}

function CurrentBuild({ project, highlightedTechnology }) {
  const showcaseProject = useMemo(() => project ? decorateProjectShowcase(project, 0) : null, [project])
  if (!showcaseProject) {
    return (
      <Reveal>
        <SpotlightSurface className="db-current-build db-empty-panel">
          <SectionHeading eyebrow="Current build" title="Your next build starts here" />
          <p className="db-empty-copy">Feature an active project to make it the centerpiece of your command deck.</p>
          <Link to="/projects/new" className="db-inline-action">Create a project <Icon name="arrow" size={15} /></Link>
        </SpotlightSurface>
      </Reveal>
    )
  }

  const stack = showcaseProject.showcase.techStack || []
  const isHighlighted = highlightedTechnology && stack.some((item) => item.toLowerCase() === highlightedTechnology.toLowerCase())
  const persistedArtwork = showcaseProject.image || showcaseProject.bannerImageUrl || ''
  const usesFallbackArtwork = Boolean(showcaseProject.showcase.image && showcaseProject.showcase.image !== persistedArtwork)

  return (
    <Reveal>
      <SpotlightSurface className={`db-current-build ${isHighlighted ? 'db-current-build--linked' : ''}`}>
        <div className={`db-build-image-wrap ${usesFallbackArtwork ? 'db-build-image-wrap--fallback' : ''}`.trim()}>
          <img src={showcaseProject.showcase.image} alt={`${showcaseProject.title} project artwork`} className="db-build-image" decoding="async" />
          <div className="db-build-scrim" />
          <div className="db-build-kicker"><span className="db-live-dot" />Current build</div>
          <span className={`db-project-status db-project-status--${String(showcaseProject.status).toLowerCase()}`}>
            {PROJECT_STATUS[showcaseProject.status] || showcaseProject.status}
          </span>
        </div>
        <div className="db-build-content">
          <div className="db-build-copy">
            <p className="db-eyebrow">Featured engineering work</p>
            <h2>{showcaseProject.title}</h2>
            <p>{showcaseProject.description}</p>
            <div className="db-build-meta">
              {showcaseProject.updatedAt ? <span>Updated {formatDate(showcaseProject.githubUpdatedAt || showcaseProject.updatedAt)}</span> : null}
            </div>
          </div>
          <div className="db-build-stack" aria-label="Project technologies">
            {stack.slice(0, 6).map((technology) => <span key={technology}>{technology}</span>)}
          </div>
          <div className="db-build-actions">
            {showcaseProject.githubUrl ? <a href={showcaseProject.githubUrl} target="_blank" rel="noreferrer" className="db-project-action db-project-action--repository"><Icon name="github" />Repository</a> : null}
            {showcaseProject.liveDemoUrl ? <a href={showcaseProject.liveDemoUrl} target="_blank" rel="noreferrer" className="db-project-action"><Icon name="external" />Live demo</a> : null}
            <Link to="/projects" className="db-project-action db-project-action--primary">Open Project <Icon name="arrow" /></Link>
          </div>
        </div>
      </SpotlightSurface>
    </Reveal>
  )
}

function EvidenceStrip({ evidence, currentProject }) {
  const items = [
    { key: 'projects', value: evidence?.projects || 0, label: 'Projects', to: '/projects' },
    { key: 'technologies', value: evidence?.technologies || 0, label: 'Technologies', to: '/skills' },
    { key: 'credentials', value: evidence?.credentials || 0, label: 'Earned credentials', to: '/certifications' },
    { key: 'activeGoals', value: evidence?.activeGoals || 0, label: 'Active goals', to: '/goals' },
    { key: 'githubRepositories', value: evidence?.githubRepositories || 0, label: 'GitHub repositories', to: '/projects' },
    { key: 'currentBuild', value: currentProject?.title || '—', label: 'Current build', to: '/projects' },
  ]

  return (
    <Reveal className="db-evidence" delay={0.03}>
      {items.map((item) => (
        <Link to={item.to} key={item.key} className="db-evidence-item">
          <strong>{typeof item.value === 'number' ? <AnimatedNumber value={item.value} /> : item.value}</strong>
          <span>{item.label}</span>
          <Icon name="arrow" size={14} />
        </Link>
      ))}
    </Reveal>
  )
}

function TechnologyBench({ skills, onHover }) {
  return (
    <Reveal className="db-technology-section">
      <SectionHeading eyebrow="Technology bench" title="The tools behind the work" action={<Link to="/skills" className="db-text-link">All technologies <Icon name="arrow" size={15} /></Link>} />
      {skills?.length ? (
        <div className="db-tech-grid">
          {skills.map((skill, index) => {
            const projects = Array.isArray(skill.relatedProjects) ? skill.relatedProjects : []
            return (
              <motion.div key={skill.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.045 }}>
                <Link
                  to={`/skills?technology=${encodeURIComponent(skill.name)}`}
                  onMouseEnter={() => onHover(skill.name)}
                  onMouseLeave={() => onHover('')}
                  onFocus={() => onHover(skill.name)}
                  onBlur={() => onHover('')}
                  className="db-tech-tile"
                >
                  <TechnologyLogo technologyKey={skill.technologyKey} name={skill.name} size="md" />
                  <span className="db-tech-copy">
                    <strong>{skill.name}</strong>
                    <span>{EXPERIENCE_LABEL[skill.experienceLevel] || skill.experienceLevel}</span>
                    <small>{Number(skill.yearsExperience || 0)} yr{Number(skill.yearsExperience || 0) === 1 ? '' : 's'} · {Number(skill.projectsBuilt || 0)} project{Number(skill.projectsBuilt || 0) === 1 ? '' : 's'}</small>
                  </span>
                  <span className="db-tech-projects">{projects.length ? projects.slice(0, 2).map((project) => project.title).join(' · ') : 'Ready for a project'}</span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      ) : <p className="db-empty-copy">Add technologies to build your bench.</p>}
    </Reveal>
  )
}

function FocusQueue({ goals, profileFocus }) {
  return (
    <SpotlightSurface className="db-support-panel db-focus-panel">
      <SectionHeading eyebrow="Current focus" title="Focus queue" action={<Link to="/goals" className="db-text-link">All goals <Icon name="arrow" size={15} /></Link>} />
      {profileFocus ? <p className="db-profile-focus">{profileFocus}</p> : null}
      <div className="db-focus-list">
        {goals?.length ? goals.map((goal, index) => (
          <Link to={`/goals?goal=${goal.id}`} key={goal.id} className="db-focus-item">
            <span className="db-focus-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="db-focus-copy">
              <strong>{goal.title}</strong>
              <span>{goal.category}</span>
            </span>
            <span className="db-focus-state">
              <small>{GOAL_STATUS[goal.status] || goal.status}</small>
              {goal.targetCompletion ? <time dateTime={goal.targetCompletion}>{formatDate(goal.targetCompletion)}</time> : null}
            </span>
          </Link>
        )) : <p className="db-empty-copy">Your active goals will appear here.</p>}
      </div>
    </SpotlightSurface>
  )
}

function RecentWins({ wins }) {
  const icons = { project: '↗', goal: '✓', credential: '◆' }
  return (
    <SpotlightSurface className="db-support-panel db-wins-panel">
      <SectionHeading eyebrow="Momentum" title="Recent wins" />
      <div className="db-wins-list">
        {wins?.length ? wins.map((win, index) => (
          <motion.div key={win.id} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
            <Link to={win.href} className="db-win-item">
              <span className={`db-win-icon db-win-icon--${win.type}`}>{icons[win.type] || '·'}</span>
              <span><strong>{win.title}</strong>{win.date ? <time dateTime={win.date}>{formatDate(win.date)}</time> : null}</span>
              <Icon name="arrow" size={15} />
            </Link>
          </motion.div>
        )) : <p className="db-empty-copy">Complete a project, goal, or credential to record your next win.</p>}
      </div>
    </SpotlightSurface>
  )
}

function CredentialSpotlight({ spotlight }) {
  const rows = [
    spotlight?.earned && { label: 'Latest earned', item: spotlight.earned, className: 'earned', date: spotlight.earned.issueDate ? formatDate(spotlight.earned.issueDate, { month: 'short', year: 'numeric' }) : spotlight.earned.year },
    spotlight?.learning && { label: 'Currently learning', item: spotlight.learning, className: 'learning', date: 'In progress' },
    spotlight?.planned && { label: 'Up next', item: spotlight.planned, className: 'planned', date: `Planned · ${spotlight.planned.year}` },
  ].filter(Boolean)
  return (
    <SpotlightSurface className="db-support-panel db-credentials-panel">
      <SectionHeading eyebrow="Credentials" title="Credential spotlight" action={<Link to="/certifications" className="db-text-link">View all <Icon name="arrow" size={15} /></Link>} />
      <div className="db-credential-list">
        {rows.length ? rows.map(({ label, item, className, date }) => (
          <Link to="/certifications" key={`${className}-${item.id}`} className={`db-credential-item db-credential-item--${className}`}>
            <span className="db-credential-mark">{item.logo || (className === 'earned' ? '✓' : className === 'learning' ? '◌' : '◇')}</span>
            <span className="db-credential-copy"><small>{label}</small><strong>{item.name}</strong><span>{item.provider || item.organization} · {date}</span></span>
          </Link>
        )) : <p className="db-empty-copy">Add credentials to create your spotlight.</p>}
      </div>
    </SpotlightSurface>
  )
}

function QuickAccess({ profile }) {
  const reduceMotion = useReducedMotion()
  const { isGuestMode } = useGuestMode()
  const links = [
    { label: 'Projects', detail: 'Build portfolio', to: '/projects', icon: '↗' },
    { label: 'Skills', detail: 'Technology map', to: '/skills', icon: '⌘' },
    { label: 'Certifications', detail: 'Credentials', to: '/certifications', icon: '◆' },
    { label: 'Goals', detail: 'Mission control', to: '/goals', icon: '◎' },
    { label: 'Resume', detail: 'Career document', to: '/resume-workspace', icon: '▤' },
    { label: 'Profile', detail: 'Identity source', to: '/profile', icon: '◉' },
    { label: 'Public Portfolio', detail: 'Recruiter view', to: profile?.username && profile?.portfolioEnabled ? `/portfolio/${profile.username}` : '/profile', icon: '◇' },
    { label: 'Repositories', detail: profile?.githubUrl ? 'Project-only GitHub sync' : 'Connect GitHub', to: '/projects#github-sync', icon: '↻' },
  ].filter((item) => !isGuestMode || !['Goals', 'Profile', 'Repositories'].includes(item.label))
  return (
    <Reveal className="db-quick-access">
      <SectionHeading eyebrow="Navigate" title="Quick access" />
      <div className="db-quick-grid">
        {links.map((item, index) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduceMotion ? 0 : index * 0.025, duration: 0.24 }}>
            <Link to={item.to} className="db-quick-link">
              <span>{item.icon}</span>
              <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              <Icon name="arrow" size={14} />
            </Link>
          </motion.div>
        ))}
      </div>
    </Reveal>
  )
}

function DashboardPageContent({ getToken, user }) {
  const { isGuestMode, portfolio } = useGuestMode()
  const guestDashboard = useMemo(() => {
    if (!isGuestMode) return null
    const projects = portfolio.projects || []
    const skills = portfolio.skills || []
    const goals = portfolio.goals || []
    const certifications = portfolio.certifications || []
    const currentProject = projects.find((project) => project.featured) || projects.find((project) => project.status === 'BUILDING') || projects[0] || null
    const earned = certifications.filter((item) => item.status === 'earned').sort((left, right) => String(right.issueDate || right.year || '').localeCompare(String(left.issueDate || left.year || '')))[0]
    const learning = certifications.find((item) => item.status === 'in-progress')
    const planned = certifications.find((item) => item.status === 'planned')
    return {
      workspace: { profile: portfolio.profile, projects, skills, goals, certifications, resume: portfolio.resume },
      commandDeck: {
        currentProject,
        nextMilestone: goals.find((goal) => goal.status === 'current' || goal.status === 'future') || null,
        focusGoals: goals.filter((goal) => goal.status === 'current' || goal.status === 'future').slice(0, 3),
        credentialSpotlight: { earned, learning, planned },
        technologyBench: [...skills].sort((left, right) => Number(right.projectsBuilt || 0) - Number(left.projectsBuilt || 0)).slice(0, 8),
        recentWins: [
          ...projects.filter((project) => project.status === 'COMPLETED').slice(0, 2).map((project) => ({ id: `project-${project.id}`, type: 'project', title: `Completed ${project.title}`, href: '/projects', date: null })),
          ...certifications.filter((item) => item.status === 'earned').slice(0, 2).map((item) => ({ id: `credential-${item.id}`, type: 'credential', title: `Earned ${item.name}`, href: '/certifications', date: item.issueDate })),
        ].slice(0, 3),
        evidence: {
          projects: projects.length,
          technologies: skills.length,
          credentials: certifications.filter((item) => item.status === 'earned').length,
          activeGoals: goals.filter((goal) => goal.status === 'current').length,
          githubRepositories: projects.filter((project) => project.githubUrl).length,
          hasResume: Boolean(portfolio.resume?.uploaded),
        },
      },
    }
  }, [isGuestMode, portfolio])
  const [dashboard, setDashboard] = useState(() => guestDashboard)
  const [loading, setLoading] = useState(!isGuestMode)
  const [loadError, setLoadError] = useState('')
  const [highlightedTechnology, setHighlightedTechnology] = useState('')

  const refresh = useCallback(async () => {
    if (isGuestMode) return
    try {
      const payload = await authenticatedRequest('/api/dashboard', {}, getToken)
      setDashboard(payload || null)
      setLoadError('')
    } catch (error) {
      setLoadError(error.message || 'Unable to load your command deck.')
    } finally {
      setLoading(false)
    }
  }, [getToken, isGuestMode])

  useEffect(() => {
    if (isGuestMode) return undefined
    const timeoutId = window.setTimeout(() => refresh().catch(() => {}), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isGuestMode, refresh])

  useEffect(() => {
    if (isGuestMode) return undefined
    const intervalId = window.setInterval(() => refresh().catch(() => {}), 180_000)
    return () => window.clearInterval(intervalId)
  }, [isGuestMode, refresh])

  const profile = dashboard?.workspace?.profile || null
  const commandDeck = dashboard?.commandDeck || null
  const email = isGuestMode ? '' : user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''

  return (
    <div className="page-shell page-shell--wide db-page">
      <div className="db-ambient-bloom" aria-hidden="true" />

      {loading && !dashboard ? (
        <div className="db-loading" role="status" aria-live="polite">
          <span className="db-loading-line db-loading-line--wide" />
          <span className="db-loading-line" />
          <span className="sr-only">Loading developer workspace</span>
        </div>
      ) : null}
      {loadError ? (
        <div className="db-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={refresh}>Try again</button>
        </div>
      ) : null}

      {dashboard ? (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48 }} className="db-hero-grid">
            <IdentityHero profile={profile} email={email} commandDeck={commandDeck} />
            <StatusRail profile={profile} commandDeck={commandDeck} />
          </motion.div>

          <CurrentBuild project={commandDeck?.currentProject} highlightedTechnology={highlightedTechnology} />
          <EvidenceStrip evidence={commandDeck?.evidence} currentProject={commandDeck?.currentProject} />
          <TechnologyBench skills={commandDeck?.technologyBench || []} onHover={setHighlightedTechnology} />

          <Reveal className="db-support-grid">
            <FocusQueue goals={commandDeck?.focusGoals || []} profileFocus={profile?.currentFocus} />
            <RecentWins wins={commandDeck?.recentWins || []} />
            <CredentialSpotlight spotlight={commandDeck?.credentialSpotlight || {}} />
          </Reveal>

          <QuickAccess profile={profile} />
        </>
      ) : null}
    </div>
  )
}

function AuthenticatedDashboardPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  return <DashboardPageContent getToken={getToken} user={user} />
}

export function DashboardPage() {
  const { isGuestMode } = useGuestMode()
  return isGuestMode ? <DashboardPageContent getToken={async () => ''} user={null} /> : <AuthenticatedDashboardPage />
}
