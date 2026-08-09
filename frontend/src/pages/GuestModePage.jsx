import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DevVaultLogo } from '../components/branding/DevVaultLogo'
import { TechnologyLogo } from '../components/TechnologyLogo'
import { fetchPublicPortfolio, getPublicAppUrl } from '../lib/portfolioApi'
import { decorateProjectShowcase } from '../lib/projectShowcaseCatalog'
import { getSkillLevelMeta } from '../lib/skillUtils'
import '../guest-mode.css'

const MOTION = {
  fast: 0.16,
  normal: 0.24,
  slow: 0.42,
  ease: [0.2, 0.8, 0.2, 1],
}

const STATUS_LABELS = { PLANNING: 'Planning', BUILDING: 'Building', COMPLETED: 'Completed', earned: 'Earned', 'in-progress': 'Currently learning' }
const DEVVAULT_FEATURED_TECHNOLOGIES = ['React', 'Node.js', 'Express.js', 'PostgreSQL', 'Prisma', 'Clerk']
const DEVVAULT_FEATURED_POINTS = [
  'Projects, skills, certifications, and career growth in one place',
  'Live GitHub-connected project tracking',
  'Built to evolve with every project I ship',
]

function publicNarrative(profile) {
  const bio = String(profile?.bio || '').trim()
  if (bio && !/high school student/i.test(bio)) return bio
  const education = [profile?.major, profile?.school].filter(Boolean).join(' at ')
  const interests = (profile?.interests || []).slice(0, 3).join(', ')
  return [education ? `${education}.` : '', interests ? `Focused on ${interests}.` : ''].filter(Boolean).join(' ')
}

function profileRole(profile) {
  return String(profile?.currentRole || '').trim()
    || String(profile?.tagline || '').split('|').map((part) => part.trim()).find(Boolean)
    || 'Developer'
}

function sortProjects(projects) {
  return [...projects].map(decorateProjectShowcase).sort((a, b) => Number(b.featured) - Number(a.featured) || a.showcase.order - b.showcase.order)
}

function Spotlight({ as: Element = 'div', children, className = '', ...props }) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType === 'touch' || !ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--guest-x', `${event.clientX - bounds.left}px`)
    ref.current.style.setProperty('--guest-y', `${event.clientY - bounds.top}px`)
  }
  return <Element ref={ref} onPointerMove={handlePointerMove} className={`guest-pointer-light ${className}`.trim()} {...props}>{children}</Element>
}

function Reveal({ children, className = '', delay = 0, id }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section id={id} className={className} initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: reduceMotion ? 0.1 : MOTION.slow, delay: reduceMotion ? 0 : delay, ease: MOTION.ease }}>
      {children}
    </motion.section>
  )
}

function SectionHeading({ eyebrow, title, intro, action }) {
  return <div className="guest-section-heading"><div><p>{eyebrow}</p><h2>{title}</h2>{intro ? <span>{intro}</span> : null}</div>{action}</div>
}

function ProjectVisual({ project, eager = false }) {
  return <img src={project.showcase.image} alt={`${project.title} project artwork`} loading={eager ? 'eager' : 'lazy'} />
}

function DevVaultSignatureArtwork({ project }) {
  const reduceMotion = useReducedMotion()
  const artworkRef = useRef(null)
  const scanTimerRef = useRef(null)
  const scanFrameRef = useRef(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => () => {
    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current)
    if (scanFrameRef.current) window.cancelAnimationFrame(scanFrameRef.current)
  }, [])

  const handlePointerMove = (event) => {
    if (reduceMotion || event.pointerType === 'touch' || !artworkRef.current) return
    const bounds = artworkRef.current.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    const y = (event.clientY - bounds.top) / bounds.height
    artworkRef.current.style.setProperty('--signature-light-x', `${x * 100}%`)
    artworkRef.current.style.setProperty('--signature-light-y', `${y * 100}%`)
    artworkRef.current.style.setProperty('--signature-rotate-x', `${(0.5 - y) * 1.7}deg`)
    artworkRef.current.style.setProperty('--signature-rotate-y', `${(x - 0.5) * 2.2}deg`)
  }

  const resetPointer = () => {
    if (!artworkRef.current) return
    artworkRef.current.style.setProperty('--signature-light-x', '50%')
    artworkRef.current.style.setProperty('--signature-light-y', '46%')
    artworkRef.current.style.setProperty('--signature-rotate-x', '0deg')
    artworkRef.current.style.setProperty('--signature-rotate-y', '0deg')
  }

  const scan = () => {
    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current)
    if (scanFrameRef.current) window.cancelAnimationFrame(scanFrameRef.current)
    setScanning(false)
    scanFrameRef.current = window.requestAnimationFrame(() => {
      scanFrameRef.current = window.requestAnimationFrame(() => {
        setScanning(true)
        scanTimerRef.current = window.setTimeout(() => setScanning(false), reduceMotion ? 360 : 1380)
      })
    })
  }

  return (
    <button
      ref={artworkRef}
      type="button"
      className={`guest-featured-media guest-signature-artwork ${scanning ? 'is-scanning' : ''}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      onClick={scan}
      aria-label="Run the DevVault system scan"
    >
      <ProjectVisual project={project} eager />
      <span className="guest-signature-cursor-light" aria-hidden="true" />
      <svg className="guest-signature-system" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path className="guest-signature-shield-aura" d="M810 170L610 260V430C610 578 690 676 810 730C930 676 1010 578 1010 430V260L810 170Z" />
        <path className="guest-signature-signal" pathLength="1" d="M640 315H740L810 385H965" />
        <circle className="guest-signature-ring" cx="810" cy="440" r="302" />
        <rect className="guest-signature-bars-mask" x="190" y="682" width="1040" height="76" rx="20" />
        <g className="guest-signature-bars-base">
          <rect x="339" y="695" width="180" height="50" rx="16" />
          <rect x="553" y="695" width="240" height="50" rx="16" />
          <rect x="827" y="695" width="240" height="50" rx="16" />
          <rect x="1101" y="695" width="180" height="50" rx="16" />
        </g>
        <g className="guest-signature-bars">
          <rect style={{ '--signature-bar': 0 }} x="339" y="695" width="180" height="50" rx="16" />
          <rect style={{ '--signature-bar': 1 }} x="553" y="695" width="240" height="50" rx="16" />
          <rect style={{ '--signature-bar': 2 }} x="827" y="695" width="240" height="50" rx="16" />
          <rect style={{ '--signature-bar': 3 }} x="1101" y="695" width="180" height="50" rx="16" />
        </g>
      </svg>
      <span className="guest-signature-status" role="status" aria-live="polite">{scanning ? 'DevVault // System online' : ''}</span>
    </button>
  )
}

function ProjectActions({ project }) {
  if (!project.showcase.github && !project.showcase.demo) return null
  return <div className="guest-project-actions">{project.showcase.github ? <a href={project.showcase.github} target="_blank" rel="noreferrer">GitHub <span>↗</span></a> : null}{project.showcase.demo ? <a href={project.showcase.demo} target="_blank" rel="noreferrer">Live demo <span>↗</span></a> : null}</div>
}

function normalizeTechnologyName(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function getCanonicalProjectTechnologies(project, skills) {
  const projectTechnologies = Array.isArray(project.techStack) ? project.techStack.filter(Boolean) : []
  const relatedTechnologies = skills
    .filter((skill) => skill.relatedProjects?.some((relatedProject) => Number(relatedProject.id) === Number(project.id)))
    .map((skill) => skill.name)
    .filter(Boolean)
  const relatedKeys = new Set(relatedTechnologies.map(normalizeTechnologyName))
  const confirmed = projectTechnologies.filter((technology) => relatedKeys.has(normalizeTechnologyName(technology)))
  return [...new Set(confirmed.length ? confirmed : (projectTechnologies.length ? projectTechnologies : relatedTechnologies))].slice(0, 4)
}

function RecruiterProjectPoster({ project, technologies, index }) {
  return (
    <motion.div className="guest-project-grid-item" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07 }}>
      <Spotlight as="article" className="guest-project-poster">
        <div className="guest-project-poster-media">
          <ProjectVisual project={project} />
        </div>
        <div className="guest-project-poster-gradient" aria-hidden="true" />
        <div className="guest-project-poster-content">
          <span className="guest-status">{STATUS_LABELS[project.status] || project.status}</span>
          <h3>{project.title}</h3>
          {technologies.length ? <div className="guest-chip-row">{technologies.map((technology) => <span key={technology}>{technology}</span>)}</div> : null}
          <div className="guest-project-poster-reveal">
            <p>{project.description}</p>
            <div className="guest-project-actions">
              {project.showcase.github ? <a href={project.showcase.github} target="_blank" rel="noreferrer">GitHub <span>↗</span></a> : null}
              {project.showcase.demo ? <a href={project.showcase.demo} target="_blank" rel="noreferrer">Live demo <span>↗</span></a> : null}
            </div>
          </div>
        </div>
      </Spotlight>
    </motion.div>
  )
}

const UNLOCK_TRAIL_PARTICLES = Array.from({ length: 8 }, (_, index) => index)
const UNLOCK_SCATTER_PARTICLES = [
  [-72, -54], [-26, -88], [38, -82], [78, -36], [88, 24],
  [52, 72], [-8, 92], [-66, 58], [-94, 4], [14, -60],
]
const ECOSYSTEM_PARTICLES = [
  [11, 18, 2], [23, 71, 1], [35, 28, 2], [46, 84, 1], [58, 12, 1], [68, 68, 2],
  [79, 24, 1], [88, 77, 2], [16, 46, 1], [41, 57, 1], [63, 39, 1], [92, 48, 1],
]

function UnlockTransition({ visible }) {
  const reduceMotion = useReducedMotion()
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    if (!visible) return undefined
    const timer = window.setTimeout(() => setUnlocked(true), reduceMotion ? 80 : 1320)
    return () => window.clearTimeout(timer)
  }, [reduceMotion, visible])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className={`guest-unlock-transition ${unlocked ? 'is-unlocked' : ''}`.trim()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.08 : MOTION.normal }}
          role="status"
          aria-live="polite"
        >
          <div className="guest-unlock-vignette" aria-hidden="true" />
          <div className="guest-unlock-portal" aria-hidden="true" />
          <motion.div className="guest-unlock-mark" initial={{ scale: reduceMotion ? 1 : 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: reduceMotion ? 0.08 : 0.48, ease: MOTION.ease }}>
            <div className="guest-unlock-mechanism" aria-hidden="true">
              <span className="guest-unlock-orbit guest-unlock-orbit--outer" />
              <span className="guest-unlock-orbit guest-unlock-orbit--inner" />
              <span className="guest-unlock-wave guest-unlock-wave--one" />
              <span className="guest-unlock-wave guest-unlock-wave--two" />
              <div className="guest-unlock-shield-core">
                <DevVaultLogo compact size="xl" />
                <span className="guest-unlock-contact-flash" />
                <svg className="guest-unlock-logo-signal" viewBox="0 0 96 96">
                  <path pathLength="1" d="M22 30h16l10 10h26" />
                </svg>
              </div>
              <div className="guest-unlock-key-trail">
                {UNLOCK_TRAIL_PARTICLES.map((particle) => <span key={particle} style={{ '--unlock-particle-index': particle }} />)}
              </div>
              <div className="guest-unlock-key">
                <svg viewBox="0 0 140 48" role="img" aria-label="Glowing key unlocking DevVault">
                  <circle cx="22" cy="24" r="12" />
                  <circle cx="22" cy="24" r="5" />
                  <path d="M34 24h82m-30 0v10m15-10v7m15-7 11-6v12Z" />
                </svg>
              </div>
              <div className="guest-unlock-scatter">
                {UNLOCK_SCATTER_PARTICLES.map(([x, y], index) => <span key={`${x}-${y}`} style={{ '--scatter-x': `${x}px`, '--scatter-y': `${y}px`, '--scatter-index': index }} />)}
              </div>
            </div>
            <div className={`guest-unlock-copy ${unlocked ? 'is-unlocked' : ''}`.trim()}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={unlocked ? 'unlocked' : 'unlocking'} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: reduceMotion ? 0.06 : 0.18 }}>
                  {unlocked ? 'Vault unlocked' : 'Unlocking DevVault'}
                </motion.p>
              </AnimatePresence>
              <small>Opening the workspace</small>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function CredentialCard({ certification }) {
  const earned = certification.status === 'earned'
  return <Spotlight as="article" className={`guest-credential ${earned ? 'is-earned' : 'is-learning'}`}><div><span className="guest-status">{STATUS_LABELS[certification.status]}</span><b>{certification.logo || (earned ? '◆' : '○')}</b></div><p>{certification.provider}</p><h3>{certification.name}</h3><small>{certification.issueDate || certification.year}</small>{earned && certification.verifyUrl ? <a href={certification.verifyUrl} target="_blank" rel="noreferrer">Verify credential →</a> : null}</Spotlight>
}

function experienceSnapshot(profile) {
  const taglineRole = String(profile.tagline || '').split('|').map((part) => part.trim()).find((part) => part.includes('@'))
  if (taglineRole) {
    const [title, organization] = taglineRole.split(/\s+@\s+/, 2)
    return { value: title || profileRole(profile), detail: organization || profile.school || profile.location }
  }
  return { value: profileRole(profile), detail: profile.school || profile.location || 'Current experience' }
}

function DeveloperEcosystemOrbit({ profile, projects, skills, earned, learning, featured }) {
  const reduceMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const experience = experienceSnapshot(profile)
  const latestEarned = [...earned].sort((left, right) => new Date(right.issueDate || 0) - new Date(left.issueDate || 0))[0]
  const githubProjects = projects.filter((project) => project.githubUrl)
  const preferredSkillNames = [profile.favoriteLanguage, profile.favoriteFramework].filter(Boolean)
  const featuredSkills = [...skills.filter((skill) => skill.favorite), ...preferredSkillNames
    .map((name) => skills.find((skill) => normalizeTechnologyName(skill.name) === normalizeTechnologyName(name)))
    .filter(Boolean)]
    .filter((skill, index, list) => list.findIndex((candidate) => candidate.id === skill.id) === index)
  const skillNames = [...featuredSkills, ...skills.filter((skill) => !featuredSkills.some((featuredSkill) => featuredSkill.id === skill.id))].slice(0, 3).map((skill) => skill.name).join(' · ')
  const experienceArea = experience.value.replace(/\s+Intern$/i, '')
  const nodes = [
    { id: 'projects', icon: '◫', label: 'Projects', value: `Current build: ${featured?.title || 'In progress'}`, detail: `${projects.length} projects`, target: '#work' },
    { id: 'skills', icon: '◇', label: 'Skills', value: 'Core stack', detail: skillNames || `${skills.length} tracked technologies`, target: '#skills' },
    { id: 'experience', icon: '✦', label: 'Experience', value: experienceArea, detail: experience.detail, target: '#experience' },
    { id: 'credentials', icon: '◆', label: 'Credentials', value: `${earned.length} earned`, detail: latestEarned ? `Latest: ${latestEarned.name}` : 'Learning evidence', target: '#credentials' },
    { id: 'learning', icon: '◌', label: 'Current Learning', value: learning?.name || profile.interests?.[0] || featured?.title, detail: learning ? '' : 'Current focus', target: '#exploring' },
    { id: 'github', icon: '↗', label: 'GitHub', value: 'Development Activity', detail: `${githubProjects.length} linked ${githubProjects.length === 1 ? 'repository' : 'repositories'}`, href: profile.githubUrl },
  ]

  const openSection = (target) => {
    document.querySelector(target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  const togglePaused = () => setPaused((current) => !current)
  const handlePauseKeyDown = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
      event.preventDefault()
      togglePaused()
    }
  }

  return (
    <Reveal className="guest-section guest-ecosystem-section">
      <SectionHeading eyebrow="Developer ecosystem" title="The system behind the work" intro="Projects, skills, experience, learning, and credentials—all connected in one workspace." />
      <Spotlight className={`guest-ecosystem-stage ${paused ? 'is-paused' : ''}`.trim()}>
        <div className="guest-ecosystem-atmosphere" aria-hidden="true">
          {ECOSYSTEM_PARTICLES.map(([x, y, size], index) => <span key={`${x}-${y}`} style={{ '--ecosystem-x': `${x}%`, '--ecosystem-y': `${y}%`, '--ecosystem-size': `${size}px`, '--ecosystem-delay': `${index * -0.7}s` }} />)}
        </div>
        <div className="guest-ecosystem-center">
          <span className="guest-ecosystem-center-glow" aria-hidden="true" />
          <span className="guest-ecosystem-center-ring guest-ecosystem-center-ring--outer" aria-hidden="true" />
          <span className="guest-ecosystem-center-ring guest-ecosystem-center-ring--inner" aria-hidden="true" />
          <button type="button" className="guest-ecosystem-logo" onClick={togglePaused} onKeyDown={handlePauseKeyDown} disabled={reduceMotion} aria-pressed={paused} aria-label={reduceMotion ? 'Developer ecosystem animation disabled by reduced motion preference' : paused ? 'Resume developer ecosystem' : 'Pause developer ecosystem'}><DevVaultLogo compact size="xl" /></button>
          <div className="guest-ecosystem-center-copy"><strong>DevVault</strong><span>{paused ? 'Paused' : 'Connected workspace'}</span></div>
        </div>
        <div className="guest-ecosystem-ring">
          {nodes.map((node, index) => {
            const card = <><span className="guest-ecosystem-node-top"><i>{node.icon}</i><small>{node.label}</small></span><strong>{node.value}</strong><span className="guest-ecosystem-node-detail">{node.detail}</span><em>{node.href ? 'Open GitHub ↗' : 'View section →'}</em></>
            return (
              <div key={node.id} className={`guest-ecosystem-node guest-ecosystem-node--${node.id}`} style={{ '--ecosystem-angle': `${index * 60}deg`, '--ecosystem-index': index }}>
                <span className="guest-ecosystem-connection" aria-hidden="true" />
                <span className="guest-ecosystem-node-anchor">
                  {node.href ? <a href={node.href} target="_blank" rel="noreferrer" className="guest-ecosystem-card" aria-label={`Open ${profile.firstName}'s GitHub profile`}>{card}</a> : <button type="button" className="guest-ecosystem-card" onClick={() => openSection(node.target)} aria-label={`View ${node.label} section`}>{card}</button>}
                </span>
              </div>
            )
          })}
        </div>
      </Spotlight>
    </Reveal>
  )
}

function RecruiterNavigation({ profile, onUnlock }) {
  return <header className="guest-nav-wrap"><nav className="guest-nav" aria-label="Recruiter overview navigation"><a href="#identity" className="guest-brand"><DevVaultLogo compact size="sm" /><span><strong>DevVault</strong><small>Guest access · Recruiter overview</small></span></a><div className="guest-nav-links"><a href="#work" className="guest-nav-link">Work</a><a href="#skills" className="guest-nav-link">Skills</a><a href="#credentials" className="guest-nav-link">Credentials</a><a href="#mindset" className="guest-nav-link">Mindset</a></div><div className="guest-nav-socials">{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="guest-social guest-social--github">GitHub</a> : null}<button type="button" onClick={onUnlock} className="guest-button guest-button--primary">Unlock Vault</button></div></nav></header>
}

function MinimalFooter({ profile }) {
  return <footer className="guest-footer guest-footer--minimal"><div><DevVaultLogo compact size="sm" /><span><strong>DevVault</strong><small>{profile.firstName} {profile.lastName}</small></span></div><div>{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : null}{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}</div></footer>
}

function GuestOverview({ portfolio }) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [unlocking, setUnlocking] = useState(false)
  const unlockTimerRef = useRef(null)
  const { profile, skills, certifications, goals } = portfolio
  const vaultBase = `/portfolio/${encodeURIComponent(profile.username)}/vault`
  const projects = useMemo(() => sortProjects(portfolio.projects || []), [portfolio.projects])
  const featured = projects.find((project) => project.featured) || projects[0]
  const featuredIsDevVault = normalizeTechnologyName(featured?.title).includes('devvault')
  const selected = projects.filter((project) => project.id !== featured?.id).slice(0, 4)
  const rankedSkills = [...skills].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || Number(b.projectsBuilt || 0) - Number(a.projectsBuilt || 0) || Number(b.yearsExperience || 0) - Number(a.yearsExperience || 0))
  const topSkills = rankedSkills.slice(0, 8)
  const earned = certifications.filter((item) => item.status === 'earned')
  const learning = certifications.find((item) => item.status === 'in-progress')
  const role = profileRole(profile)
  const supportingTagline = String(profile.tagline || '').trim()
  const experienceFacts = [
    profile.school ? { label: 'Education', value: [profile.major, profile.school].filter(Boolean).join(' · ') } : null,
    featured?.title ? { label: 'Current build', value: featured.title } : null,
    learning?.name ? { label: 'Current learning', value: learning.name } : null,
    Number(profile.yearsCoding) > 0 ? { label: 'Experience', value: `${profile.yearsCoding} years coding` } : null,
  ].filter(Boolean)

  useEffect(() => () => {
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current)
  }, [])

  const unlock = () => {
    if (unlocking) return
    setUnlocking(true)
    unlockTimerRef.current = window.setTimeout(() => {
      const openVault = () => navigate(vaultBase)
      if (!reduceMotion && typeof document.startViewTransition === 'function') {
        document.documentElement.classList.add('guest-vault-transitioning')
        const transition = document.startViewTransition(openVault)
        transition.finished.finally(() => document.documentElement.classList.remove('guest-vault-transitioning'))
      } else {
        openVault()
      }
    }, reduceMotion ? 240 : 2050)
  }

  return <div className="guest-mode guest-overview"><UnlockTransition visible={unlocking} /><RecruiterNavigation profile={profile} onUnlock={unlock} /><main id="main-content" className="guest-main">
    <Spotlight as="section" id="identity" className="guest-hero guest-spotlight">
      <div className="guest-hero-copy"><motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>Developer identity · Evidence first</motion.p><motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: MOTION.slow }}>{profile.firstName} {profile.lastName}</motion.h1><motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>{role}</motion.h2>{supportingTagline && supportingTagline !== role ? <motion.p className="guest-role-supporting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>{supportingTagline}</motion.p> : null}<motion.div className="guest-hero-facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}>{profile.major ? <span>{profile.major}</span> : null}{profile.school ? <span>{profile.school}</span> : null}{profile.location ? <span>{profile.location}</span> : null}</motion.div><motion.p className="guest-hero-summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>{publicNarrative(profile)}</motion.p><motion.div className="guest-hero-actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}><a href="#work" className="guest-button guest-button--primary">View projects <span>→</span></a>{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="guest-button guest-button--github">GitHub</a> : null}{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="guest-button guest-button--linkedin">LinkedIn</a> : null}</motion.div></div>
      <motion.div className="guest-portrait-wrap" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>{profile.profileImageUrl ? <img src={profile.profileImageUrl} alt={`${profile.firstName} ${profile.lastName}`} /> : <div>{profile.firstName?.[0]}{profile.lastName?.[0]}</div>}</motion.div>
    </Spotlight>

    <nav className="guest-evidence" aria-label="Recruiter snapshot"><a href="#work"><strong>{projects.length}</strong><span>Projects</span></a><a href="#skills"><strong>{skills.length}</strong><span>Technologies</span></a><a href="#credentials"><strong>{earned.length}</strong><span>Earned credentials</span></a><a href="#featured"><strong>{featured?.title || 'Building'}</strong><span>Current build</span></a></nav>

    {featured ? <Reveal id="featured" className="guest-section guest-featured"><SectionHeading eyebrow="Featured engineering work" title={featured.title} intro={featured.description} /><Spotlight className="guest-featured-grid">{featuredIsDevVault ? <DevVaultSignatureArtwork project={featured} /> : <div className="guest-featured-media"><ProjectVisual project={featured} eager /></div>}<div className="guest-featured-copy"><span className="guest-status">{featuredIsDevVault ? 'Building' : (STATUS_LABELS[featured.status] || featured.status)}</span><h3>{featuredIsDevVault ? 'A personal developer operating system built to organize, showcase, and grow my work.' : 'Built as a real developer workspace—not a static portfolio.'}</h3><div className="guest-chip-row">{(featuredIsDevVault ? DEVVAULT_FEATURED_TECHNOLOGIES : featured.showcase.techStack).map((tech) => <span key={tech}>{tech}</span>)}</div><ul>{(featuredIsDevVault ? DEVVAULT_FEATURED_POINTS : featured.showcase.keyFeatures).map((feature) => <li key={feature}>{feature}</li>)}</ul><ProjectActions project={featured} /></div></Spotlight></Reveal> : null}

    <Reveal className="guest-section" id="experience"><SectionHeading eyebrow="Experience" title="Real-world direction" intro="Concrete facts from the current DevVault profile and workspace." /><Spotlight className="guest-experience"><div><span>Current role</span><h3>{role}</h3>{supportingTagline && supportingTagline !== role ? <p>{supportingTagline}</p> : null}</div>{experienceFacts.length ? <div className="guest-experience-evidence">{experienceFacts.map((fact) => <span key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong></span>)}</div> : null}</Spotlight></Reveal>

    <DeveloperEcosystemOrbit profile={profile} projects={projects} skills={rankedSkills} earned={earned} learning={learning} featured={featured} />

    <Reveal id="skills" className="guest-section"><SectionHeading eyebrow="Technical foundation" title="Tools behind the work" intro="Experience and relationships come directly from the Skills workspace." /><div className="guest-tech-grid">{topSkills.map((skill, index) => <motion.div key={skill.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.055 }}><Spotlight as="article" className="guest-tech" tabIndex="0"><TechnologyLogo name={skill.name} technologyKey={skill.technologyKey} /><span><strong>{skill.name}</strong><small>{getSkillLevelMeta(skill.experienceLevel).label} · {skill.projectsBuilt || 0} projects</small><em>{skill.relatedProjects?.length ? `Used in: ${skill.relatedProjects.slice(0, 2).map((project) => project.title).join(' · ')}` : 'Ready for a project'}</em></span></Spotlight></motion.div>)}</div></Reveal>

    {selected.length ? <Reveal id="work" className="guest-section"><SectionHeading eyebrow="Selected work" title="More engineering projects" intro="A quick look at the projects behind the work." /><div className="guest-project-grid">{selected.map((project, index) => <RecruiterProjectPoster key={project.id} project={project} technologies={getCanonicalProjectTechnologies(project, skills)} index={index} />)}</div></Reveal> : null}

    <Reveal id="credentials" className="guest-section"><SectionHeading eyebrow="Credentials" title="Proof of continued learning" intro="Earned credentials are distinct from the one active learning path shown here." /><div className="guest-credential-spotlight">{earned.slice(0, 2).map((cert) => <CredentialCard key={cert.id} certification={cert} />)}{learning ? <CredentialCard certification={learning} /> : null}</div></Reveal>

    <Reveal id="mindset" className="guest-section"><SectionHeading eyebrow="Developer mindset" title="Build, learn, refine" intro={publicNarrative(profile)} /><div className="guest-principles"><Spotlight as="span"><i>01</i><strong>Build real things</strong><small>Projects turn learning into evidence.</small></Spotlight><Spotlight as="span"><i>02</i><strong>Keep improving</strong><small>Every iteration should become clearer.</small></Spotlight><Spotlight as="span"><i>03</i><strong>Details matter</strong><small>Reliable software should feel thoughtful.</small></Spotlight></div></Reveal>

    {(profile.interests?.length || learning || goals?.length) ? <Reveal id="exploring" className="guest-section"><SectionHeading eyebrow="Current interests" title="Currently exploring" /><div className="guest-exploring">{(profile.interests || []).slice(0, 5).map((interest) => <span key={interest}>{interest}</span>)}{learning ? <span className="is-learning">Learning · {learning.name}</span> : null}{goals.slice(0, 2).map((goal) => <span key={goal.id}>{goal.title}</span>)}</div></Reveal> : null}

    <Reveal className="guest-unlock-stage"><Spotlight className="guest-unlock-card"><div className="guest-unlock-shield"><span aria-hidden="true" /><DevVaultLogo compact size="xl" /></div><p>Thanks for visiting the Vault</p><h2>You’ve seen the highlights. Now see what’s behind them.</h2><span>Explore the workspace where my projects, skills, and progress come together.</span><button type="button" onClick={unlock} className="guest-unlock-button">Unlock the Vault <b>→</b></button><div className="guest-unlock-actions">{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : null}{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}</div></Spotlight></Reveal>
  </main><MinimalFooter profile={profile} /></div>
}

function GuestState({ title, message, retry }) {
  return <div className="guest-state"><DevVaultLogo compact size="lg" /><p>Guest access</p><h1>{title}</h1><span>{message}</span>{retry ? <button type="button" onClick={retry} className="guest-button guest-button--primary">Try again</button> : null}</div>
}

export function GuestModePage() {
  const { username } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchPublicPortfolio(username, { force: reloadKey > 0 }).then((data) => { if (!cancelled) { setPortfolio(data); setError(null) } }).catch((requestError) => { if (!cancelled) setError(requestError || new Error('Unable to open this Vault.')) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadKey, username])

  useEffect(() => {
    if (!portfolio?.profile) return
    const profile = portfolio.profile
    const description = profile.tagline || publicNarrative(profile)
    document.title = `${profile.firstName} ${profile.lastName} — Developer Portfolio | DevVault`
    const setMeta = (selector, attribute, value, content = description) => {
      let element = document.head.querySelector(selector)
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, value); document.head.appendChild(element) }
      element.setAttribute('content', content)
    }
    setMeta('meta[name="description"]', 'name', 'description')
    setMeta('meta[property="og:description"]', 'property', 'og:description')
    setMeta('meta[property="og:title"]', 'property', 'og:title', `${profile.firstName} ${profile.lastName} | Software Engineering Portfolio`)
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMeta('meta[property="og:url"]', 'property', 'og:url', `${getPublicAppUrl()}/portfolio/${profile.username}`)
    if (profile.profileImageUrl) setMeta('meta[property="og:image"]', 'property', 'og:image', profile.profileImageUrl)
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', profile.profileImageUrl ? 'summary_large_image' : 'summary')
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = `${getPublicAppUrl()}/portfolio/${profile.username}`
  }, [portfolio])

  if (loading && !portfolio) return <GuestState title="Opening the Vault" message="Preparing recruiter access…" />
  if (error || !portfolio?.profile) return <GuestState title={error?.status === 404 ? 'Portfolio not found' : 'Vault unavailable'} message={error?.message || 'This portfolio is not currently available.'} retry={() => { setLoading(true); setError(null); setReloadKey((value) => value + 1) }} />
  return <GuestOverview portfolio={portfolio} />
}
