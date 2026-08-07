import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DevVaultLogo } from '../components/branding/DevVaultLogo'
import { SectionHeader } from '../components/SectionHeader'

const GOAL_CATEGORIES = [
  { key: 'Career', label: 'Career', icon: '💼' },
  { key: 'Education', label: 'Education', icon: '🎓' },
  { key: 'Projects', label: 'Projects', icon: '🛠️' },
  { key: 'Certifications', label: 'Certifications', icon: '🏆' },
  { key: 'Personal Development', label: 'Personal Development', icon: '🌿' },
]

const INITIAL_GOALS = [
  {
    id: 'summer-software-engineering-internship',
    title: 'Summer Software Engineering Internship',
    category: 'Career',
    status: 'complete',
    displayOrder: 1,
    pinned: true,
    targetCompletion: '2026-08-01',
    description: 'A real-world software engineering experience that sharpened my backend, frontend, and teamwork skills.',
    why: 'It proved I can contribute inside a professional engineering environment and ship meaningful work with other developers.',
    notes: 'I want to keep building on the habits that made the internship successful: clear communication, strong ownership, and polish.',
    resources: [
      { label: 'Career reflections', url: '/profile' },
      { label: 'Project examples', url: '/projects' },
    ],
    relatedProjects: ['DevVault', 'Cloud Cost Budget Tracker'],
    relatedCertifications: ['Google Cybersecurity Certificate'],
    relatedTechnologies: ['React', 'Node.js', 'AWS'],
    milestones: [
      { status: 'done', title: 'Contribute to real production work' },
      { status: 'done', title: 'Collaborate across teams' },
      { status: 'current', title: 'Turn that experience into a stronger portfolio narrative' },
    ],
    accent: 'amber',
  },
  {
    id: 'build-devvault',
    title: 'Build DevVault',
    category: 'Projects',
    status: 'current',
    displayOrder: 2,
    pinned: true,
    targetCompletion: '2026-09-15',
    description: 'Make DevVault the centerpiece of my professional story: polished, intelligent, and recruiter-friendly.',
    why: 'This is the product that shows how I think about design, structure, and growth as a software engineer.',
    notes: 'The goal is not more features for their own sake. The goal is a memorable product that feels coherent end to end.',
    resources: [
      { label: 'DevVault dashboard', url: '/dashboard' },
      { label: 'Inside the Vault', url: '/inside-vault' },
    ],
    relatedProjects: ['DevVault'],
    relatedCertifications: ['GitHub Foundations', 'Introduction to APIs'],
    relatedTechnologies: ['React', 'Prisma ORM', 'Node.js', 'REST APIs'],
    milestones: [
      { status: 'done', title: 'Ship the main workspace experience' },
      { status: 'current', title: 'Refine mission control and career storytelling' },
      { status: 'future', title: 'Keep syncing goals, skills, and certifications automatically' },
    ],
    accent: 'amber',
  },
  {
    id: 'deploy-portfolio',
    title: 'Deploy Portfolio',
    category: 'Projects',
    status: 'future',
    displayOrder: 3,
    pinned: false,
    targetCompletion: '2026-10-01',
    description: 'Publish the public-facing portfolio in a way that feels premium and unmistakably mine.',
    why: 'A deployed portfolio is the fastest way to show recruiters that the work is real and current.',
    notes: 'I want this to feel like a launch event, not a placeholder website.',
    resources: [
      { label: 'Portfolio page', url: '/portfolio/jace' },
      { label: 'Resume workspace', url: '/resume-workspace' },
    ],
    relatedProjects: ['Portfolio Site'],
    relatedCertifications: ['GitHub Foundations'],
    relatedTechnologies: ['React', 'GitHub', 'Git'],
    milestones: [
      { status: 'done', title: 'Set the design direction' },
      { status: 'current', title: 'Prepare final launch copy and visuals' },
      { status: 'future', title: 'Deploy and share with recruiters' },
    ],
    accent: 'amber',
  },
  {
    id: 'aws-cloud-practitioner-goal',
    title: 'AWS Cloud Practitioner',
    category: 'Certifications',
    status: 'current',
    displayOrder: 4,
    pinned: true,
    targetCompletion: '2026-11-01',
    description: 'Build a solid cloud vocabulary and understand the practical foundations of AWS.',
    why: 'Cloud fluency matters for building scalable products and talking confidently about deployment choices.',
    notes: 'I want this to become part of how I think, not just a box I checked.',
    resources: [
      { label: 'AWS certification portal', url: 'https://aws.amazon.com/certification/' },
      { label: 'Cloud-related projects', url: '/projects' },
    ],
    relatedProjects: ['Cloud Cost Budget Tracker'],
    relatedCertifications: ['AWS Cloud Practitioner'],
    relatedTechnologies: ['AWS', 'IAM', 'EC2', 'S3', 'Networking'],
    milestones: [
      { status: 'done', title: 'Purchase the study path' },
      { status: 'done', title: 'Complete cloud fundamentals training' },
      { status: 'current', title: 'Schedule the exam' },
      { status: 'future', title: 'Pass the certification' },
    ],
    accent: 'amber',
  },
  {
    id: 'security-plus',
    title: 'Security+',
    category: 'Certifications',
    status: 'future',
    displayOrder: 5,
    pinned: false,
    targetCompletion: '2027-03-01',
    description: 'Deepen my security foundation so I can design safer systems and speak to risk more clearly.',
    why: 'Security-aware engineering is a signal of maturity and professionalism.',
    notes: 'I want the security chapter of my growth to feel deliberate instead of reactive.',
    resources: [
      { label: 'CompTIA Security+', url: 'https://www.comptia.org/certifications/security' },
      { label: 'DevVault security notes', url: '/inside-vault' },
    ],
    relatedProjects: ['DevVault'],
    relatedCertifications: ['Google Cybersecurity Certificate'],
    relatedTechnologies: ['Security', 'IAM', 'Networking'],
    milestones: [
      { status: 'done', title: 'Map the study path' },
      { status: 'current', title: 'Build a security reading list' },
      { status: 'future', title: 'Take the certification exam' },
    ],
    accent: 'amber',
  },
  {
    id: 'aws-solutions-architect',
    title: 'AWS Solutions Architect',
    category: 'Certifications',
    status: 'future',
    displayOrder: 6,
    pinned: false,
    targetCompletion: '2027-08-01',
    description: 'Move from cloud basics to architecture decisions that support scale, reliability, and clarity.',
    why: 'This goal connects directly to how I want to design products for real users.',
    notes: 'I want to learn the architecture layer with the same care I bring to frontend polish.',
    resources: [
      { label: 'AWS solutions architect guide', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
      { label: 'Cloud Cost Budget Tracker', url: '/projects' },
    ],
    relatedProjects: ['Cloud Cost Budget Tracker'],
    relatedCertifications: ['AWS Cloud Practitioner'],
    relatedTechnologies: ['AWS', 'EC2', 'S3', 'IAM', 'Networking'],
    milestones: [
      { status: 'done', title: 'Understand the cloud vocabulary' },
      { status: 'current', title: 'Practice architecture tradeoffs' },
      { status: 'future', title: 'Earn the associate certification' },
    ],
    accent: 'amber',
  },
  {
    id: 'graduate-ohio-state',
    title: 'Graduate Ohio State',
    category: 'Education',
    status: 'future',
    displayOrder: 7,
    pinned: false,
    targetCompletion: '2027-05-01',
    description: 'Finish strong at The Ohio State University and carry those fundamentals into the next stage.',
    why: 'Graduation is the milestone that turns the current chapter into a launch point.',
    notes: 'I want the work I build before graduation to show momentum, not just activity.',
    resources: [
      { label: 'Academic progress', url: '/profile' },
      { label: 'Career goals', url: '/goals' },
    ],
    relatedProjects: ['DevVault'],
    relatedCertifications: ['Google Cybersecurity Certificate'],
    relatedTechnologies: ['Systems Thinking', 'Communication'],
    milestones: [
      { status: 'done', title: 'Stay organized through the term' },
      { status: 'current', title: 'Keep building portfolio momentum' },
      { status: 'future', title: 'Cross the graduation stage' },
    ],
    accent: 'amber',
  },
  {
    id: 'build-technical-voice',
    title: 'Build a Strong Technical Voice',
    category: 'Personal Development',
    status: 'current',
    displayOrder: 8,
    pinned: false,
    targetCompletion: '2026-12-01',
    description: 'Write and communicate more clearly so my ideas feel as polished as my interfaces.',
    why: 'Clear communication turns good work into work that other people can trust and remember.',
    notes: 'This goal supports interviews, teamwork, and the long-term quality of my work.',
    resources: [
      { label: 'Writing practice', url: '/inside-vault' },
      { label: 'Portfolio case studies', url: '/portfolio/jace' },
    ],
    relatedProjects: ['DevVault', 'Portfolio Site'],
    relatedCertifications: ['GitHub Foundations'],
    relatedTechnologies: ['Writing', 'Communication', 'Product Thinking'],
    milestones: [
      { status: 'done', title: 'Choose a consistent voice' },
      { status: 'current', title: 'Write clearer project summaries' },
      { status: 'future', title: 'Turn the writing into a portfolio advantage' },
    ],
    accent: 'amber',
  },
]

const ROADMAP_STEPS = [
  { label: 'NOW', title: 'Finish DevVault' },
  { label: 'NEXT', title: 'Deploy Portfolio' },
  { label: 'THEN', title: 'AWS Cloud Practitioner' },
  { label: 'THEN', title: 'Summer 2027 Internship' },
  { label: 'THEN', title: 'AWS Solutions Architect' },
  { label: 'LAST', title: 'Graduate Ohio State' },
]

const VISION_CARDS = [
  {
    icon: '💻',
    title: 'Software Engineer',
    description: 'Build polished products with strong systems, beautiful interfaces, and calm execution.',
    relatedGoals: ['Build DevVault', 'Deploy Portfolio'],
  },
  {
    icon: '☁️',
    title: 'Cloud Engineer',
    description: 'Keep learning cloud architecture so I can ship reliable products with real infrastructure intuition.',
    relatedGoals: ['AWS Cloud Practitioner', 'AWS Solutions Architect'],
  },
  {
    icon: '🤖',
    title: 'AI Developer',
    description: 'Stay close to the tools that make products feel smarter, faster, and more helpful.',
    relatedGoals: ['Build a Strong Technical Voice', 'Build DevVault'],
  },
  {
    icon: '🎓',
    title: 'Graduate from Ohio State',
    description: 'Finish the degree chapter with momentum, clarity, and a portfolio that proves growth.',
    relatedGoals: ['Graduate Ohio State'],
  },
  {
    icon: '✨',
    title: 'Build Products People Love',
    description: 'Keep refining the craft until the work feels memorable to both users and recruiters.',
    relatedGoals: ['Build DevVault', 'Deploy Portfolio', 'Build a Strong Technical Voice'],
  },
]

const GOAL_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: `goal-particle-${index}`,
  x: 10 + ((index * 11) % 78),
  y: 12 + ((index * 17) % 72),
  size: 2 + (index % 3),
  delay: `${index * 0.35}s`,
  duration: `${8 + (index % 5)}s`,
}))

const GOAL_LINKS = [
  [0, 3], [1, 4], [2, 7], [5, 10], [6, 12], [8, 14], [9, 16],
]

function normalizeTextList(value) {
  return String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseLabelUrlLines(value) {
  return String(value || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url = ''] = line.split('|')
      return {
        label: label.trim() || 'Resource',
        url: url.trim(),
      }
    })
    .filter((item) => item.url)
}

function parseMilestones(value) {
  return String(value || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status = 'future', ...rest] = line.split('|')
      return {
        status: ['done', 'current', 'future'].includes(status.trim()) ? status.trim() : 'future',
        title: rest.join('|').trim() || 'Untitled milestone',
      }
    })
}

function formatDate(value) {
  if (!value) {
    return 'TBD'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'TBD'
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function getGoalStatusLabel(status) {
  if (status === 'complete') return 'Completed'
  if (status === 'current') return 'In Motion'
  if (status === 'archived') return 'Archived'
  return 'Future'
}

function getCategoryIcon(category) {
  return GOAL_CATEGORIES.find((item) => item.key === category)?.icon || '✦'
}

function GoalAtmosphere() {
  return (
    <div className="goals-atmosphere" aria-hidden="true">
      <svg className="goals-atmosphere-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {GOAL_LINKS.map(([sourceIndex, targetIndex]) => {
          const source = GOAL_PARTICLES[sourceIndex]
          const target = GOAL_PARTICLES[targetIndex]
          return (
            <line
              key={`${source.id}-${target.id}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              className="goals-atmosphere-line"
            />
          )
        })}
      </svg>
      {GOAL_PARTICLES.map((particle) => (
        <span
          key={particle.id}
          className="goals-atmosphere-particle"
          style={{
            '--particle-x': `${particle.x}%`,
            '--particle-y': `${particle.y}%`,
            '--particle-size': `${particle.size}px`,
            '--particle-delay': particle.delay,
            '--particle-duration': particle.duration,
          }}
        />
      ))}
    </div>
  )
}

function GoalOrbit({ goals, selectedGoalId, onSelectGoal, paused, onTogglePause }) {
  const orbitGoals = useMemo(() => goals.filter((goal) => goal.status !== 'archived').sort((left, right) => left.displayOrder - right.displayOrder), [goals])
  const orbitCount = orbitGoals.length || 1

  return (
    <section className={`goals-orbit-shell ${paused ? 'is-paused' : ''}`}>
      <GoalAtmosphere />
      <div className="goals-orbit-grid" aria-hidden="false">
        <div className="goals-orbit-center">
          <div className="goals-orbit-center-glow" />
          <div className="goals-orbit-center-ring" />
          <button
            type="button"
            className="goals-orbit-center-logo"
            aria-label={paused ? 'Resume goal orbit' : 'Pause goal orbit'}
            aria-pressed={paused}
            onClick={onTogglePause}
          >
            <DevVaultLogo compact size="lg" />
          </button>
          <div className="goals-orbit-center-copy">
            <p className="section-eyebrow">Mission Control</p>
            <h3>DevVault</h3>
            <span>Orbit your career around clear direction.</span>
          </div>
        </div>

        <div className="goals-orbit-ring">
          {orbitGoals.map((goal, index) => {
          const isSelected = selectedGoalId === goal.id
          const glow = goal.status === 'complete' ? 'goals-orbit-item--complete' : goal.status === 'current' ? 'goals-orbit-item--current' : 'goals-orbit-item--future'

          return (
            <motion.button
              key={goal.id}
              type="button"
              className={`goals-orbit-item ${glow} ${isSelected ? 'is-selected' : ''}`}
              style={{
                '--goal-index': index,
                '--goal-count': orbitCount,
                '--goal-angle': `${(360 / orbitCount) * index}deg`,
                '--goal-radius': 'clamp(12rem, 21vw, 18rem)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectGoal(goal.id)}
            >
              <span className="goals-orbit-anchor">
                <span className="goals-orbit-card">
                  <span className="goals-orbit-card-top">
                    <span className="goals-orbit-icon">{getCategoryIcon(goal.category)}</span>
                    <span className={`goals-status-pill goals-status-pill--${goal.status}`}>{getGoalStatusLabel(goal.status)}</span>
                  </span>
                  <span className="goals-orbit-title">{goal.title}</span>
                  <span className="goals-orbit-subtitle">{goal.category}</span>
                </span>
              </span>
            </motion.button>
          )
            })}
          </div>
      </div>
    </section>
  )
}

function GoalDetailsPanel({ goal, onNavigateSkill, onArchive, onPin, onEdit, onReorder, onAdd }) {
  if (!goal) {
    return null
  }

  return (
    <aside className="goals-details-panel">
      <div className="goals-details-shell">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">Goal Details</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{goal.title}</h3>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">{goal.category} • {getGoalStatusLabel(goal.status)}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => onPin(goal.id)} className="button-secondary px-3 py-2 text-xs">{goal.pinned ? 'Unpin' : 'Pin Goal'}</button>
            <button type="button" onClick={() => onArchive(goal.id)} className="button-secondary px-3 py-2 text-xs">{goal.status === 'archived' ? 'Unarchive' : 'Archive Goal'}</button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="goals-detail-card">
            <p className="goals-detail-label">Target completion</p>
            <p className="goals-detail-value">{formatDate(goal.targetCompletion)}</p>
          </div>
          <div className="goals-detail-card">
            <p className="goals-detail-label">Related certifications</p>
            <p className="goals-detail-value">{goal.relatedCertifications.join(' · ') || 'None yet'}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <section className="goals-detail-block">
            <p className="goals-detail-label">Description</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-soft)]">{goal.description}</p>
          </section>
          <section className="goals-detail-block">
            <p className="goals-detail-label">Why it matters</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-soft)]">{goal.why}</p>
          </section>
          <section className="goals-detail-block">
            <p className="goals-detail-label">Notes</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-soft)]">{goal.notes}</p>
          </section>
        </div>

        <section className="mt-5 goals-detail-block">
          <p className="goals-detail-label">Milestones</p>
          <div className="mt-3 space-y-2">
            {goal.milestones.map((milestone) => (
              <div key={`${goal.id}-${milestone.title}`} className="flex items-center gap-3 rounded-[1rem] border border-[rgba(214,160,89,0.14)] bg-[rgba(22,16,11,0.72)] px-4 py-3">
                <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs ${milestone.status === 'done' ? 'border-[rgba(247,204,129,0.38)] bg-[rgba(78,53,32,0.92)] text-[var(--color-brand-ink)]' : milestone.status === 'current' ? 'border-[rgba(231,155,63,0.42)] bg-[rgba(69,44,24,0.92)] text-[var(--color-brand-ink)]' : 'border-[rgba(214,160,89,0.22)] bg-[rgba(42,31,22,0.86)] text-[var(--color-text-muted)]'}`}>{milestone.status === 'done' ? '✓' : milestone.status === 'current' ? '●' : '○'}</span>
                <p className="text-sm text-[var(--color-text)]">{milestone.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 goals-detail-block">
          <p className="goals-detail-label">Smart connections</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {goal.relatedTechnologies.map((technology) => (
              <button key={technology} type="button" onClick={() => onNavigateSkill(technology)} className="chip chip--accent">
                {technology}
              </button>
            ))}
            {goal.relatedProjects.map((project) => (
              <Link key={project} to="/projects" className="chip">
                {project}
              </Link>
            ))}
            {goal.relatedCertifications.map((certification) => (
              <Link key={certification} to="/certifications" className="chip">
                {certification}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 goals-detail-block">
          <p className="goals-detail-label">Resources</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {goal.resources.map((resource) => (
              resource.url.startsWith('/') ? (
                <Link key={resource.label} to={resource.url} className="chip chip--accent">
                  {resource.label}
                </Link>
              ) : (
                <a key={resource.label} href={resource.url} target="_blank" rel="noreferrer" className="chip chip--accent">
                  {resource.label}
                </a>
              )
            ))}
          </div>
        </section>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => onEdit(goal.id)} className="button-primary px-4 py-2 text-sm">Edit Goal</button>
          <button type="button" onClick={onAdd} className="button-secondary px-4 py-2 text-sm">Add Goal</button>
          <button type="button" onClick={() => onReorder(true)} className="button-secondary px-4 py-2 text-sm">Reorder Goals</button>
        </div>
      </div>
    </aside>
  )
}

function GoalEditorModal({ goal, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    title: goal?.title || '',
    category: goal?.category || 'Career',
    status: goal?.status || 'future',
    targetCompletion: goal?.targetCompletion || '',
    description: goal?.description || '',
    why: goal?.why || '',
    notes: goal?.notes || '',
    resourcesText: (goal?.resources || []).map((resource) => `${resource.label}|${resource.url}`).join('\n'),
    relatedProjectsText: (goal?.relatedProjects || []).join('\n'),
    relatedCertificationsText: (goal?.relatedCertifications || []).join('\n'),
    relatedTechnologiesText: (goal?.relatedTechnologies || []).join('\n'),
    milestonesText: (goal?.milestones || []).map((milestone) => `${milestone.status}|${milestone.title}`).join('\n'),
  }))

  return (
    <motion.div className="goals-modal-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="goals-modal-card" initial={{ y: 18, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.98 }} transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(214,160,89,0.18)] px-6 py-5">
          <div>
            <p className="section-eyebrow">{goal ? 'Edit Goal' : 'Add Goal'}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{goal ? goal.title : 'Create a new mission'}</h3>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Close</button>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-2">
          <label className="field-label">
            <strong>Title</strong>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Category</strong>
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="field-select">
              {GOAL_CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
            </select>
          </label>
          <label className="field-label">
            <strong>Status</strong>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="field-select">
              <option value="complete">Completed</option>
              <option value="current">In Motion</option>
              <option value="future">Future</option>
            </select>
          </label>
          <label className="field-label">
            <strong>Target completion</strong>
            <input type="date" value={form.targetCompletion} onChange={(event) => setForm((current) => ({ ...current, targetCompletion: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label lg:col-span-2">
            <strong>Description</strong>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="field-textarea" />
          </label>
          <label className="field-label lg:col-span-2">
            <strong>Why it matters</strong>
            <textarea value={form.why} onChange={(event) => setForm((current) => ({ ...current, why: event.target.value }))} rows={3} className="field-textarea" />
          </label>
          <label className="field-label lg:col-span-2">
            <strong>Notes</strong>
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="field-textarea" />
          </label>
          <label className="field-label">
            <strong>Resources</strong>
            <textarea value={form.resourcesText} onChange={(event) => setForm((current) => ({ ...current, resourcesText: event.target.value }))} rows={4} placeholder="Label|https://example.com" className="field-textarea" />
          </label>
          <label className="field-label">
            <strong>Milestones</strong>
            <textarea value={form.milestonesText} onChange={(event) => setForm((current) => ({ ...current, milestonesText: event.target.value }))} rows={4} placeholder="done|Purchase course" className="field-textarea" />
          </label>
          <label className="field-label">
            <strong>Related projects</strong>
            <textarea value={form.relatedProjectsText} onChange={(event) => setForm((current) => ({ ...current, relatedProjectsText: event.target.value }))} rows={3} className="field-textarea" />
          </label>
          <label className="field-label">
            <strong>Related certifications</strong>
            <textarea value={form.relatedCertificationsText} onChange={(event) => setForm((current) => ({ ...current, relatedCertificationsText: event.target.value }))} rows={3} className="field-textarea" />
          </label>
          <label className="field-label lg:col-span-2">
            <strong>Related technologies</strong>
            <textarea value={form.relatedTechnologiesText} onChange={(event) => setForm((current) => ({ ...current, relatedTechnologiesText: event.target.value }))} rows={3} className="field-textarea" />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[rgba(214,160,89,0.18)] px-6 py-5">
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Cancel</button>
          <button
            type="button"
            onClick={() => onSave({
              ...goal,
              title: form.title.trim() || 'Untitled goal',
              category: form.category,
              status: form.status,
              targetCompletion: form.targetCompletion || null,
              description: form.description.trim(),
              why: form.why.trim(),
              notes: form.notes.trim(),
              resources: parseLabelUrlLines(form.resourcesText),
              relatedProjects: normalizeTextList(form.relatedProjectsText),
              relatedCertifications: normalizeTextList(form.relatedCertificationsText),
              relatedTechnologies: normalizeTextList(form.relatedTechnologiesText),
              milestones: parseMilestones(form.milestonesText),
            })}
            className="button-primary px-4 py-2 text-sm"
          >
            Save Goal
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function GoalReorderModal({ goals, onSave, onClose }) {
  const [items, setItems] = useState(() => [...goals])

  const moveItem = (index, direction) => {
    setItems((current) => {
      const next = [...current]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= next.length) {
        return current
      }
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  return (
    <motion.div className="goals-modal-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="goals-modal-card goals-modal-card--wide" initial={{ y: 18, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.98 }} transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(214,160,89,0.18)] px-6 py-5">
          <div>
            <p className="section-eyebrow">Reorder Goals</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">Rearrange the mission sequence</h3>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Close</button>
        </div>

        <div className="space-y-3 p-6">
          {items.map((goal, index) => (
            <div key={goal.id} className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-[rgba(214,160,89,0.18)] bg-[rgba(24,17,12,0.84)] px-4 py-3">
              <div>
                <p className="font-medium text-[var(--color-text)]">{goal.title}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{goal.category}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => moveItem(index, -1)} className="button-secondary px-3 py-2 text-xs">Up</button>
                <button type="button" onClick={() => moveItem(index, 1)} className="button-secondary px-3 py-2 text-xs">Down</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[rgba(214,160,89,0.18)] px-6 py-5">
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Cancel</button>
          <button type="button" onClick={() => onSave(items)} className="button-primary px-4 py-2 text-sm">Save Order</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function GoalsPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState(() => INITIAL_GOALS)
  const [selectedGoalId, setSelectedGoalId] = useState(() => INITIAL_GOALS[0].id)
  const [orbitPaused, setOrbitPaused] = useState(false)
  const [editorGoal, setEditorGoal] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isReorderOpen, setIsReorderOpen] = useState(false)

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status !== 'archived').sort((left, right) => left.displayOrder - right.displayOrder), [goals])
  const archivedGoals = useMemo(() => goals.filter((goal) => goal.status === 'archived'), [goals])
  const selectedGoal = useMemo(() => goals.find((goal) => goal.id === selectedGoalId) || activeGoals[0] || goals[0], [activeGoals, goals, selectedGoalId])

  const categories = useMemo(() => GOAL_CATEGORIES.map((category) => {
    const categoryGoals = goals.filter((goal) => goal.category === category.key)
    const highlightedGoal = categoryGoals.find((goal) => goal.status === 'current' || goal.status === 'complete') || categoryGoals[0]

    return {
      ...category,
      count: categoryGoals.length,
      goalTitles: categoryGoals.slice(0, 3).map((goal) => goal.title),
      highlightedGoal,
    }
  }), [goals])

  const openAddGoal = () => {
    setEditorGoal(null)
    setIsEditorOpen(true)
  }

  const openEditGoal = (goalId = selectedGoal?.id) => {
    const goal = goals.find((item) => item.id === goalId)
    if (!goal) {
      return
    }

    setEditorGoal(goal)
    setIsEditorOpen(true)
  }

  const saveGoal = (nextGoal) => {
    setGoals((current) => {
      if (nextGoal.id) {
        return current.map((goal) => (goal.id === nextGoal.id ? nextGoal : goal))
      }

      const newGoal = {
        ...nextGoal,
        id: `goal-${Date.now()}`,
        displayOrder: current.length + 1,
        pinned: false,
        status: nextGoal.status || 'future',
      }

      return [...current, newGoal]
    })

    setIsEditorOpen(false)
    setEditorGoal(null)
  }

  const togglePinGoal = (goalId = selectedGoal?.id) => {
    if (!goalId) {
      return
    }

    setGoals((current) => current.map((goal) => (goal.id === goalId ? { ...goal, pinned: !goal.pinned } : goal)))
  }

  const toggleArchiveGoal = (goalId = selectedGoal?.id) => {
    if (!goalId) {
      return
    }

    setGoals((current) => current.map((goal) => {
      if (goal.id !== goalId) {
        return goal
      }

      const nextStatus = goal.status === 'archived' ? 'future' : 'archived'
      return { ...goal, status: nextStatus }
    }))
  }

  const saveReorder = (orderedGoals) => {
    setGoals((current) => {
      const orderMap = new Map(orderedGoals.map((goal, index) => [goal.id, index + 1]))
      return current.map((goal) => (
        goal.status === 'archived'
          ? goal
          : { ...goal, displayOrder: orderMap.get(goal.id) || goal.displayOrder }
      ))
    })

    setIsReorderOpen(false)
  }

  const openTechnology = (technology) => {
    navigate(`/skills?technology=${encodeURIComponent(technology)}`)
  }

  const toggleOrbitPause = () => {
    setOrbitPaused((current) => !current)
  }

  return (
    <div className="page-shell page-shell--wide page-stack pb-14 goals-page">
      <section className="surface-card surface-card--hero goals-hero overflow-hidden px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <GoalAtmosphere />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Mission Control</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--color-text)] md:text-6xl">🎯 Goals</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--color-text-soft)] md:text-lg">
              The roadmap I&apos;m building toward-projects, certifications, career milestones, and long-term ambitions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={openAddGoal} className="button-primary px-4 py-2 text-sm">Add Goal</button>
            <button type="button" onClick={() => openEditGoal()} className="button-secondary px-4 py-2 text-sm">Edit Goal</button>
            <button type="button" onClick={() => toggleArchiveGoal()} className="button-secondary px-4 py-2 text-sm">Archive Goal</button>
            <button type="button" onClick={() => togglePinGoal()} className="button-secondary px-4 py-2 text-sm">Pin Goal</button>
            <button type="button" onClick={() => setIsReorderOpen(true)} className="button-secondary px-4 py-2 text-sm">Reorder Goals</button>
          </div>
        </div>
      </section>

      <section className="goals-layout grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.78fr)]">
        <div className="space-y-5">
          <GoalOrbit goals={goals} selectedGoalId={selectedGoal?.id} onSelectGoal={setSelectedGoalId} paused={orbitPaused} onTogglePause={toggleOrbitPause} />

          <section className="surface-card surface-card--strong p-5 md:p-6">
            <SectionHeader
              eyebrow="Roadmap"
              title="The mission sequence"
              description="A horizontal route for the next important milestones on the path ahead."
            />
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {ROADMAP_STEPS.map((step, index) => (
                <motion.div
                  key={`${step.label}-${step.title}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="min-w-[15rem] rounded-[1.4rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(43,31,22,0.86)] p-4 shadow-[0_18px_40px_rgba(15,10,7,0.28)]"
                >
                  <p className="section-eyebrow">{step.label}</p>
                  <p className="mt-3 text-lg font-semibold tracking-tight text-[var(--color-text)]">{step.title}</p>
                  {index < ROADMAP_STEPS.length - 1 ? <p className="mt-4 text-2xl text-[var(--color-brand-ink)]">↓</p> : null}
                </motion.div>
              ))}
            </div>
          </section>

          <section className="surface-card surface-card--strong p-5 md:p-6">
            <SectionHeader
              eyebrow="Goal Categories"
              title="Five premium sections for the work ahead"
              description="Each category keeps the journey organized without turning the page into a checklist."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category, index) => (
                <motion.button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    if (category.highlightedGoal) {
                      setSelectedGoalId(category.highlightedGoal.id)
                    }
                  }}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.16 }}
                  transition={{ duration: 0.42, delay: index * 0.04 }}
                  className="goals-category-card text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl">{category.icon}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">{category.label}</h3>
                    </div>
                    <span className="chip chip--accent">{category.count} goals</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {category.goalTitles.map((goalTitle) => (
                      <span key={goalTitle} className="chip">
                        {goalTitle}
                      </span>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          <section className="surface-card surface-card--strong p-5 md:p-6">
            <SectionHeader
              eyebrow="Where I&apos;m Going"
              title="Large cards for the future I want"
              description="Each vision card shows the kind of engineer I am becoming and the goals that support that direction."
            />
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {VISION_CARDS.map((card, index) => (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="goals-vision-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-[1.2rem] border border-[rgba(247,204,129,0.24)] bg-[rgba(64,44,28,0.84)] text-2xl text-[var(--color-brand-ink)]">
                      {card.icon}
                    </div>
                    <span className="chip chip--accent">Vision</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">{card.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.relatedGoals.map((relatedGoal) => (
                      <button
                        key={relatedGoal}
                        type="button"
                        onClick={() => {
                          const match = goals.find((goal) => goal.title === relatedGoal)
                          if (match) {
                            setSelectedGoalId(match.id)
                          }
                        }}
                        className="chip chip--accent"
                      >
                        {relatedGoal}
                      </button>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="surface-card surface-card--strong p-5 md:p-6">
            <SectionHeader
              eyebrow="Archived"
              title="Dormant goals"
              description="Archived goals remain visible here without crowding the active mission control surface."
            />
            <div className="mt-5 flex flex-wrap gap-2">
              {archivedGoals.length ? archivedGoals.map((goal) => (
                <button key={goal.id} type="button" onClick={() => setSelectedGoalId(goal.id)} className="chip">
                  {goal.title}
                </button>
              )) : <p className="text-sm text-[var(--color-text-soft)]">No archived goals yet.</p>}
            </div>
          </section>
        </div>

        <GoalDetailsPanel
          goal={selectedGoal}
          onNavigateSkill={openTechnology}
          onArchive={toggleArchiveGoal}
          onPin={togglePinGoal}
          onEdit={openEditGoal}
          onReorder={setIsReorderOpen}
          onAdd={openAddGoal}
        />
      </section>

      <AnimatePresence>
        {isEditorOpen ? (
          <GoalEditorModal goal={editorGoal} onSave={saveGoal} onClose={() => setIsEditorOpen(false)} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isReorderOpen ? (
          <GoalReorderModal goals={activeGoals} onSave={saveReorder} onClose={() => setIsReorderOpen(false)} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
