import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DevVaultLogo } from '../components/branding/DevVaultLogo'
import { TechnologyLogo } from '../components/TechnologyLogo'
import { fetchPublicPortfolio, getPublicAppUrl } from '../lib/portfolioApi'
import { decorateProjectShowcase } from '../lib/projectShowcaseCatalog'
import '../guest-mode.css'

const MOTION = {
  fast: 0.16,
  normal: 0.24,
  slow: 0.42,
  ease: [0.2, 0.8, 0.2, 1],
}

const EXPERIENCE_LABELS = {
  BEGINNER: 'Learning',
  ADVANCED_BEGINNER: 'Developing',
  INTERMEDIATE: 'Comfortable',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
}

const STATUS_LABELS = { PLANNING: 'Planning', BUILDING: 'Building', COMPLETED: 'Completed', earned: 'Earned', 'in-progress': 'Currently learning' }

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

function ProjectActions({ project, vaultBase }) {
  return <div className="guest-project-actions"><Link to={`${vaultBase}/projects`}>Explore project <span>→</span></Link>{project.showcase.github ? <a href={project.showcase.github} target="_blank" rel="noreferrer">GitHub</a> : null}{project.showcase.demo ? <a href={project.showcase.demo} target="_blank" rel="noreferrer">Live demo</a> : null}</div>
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

function RecruiterProjectPoster({ project, technologies, vaultBase, index }) {
  return (
    <motion.div className="guest-project-grid-item" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07 }}>
      <Spotlight as="article" className="guest-project-poster">
        <div className="guest-project-poster-media">
          <ProjectVisual project={project} />
        </div>
        <div className="guest-project-poster-gradient" aria-hidden="true" />
        <div className="guest-project-poster-content">
          <span className="guest-status">{STATUS_LABELS[project.status] || project.status}</span>
          <h3><Link to={`${vaultBase}/projects`}>{project.title}</Link></h3>
          {technologies.length ? <div className="guest-chip-row">{technologies.map((technology) => <span key={technology}>{technology}</span>)}</div> : null}
          <div className="guest-project-poster-reveal">
            <p>{project.description}</p>
            <div className="guest-project-actions">
              <Link to={`${vaultBase}/projects`}>Explore project <span>→</span></Link>
              {project.showcase.github ? <a href={project.showcase.github} target="_blank" rel="noreferrer">GitHub <span>↗</span></a> : null}
            </div>
          </div>
        </div>
      </Spotlight>
    </motion.div>
  )
}

function UnlockTransition({ visible }) {
  const reduceMotion = useReducedMotion()
  return (
    <AnimatePresence>
      {visible ? <motion.div className="guest-unlock-transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.05 : MOTION.normal }}><motion.div className="guest-unlock-mark" initial={{ scale: reduceMotion ? 1 : 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: reduceMotion ? 0.05 : MOTION.slow, ease: MOTION.ease }}><span className="guest-unlock-ring" aria-hidden="true" /><DevVaultLogo compact size="xl" /><p>Guest access granted</p><small>Opening the read-only workspace</small></motion.div></motion.div> : null}
    </AnimatePresence>
  )
}

function CredentialCard({ certification }) {
  const earned = certification.status === 'earned'
  return <Spotlight as="article" className={`guest-credential ${earned ? 'is-earned' : 'is-learning'}`}><div><span className="guest-status">{STATUS_LABELS[certification.status]}</span><b>{certification.logo || (earned ? '◆' : '○')}</b></div><p>{certification.provider}</p><h3>{certification.name}</h3><small>{certification.issueDate || certification.year}</small>{earned && certification.verifyUrl ? <a href={certification.verifyUrl} target="_blank" rel="noreferrer">Verify credential →</a> : null}</Spotlight>
}

function RecruiterNavigation({ profile, vaultBase }) {
  return <header className="guest-nav-wrap"><nav className="guest-nav" aria-label="Recruiter overview navigation"><a href="#identity" className="guest-brand"><DevVaultLogo compact size="sm" /><span><strong>DevVault</strong><small>Guest access · Recruiter overview</small></span></a><div className="guest-nav-links"><a href="#work" className="guest-nav-link">Work</a><a href="#skills" className="guest-nav-link">Skills</a><a href="#credentials" className="guest-nav-link">Credentials</a><a href="#mindset" className="guest-nav-link">Mindset</a></div><div className="guest-nav-socials">{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="guest-social guest-social--github">GitHub</a> : null}<Link to={vaultBase} className="guest-button guest-button--primary">Unlock Vault</Link></div></nav></header>
}

function MinimalFooter({ profile, vaultBase }) {
  return <footer className="guest-footer guest-footer--minimal"><div><DevVaultLogo compact size="sm" /><span><strong>DevVault</strong><small>{profile.firstName} {profile.lastName}</small></span></div><div>{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : null}{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}<Link to={`${vaultBase}/resume`}>Resume</Link></div></footer>
}

function GuestOverview({ portfolio }) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [unlocking, setUnlocking] = useState(false)
  const { profile, skills, certifications, goals } = portfolio
  const vaultBase = `/portfolio/${encodeURIComponent(profile.username)}/vault`
  const projects = useMemo(() => sortProjects(portfolio.projects || []), [portfolio.projects])
  const featured = projects.find((project) => project.featured) || projects[0]
  const selected = projects.filter((project) => project.id !== featured?.id).slice(0, 4)
  const topSkills = [...skills].sort((a, b) => Number(b.projectsBuilt || 0) - Number(a.projectsBuilt || 0) || Number(b.yearsExperience || 0) - Number(a.yearsExperience || 0)).slice(0, 8)
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

  const unlock = () => {
    if (unlocking) return
    setUnlocking(true)
    window.setTimeout(() => navigate(vaultBase), reduceMotion ? 80 : 900)
  }

  return <div className="guest-mode guest-overview"><UnlockTransition visible={unlocking} /><RecruiterNavigation profile={profile} vaultBase={vaultBase} /><main className="guest-main">
    <Spotlight as="section" id="identity" className="guest-hero guest-spotlight">
      <div className="guest-hero-copy"><motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>Developer identity · Evidence first</motion.p><motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: MOTION.slow }}>{profile.firstName} {profile.lastName}</motion.h1><motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>{role}</motion.h2>{supportingTagline && supportingTagline !== role ? <motion.p className="guest-role-supporting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>{supportingTagline}</motion.p> : null}<motion.div className="guest-hero-facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}>{profile.major ? <span>{profile.major}</span> : null}{profile.school ? <span>{profile.school}</span> : null}{profile.location ? <span>{profile.location}</span> : null}</motion.div><motion.p className="guest-hero-summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>{publicNarrative(profile)}</motion.p><motion.div className="guest-hero-actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}><a href="#work" className="guest-button guest-button--primary">View projects <span>→</span></a><Link to={`${vaultBase}/resume`} className="guest-button guest-button--resume">Resume</Link>{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="guest-button guest-button--github">GitHub</a> : null}{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="guest-button guest-button--linkedin">LinkedIn</a> : null}</motion.div></div>
      <motion.div className="guest-portrait-wrap" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>{profile.profileImageUrl ? <img src={profile.profileImageUrl} alt={`${profile.firstName} ${profile.lastName}`} /> : <div>{profile.firstName?.[0]}{profile.lastName?.[0]}</div>}</motion.div>
    </Spotlight>

    <nav className="guest-evidence" aria-label="Recruiter snapshot"><a href="#work"><strong>{projects.length}</strong><span>Projects</span></a><a href="#skills"><strong>{skills.length}</strong><span>Technologies</span></a><a href="#credentials"><strong>{earned.length}</strong><span>Earned credentials</span></a><a href="#featured"><strong>{featured?.title || 'Building'}</strong><span>Current build</span></a></nav>

    {featured ? <Reveal id="featured" className="guest-section guest-featured"><SectionHeading eyebrow="Featured engineering work" title={featured.title} intro={featured.description} /><Spotlight className="guest-featured-grid"><Link to={`${vaultBase}/projects`} className="guest-featured-media"><ProjectVisual project={featured} eager /></Link><div className="guest-featured-copy"><span className="guest-status">{STATUS_LABELS[featured.status] || featured.status}</span><h3>Built as a real developer workspace—not a static portfolio.</h3><div className="guest-chip-row">{featured.showcase.techStack.map((tech) => <span key={tech}>{tech}</span>)}</div><ul>{featured.showcase.keyFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul><ProjectActions project={featured} vaultBase={vaultBase} /></div></Spotlight></Reveal> : null}

    <Reveal className="guest-section" id="experience"><SectionHeading eyebrow="Experience" title="Real-world direction" intro="Concrete facts from the current DevVault profile and workspace." /><Spotlight className="guest-experience"><div><span>Current role</span><h3>{role}</h3>{supportingTagline && supportingTagline !== role ? <p>{supportingTagline}</p> : null}</div>{experienceFacts.length ? <div className="guest-experience-evidence">{experienceFacts.map((fact) => <span key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong></span>)}</div> : null}</Spotlight></Reveal>

    <Reveal id="skills" className="guest-section"><SectionHeading eyebrow="Technical foundation" title="Tools behind the work" intro="Experience and relationships come directly from the Skills workspace." action={<Link to={`${vaultBase}/skills`} className="guest-text-link">Explore the real Skills page →</Link>} /><div className="guest-tech-grid">{topSkills.map((skill, index) => <motion.div key={skill.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.055 }}><Link to={`${vaultBase}/skills?technology=${encodeURIComponent(skill.name)}`} className="guest-tech"><TechnologyLogo name={skill.name} technologyKey={skill.technologyKey} /><span><strong>{skill.name}</strong><small>{EXPERIENCE_LABELS[skill.experienceLevel]} · {skill.projectsBuilt || 0} projects</small><em>{skill.relatedProjects?.length ? `Used in: ${skill.relatedProjects.slice(0, 2).map((project) => project.title).join(' · ')}` : 'Ready for a project'}</em></span></Link></motion.div>)}</div></Reveal>

    {selected.length ? <Reveal id="work" className="guest-section"><SectionHeading eyebrow="Selected work" title="More engineering projects" intro="A quick look at the projects behind the work." action={<Link to={`${vaultBase}/projects`} className="guest-text-link">Open the real Projects page →</Link>} /><div className="guest-project-grid">{selected.map((project, index) => <RecruiterProjectPoster key={project.id} project={project} technologies={getCanonicalProjectTechnologies(project, skills)} vaultBase={vaultBase} index={index} />)}</div></Reveal> : null}

    <Reveal id="credentials" className="guest-section"><SectionHeading eyebrow="Credentials" title="Proof of continued learning" intro="Earned credentials are distinct from the one active learning path shown here." action={<Link to={`${vaultBase}/certifications`} className="guest-text-link">Open the real Certifications page →</Link>} /><div className="guest-credential-spotlight">{earned.slice(0, 2).map((cert) => <CredentialCard key={cert.id} certification={cert} />)}{learning ? <CredentialCard certification={learning} /> : null}</div></Reveal>

    <Reveal id="mindset" className="guest-section"><SectionHeading eyebrow="Developer mindset" title="Build, learn, refine" intro={publicNarrative(profile)} /><div className="guest-principles"><Spotlight as="span"><i>01</i><strong>Build real things</strong><small>Projects turn learning into evidence.</small></Spotlight><Spotlight as="span"><i>02</i><strong>Keep improving</strong><small>Every iteration should become clearer.</small></Spotlight><Spotlight as="span"><i>03</i><strong>Details matter</strong><small>Reliable software should feel thoughtful.</small></Spotlight></div></Reveal>

    {(profile.interests?.length || learning || goals?.length) ? <Reveal className="guest-section"><SectionHeading eyebrow="Current interests" title="Currently exploring" /><div className="guest-exploring">{(profile.interests || []).slice(0, 5).map((interest) => <span key={interest}>{interest}</span>)}{learning ? <span className="is-learning">Learning · {learning.name}</span> : null}{goals.slice(0, 2).map((goal) => <span key={goal.id}>{goal.title}</span>)}</div></Reveal> : null}

    <Reveal className="guest-unlock-stage"><Spotlight className="guest-unlock-card"><div className="guest-unlock-shield"><span aria-hidden="true" /><DevVaultLogo compact size="xl" /></div><p>Thanks for visiting the Vault</p><h2>Want to see how DevVault actually works?</h2><span>You’ve seen the highlights. Now explore the full workspace in Guest Mode.<br />No editing. No account access. Just the Vault.</span><button type="button" onClick={unlock} className="guest-unlock-button">Unlock the Vault <b>→</b></button><div className="guest-unlock-actions">{portfolio.resume?.uploaded ? <Link to={`${vaultBase}/resume`}>Resume</Link> : null}{profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : null}{profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}</div></Spotlight></Reveal>
  </main><MinimalFooter profile={profile} vaultBase={vaultBase} /></div>
}

function GuestState({ title, message, retry }) {
  return <div className="guest-state"><DevVaultLogo compact size="lg" /><p>Guest access</p><h1>{title}</h1><span>{message}</span>{retry ? <button type="button" onClick={retry} className="guest-button guest-button--primary">Try again</button> : null}</div>
}

export function GuestModePage() {
  const { username } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchPublicPortfolio(username).then((data) => { if (!cancelled) { setPortfolio(data); setError('') } }).catch((requestError) => { if (!cancelled) setError(requestError.message || 'Unable to open this Vault.') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadKey, username])

  useEffect(() => {
    if (!portfolio?.profile) return
    const profile = portfolio.profile
    const description = profile.tagline || publicNarrative(profile)
    document.title = `${profile.firstName} ${profile.lastName} — Developer Portfolio | DevVault`
    const setMeta = (selector, attribute, value) => {
      let element = document.head.querySelector(selector)
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, value); document.head.appendChild(element) }
      element.setAttribute('content', description)
    }
    setMeta('meta[name="description"]', 'name', 'description')
    setMeta('meta[property="og:description"]', 'property', 'og:description')
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = `${getPublicAppUrl()}/portfolio/${profile.username}`
  }, [portfolio])

  if (loading && !portfolio) return <GuestState title="Opening the Vault" message="Preparing recruiter access…" />
  if (error || !portfolio?.profile) return <GuestState title="Vault unavailable" message={error || 'This portfolio is not currently available.'} retry={() => { setLoading(true); setError(''); setReloadKey((value) => value + 1) }} />
  return <GuestOverview portfolio={portfolio} />
}
