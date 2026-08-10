import { useAuth } from '@clerk/clerk-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DevVaultLogo } from '../components/branding/DevVaultLogo'
import { VaultParticleField } from '../components/insideVault/VaultParticleField'
import { VaultPortrait } from '../components/insideVault/VaultPortrait'
import { authenticatedRequest } from '../lib/api'
import { getSkillLevelMeta } from '../lib/skillUtils'
import { useGuestMode } from '../context/GuestModeContext'
import { useAuthenticatedMediaUrl } from '../hooks/useAuthenticatedMediaUrl'

const introParagraph = `I'm a Computer Information Systems student at The Ohio State University and someone who genuinely enjoys building software that solves real problems.

Programming started as curiosity, but over time it became something I genuinely love doing. Every project teaches me something new, and that's one of my favorite parts about software engineering.

DevVault isn't just my portfolio.

It's where I document my growth, organize my projects, and continue pushing myself to become a better engineer.`

const interestItems = [
  {
    title: 'Full-Stack Development',
    detail: 'I enjoy building complete products end to end, from the interface layer to backend architecture and database design.',
  },
  {
    title: 'Artificial Intelligence',
    detail: 'I am fascinated by how AI is changing software development and I enjoy experimenting with ways to build AI-powered applications.',
  },
  {
    title: 'Cloud Computing',
    detail: 'Cloud systems challenge me to think about reliability, observability, and performance in real-world environments.',
  },
  {
    title: 'Developer Tools',
    detail: 'I love improving workflows that make engineering faster, cleaner, and more enjoyable for teams and solo builders.',
  },
  {
    title: 'Backend Systems',
    detail: 'I enjoy modeling data and APIs in ways that stay maintainable as projects grow in scope.',
  },
  {
    title: 'UI Design',
    detail: 'The details matter to me. I like interfaces that feel calm, intentional, and genuinely pleasant to use.',
  },
  {
    title: 'API Development',
    detail: 'I focus on clean API contracts that make frontend work easier and reduce surprises over time.',
  },
  {
    title: 'AWS',
    detail: 'I am currently learning cloud technologies and excited to build applications that scale.',
  },
]

const philosophyItems = [
  {
    title: 'Build things that solve real problems.',
    detail: 'Projects teach more than tutorials.',
  },
  {
    title: 'Never stop improving.',
    detail: 'Every project is another opportunity to learn.',
  },
  {
    title: 'Details matter.',
    detail: 'Good software should feel just as polished as it is functional.',
  },
  {
    title: 'Consistency wins.',
    detail: 'Small improvements every day lead to big results over time.',
  },
]

const timelineItems = [
  {
    year: '2023',
    detail: 'Started learning Java and Python. Built my first small programs and realized I genuinely enjoyed programming.',
  },
  {
    year: '2024',
    detail: 'Started creating larger personal projects and became interested in full-stack development. Focused on learning by building instead of only watching tutorials.',
  },
  {
    year: '2025',
    detail: 'Began focusing less on simply finishing projects and more on making them polished. Spent more time improving UI design, architecture, and creating software that people genuinely enjoy using.',
  },
  {
    year: '2026',
    detail: 'Completed a Software Engineering Internship at JPMorgan Chase where I worked on internal full-stack applications, AI-powered tools, and automation projects. Started building DevVault into the central hub for my software engineering journey.',
  },
]

const orbitCards = [
  { area: 'journey', title: 'My Journey', subtitle: 'From curiosity to craft', href: '#vault-journey' },
  { area: 'philosophy', title: 'My Philosophy', subtitle: 'Consistency over noise', href: '#vault-philosophy' },
  { area: 'focus', title: 'Current Focus', subtitle: 'Full-stack systems + UI details', href: '#vault-interests' },
  { area: 'favorites', title: 'Favorite Tech', subtitle: 'Tools I keep reaching for', href: '#vault-technologies' },
  { area: 'goals', title: 'Career Goals', subtitle: 'Build meaningful products', href: '#vault-goals' },
  { area: 'command', title: 'Command Center', subtitle: 'How I run my growth stack', href: '#vault-command' },
]

function HeroLine({ delay, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.65, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function InsideVaultPageContent({ getToken }) {
  const { isGuestMode, portfolio } = useGuestMode()
  const [workspace, setWorkspace] = useState(() => isGuestMode ? {
    profile: portfolio.profile,
    skills: portfolio.skills || [],
    projects: portfolio.projects || [],
    goals: portfolio.goals || [],
  } : { profile: null, skills: [], projects: [], goals: [] })
  const [activeInterest, setActiveInterest] = useState('')
  const [logoClickTimes, setLogoClickTimes] = useState([])
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  useEffect(() => {
    if (isGuestMode) return undefined
    let cancelled = false
    authenticatedRequest('/api/dashboard', {}, getToken)
      .then((data) => {
        if (cancelled) return
        const next = data?.workspace || {}
        setWorkspace({
          profile: next.profile || null,
          skills: Array.isArray(next.skills) ? next.skills : [],
          projects: Array.isArray(next.projects) ? next.projects : [],
          goals: Array.isArray(next.goals) ? next.goals : [],
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [getToken, isGuestMode])

  const saveProfileImage = useCallback(async (profileImageUrl) => {
    if (isGuestMode) return workspace.profile
    const savedProfile = await authenticatedRequest('/api/profile/image', {
      method: 'PATCH',
      body: JSON.stringify({ profileImageUrl }),
    }, getToken)

    setWorkspace((current) => ({
      ...current,
      profile: savedProfile,
    }))
    return savedProfile
  }, [getToken, isGuestMode, workspace.profile])

  const dynamicInterests = useMemo(() => {
    const values = workspace.profile?.interests || []
    if (!values.length) return interestItems
    return values.map((title) => ({
      title,
      detail: interestItems.find((item) => item.title.toLowerCase() === String(title).toLowerCase())?.detail
        || `${title} is part of the current learning and building focus documented in DevVault.`,
    }))
  }, [workspace.profile])

  const dynamicTechnologies = useMemo(() => [...workspace.skills]
      .sort((left, right) => Number(Boolean(right.favorite)) - Number(Boolean(left.favorite)) || Number(right.projectsBuilt || 0) - Number(left.projectsBuilt || 0) || Number(right.yearsExperience || 0) - Number(left.yearsExperience || 0))
      .slice(0, 9)
      .map((skill) => ({ name: skill.name, detail: skill.notes || `${getSkillLevelMeta(skill.experienceLevel).name} experience across ${skill.projectsBuilt || 0} linked project${skill.projectsBuilt === 1 ? '' : 's'}.` })), [workspace.skills])

  const dynamicTimeline = useMemo(() => {
    const byYear = new Map()
    workspace.skills.forEach((skill) => {
      if (!skill.firstUsedYear) return
      const values = byYear.get(skill.firstUsedYear) || []
      values.push(skill.name)
      byYear.set(skill.firstUsedYear, values)
    })
    const values = [...byYear.entries()].sort((left, right) => left[0] - right[0]).map(([year, names]) => ({
      year: String(year),
      detail: `Started building with ${names.slice(0, 5).join(', ')}${names.length > 5 ? ', and more' : ''}.`,
    }))
    return values.length ? values : timelineItems
  }, [workspace.skills])

  const activeInterestDetail = useMemo(
    () => dynamicInterests.find((item) => item.title === activeInterest) || dynamicInterests[0],
    [activeInterest, dynamicInterests],
  )

  const profile = workspace.profile
  const { src: profileImageSrc } = useAuthenticatedMediaUrl(profile?.profileImageUrl, getToken, { enabled: !isGuestMode })
  const publicGoals = workspace.goals.filter((goal) => goal.status === 'current' || goal.status === 'future').slice(0, 4)

  const handleLogoClick = () => {
    const now = Date.now()
    const recent = logoClickTimes.filter((timestamp) => now - timestamp < 1300)
    const next = [...recent, now]
    setLogoClickTimes(next)

    if (next.length >= 3) {
      setShowEasterEgg(true)
      setLogoClickTimes([])
    }
  }

  return (
    <div className="inside-vault-page">
      <VaultParticleField />

      <div className="page-shell page-shell--wide page-stack pb-16 pt-3 md:pt-5">
        <section className="inside-vault-hero">
          <div className="inside-vault-hero-bg" aria-hidden="true" />

          <div className="inside-vault-hero-content">
            <HeroLine delay={0.08} className="inside-vault-logo-wrap">
              <button type="button" className="inside-vault-logo-button" onClick={handleLogoClick} aria-label="DevVault shield">
                <DevVaultLogo compact size="lg" />
              </button>
            </HeroLine>

            <HeroLine delay={0.24}>
              <p className="section-eyebrow">Inside the Vault</p>
            </HeroLine>

            <HeroLine delay={0.4}>
              <h2 className="inside-vault-headline">Hi, I&apos;m {profile?.firstName || 'a builder'}.</h2>
            </HeroLine>

            <HeroLine delay={0.58}>
              <p className="inside-vault-subtitle">A closer look at the developer behind DevVault.</p>
            </HeroLine>

            <HeroLine delay={0.76}>
              <p className="inside-vault-intro-copy">{profile?.bio || introParagraph}</p>
            </HeroLine>
          </div>

          <div className="inside-vault-orbit-grid">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.72, ease: [0.22, 0.7, 0.2, 1] }}
              className="inside-vault-portrait-center"
            >
              <VaultPortrait
                key={profileImageSrc || 'profile-picture-loading'}
                src={profileImageSrc || '/profile/profile.jpg'}
                alt={`Portrait of ${profile?.firstName || 'the developer'}`}
                allowLocalOverride={!isGuestMode}
                onImageChange={isGuestMode ? undefined : saveProfileImage}
              />
            </motion.div>

            {orbitCards.map((card, index) => (
              <motion.a
                key={card.area}
                href={card.href}
                className={`inside-vault-orbit-card inside-vault-orbit-card--${card.area}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.9 + index * 0.08 }}
                whileHover={{ y: -6, scale: 1.01 }}
              >
                <p>{card.title}</p>
                <span>{card.subtitle}</span>
              </motion.a>
            ))}
          </div>
        </section>

        <section id="vault-who" className="inside-vault-two-col">
          <motion.article className="inside-vault-glass-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }}>
            <p className="section-eyebrow">Who I Am</p>
            <h3 className="inside-vault-section-title">Builder mindset, human-centered software</h3>
            <p className="inside-vault-section-copy">
              I&apos;ve always enjoyed building things, but programming became the first hobby where it felt like I could create almost anything if I was willing to learn.
            </p>
            <p className="inside-vault-section-copy">
              One of my favorite parts about software engineering is that there&apos;s always something new to figure out. Whether I&apos;m learning a new framework, redesigning an interface, or fixing a bug that&apos;s been bothering me for hours, I genuinely enjoy the process.
            </p>
            <p className="inside-vault-section-copy">
              I care about building software that works well, but I also care about making it feel great to use. The little details matter.
            </p>
          </motion.article>

          <motion.article className="inside-vault-glass-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay: 0.08 }}>
            <p className="section-eyebrow">How It Started</p>
            <h3 className="inside-vault-section-title">From small scripts to real products</h3>
            <p className="inside-vault-section-copy">I started with small Java and Python programs just trying to understand how everything worked.</p>
            <p className="inside-vault-section-copy">Eventually I stopped following tutorials and started creating my own projects instead.</p>
            <p className="inside-vault-section-copy">Every project taught me something different.</p>
            <p className="inside-vault-section-copy">Some taught me better programming.</p>
            <p className="inside-vault-section-copy">Some taught me patience.</p>
            <p className="inside-vault-section-copy">Some completely changed how I think about building software.</p>
            <p className="inside-vault-section-copy">Looking back, building real projects taught me far more than watching tutorials ever could.</p>
          </motion.article>
        </section>

        <section id="vault-interests" className="inside-vault-glass-card inside-vault-glass-card--full">
          <p className="section-eyebrow">Current Interests</p>
          <h3 className="inside-vault-section-title">What I am exploring right now</h3>
          <div className="inside-vault-chip-grid">
            {dynamicInterests.map((interest) => (
              <button
                key={interest.title}
                type="button"
                onClick={() => setActiveInterest(interest.title)}
                className={`inside-vault-interest-chip ${activeInterest === interest.title ? 'is-active' : ''}`.trim()}
              >
                {interest.title}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeInterestDetail?.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32 }}
              className="inside-vault-interest-detail"
            >
              <h4>{activeInterestDetail?.title}</h4>
              <p>{activeInterestDetail?.detail}</p>
            </motion.div>
          </AnimatePresence>
        </section>

        <section id="vault-technologies" className="inside-vault-glass-card inside-vault-glass-card--full">
          <p className="section-eyebrow">Favorite Technologies</p>
          <h3 className="inside-vault-section-title">Tools I love building with</h3>
          <div className="inside-vault-tech-grid">
            {dynamicTechnologies.map((tech) => (
              <motion.article
                key={tech.name}
                className="inside-vault-tech-card"
                whileHover={{ y: -8, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 230, damping: 20 }}
              >
                <h4>{tech.name}</h4>
                <p>{tech.detail}</p>
              </motion.article>
            ))}
            {!dynamicTechnologies.length ? <p className="text-sm text-[var(--color-text-soft)]">Tracked Skills will appear here.</p> : null}
          </div>
        </section>

        <section className="inside-vault-two-col">
          <motion.article id="vault-goals" className="inside-vault-glass-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }}>
            <p className="section-eyebrow">Where I&apos;m Headed</p>
            <h3 className="inside-vault-section-title">The engineer I am working to become</h3>
            <p className="inside-vault-section-copy">I&apos;m still early in my journey, but my goal is simple.</p>
            <p className="inside-vault-section-copy">I want to become the kind of software engineer who builds products that people genuinely enjoy using.</p>
            <p className="inside-vault-section-copy">I want to keep learning from experienced engineers, solve meaningful problems, and continue improving every year.</p>
            <p className="inside-vault-section-copy">More than anything, I want every project I build to be better than the last.</p>
            {publicGoals.length ? <div className="inside-vault-command-list">{publicGoals.map((goal) => <span key={goal.id}>{goal.title}</span>)}</div> : null}
          </motion.article>

          <motion.article id="vault-command" className="inside-vault-glass-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay: 0.06 }}>
            <p className="section-eyebrow">My Command Center</p>
            <h3 className="inside-vault-section-title">The system I use every week</h3>
            <p className="inside-vault-section-copy">DevVault started as a portfolio project, but it quickly became the place where I organize everything related to my software engineering journey.</p>
            <div className="inside-vault-command-list">
              <span>Projects</span>
              <span>Internship applications</span>
              <span>Goals</span>
              <span>Certifications</span>
              <span>Ideas</span>
            </div>
            <p className="inside-vault-section-copy">It&apos;s the project I use the most, which makes improving it even more rewarding.</p>
          </motion.article>
        </section>

        <section id="vault-philosophy" className="inside-vault-glass-card inside-vault-glass-card--full">
          <p className="section-eyebrow">My Philosophy</p>
          <h3 className="inside-vault-section-title">Principles behind how I build</h3>
          <div className="inside-vault-philosophy-grid">
            {philosophyItems.map((item, index) => (
              <motion.article
                key={item.title}
                className="inside-vault-philosophy-card"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                whileHover={{ y: -5 }}
              >
                <h4>{item.title}</h4>
                <p>{item.detail}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="vault-journey" className="inside-vault-glass-card inside-vault-glass-card--full">
          <p className="section-eyebrow">My Journey</p>
          <h3 className="inside-vault-section-title">Milestones that shaped my growth</h3>

          <div className="inside-vault-journey-line" aria-hidden="true" />
          <div className="inside-vault-timeline">
            {dynamicTimeline.map((item, index) => (
              <motion.article
                key={item.year}
                className="inside-vault-timeline-item"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20, y: 18 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <span className="inside-vault-timeline-year">{item.year}</span>
                <p>{item.detail}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showEasterEgg ? (
          <motion.div
            className="inside-vault-modal-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEasterEgg(false)}
          >
            <motion.div
              className="inside-vault-modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.32 }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3>Access Granted</h3>
              <p>Still building.</p>
              <p>Still learning.</p>
              <p>Always improving.</p>
              <button type="button" className="button-primary px-4 py-2 text-sm" onClick={() => setShowEasterEgg(false)}>
                Continue
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function AuthenticatedInsideVaultPage() {
  const { getToken } = useAuth()
  return <InsideVaultPageContent getToken={getToken} />
}

export function InsideVaultPage() {
  const { isGuestMode } = useGuestMode()
  return isGuestMode ? <InsideVaultPageContent getToken={async () => ''} /> : <AuthenticatedInsideVaultPage />
}
