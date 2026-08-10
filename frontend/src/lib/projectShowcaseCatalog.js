const PROJECT_SHOWCASE_LIBRARY = [
  {
    id: 'devvault',
    title: 'DevVault',
    description: 'A premium developer workspace for portfolio operations, project tracking, and recruiter-ready storytelling.',
    image: '/project-showcase/devvault.svg',
    techStack: ['React', 'Node.js', 'Prisma', 'PostgreSQL'],
    keyFeatures: ['Unified portfolio command center', 'Project + skills intelligence', 'Warm premium interface system'],
    github: '',
    demo: '',
    featured: true,
    order: 1,
    status: 'BUILDING',
    match: ['devvault', 'portfolio', 'workspace', 'dashboard'],
  },
  {
    id: 'password-strength-analyzer',
    title: 'Password Strength Analyzer',
    description: 'Security-focused password analysis with real-time scoring, breach heuristics, and clear threat guidance.',
    image: '/project-showcase/password-strength-analyzer.svg',
    techStack: ['Python', 'React', 'Cybersecurity'],
    keyFeatures: ['Entropy and pattern scoring', 'Actionable hardening tips', 'Threat-level visual feedback'],
    github: '',
    demo: '',
    featured: false,
    order: 2,
    status: 'COMPLETED',
    match: ['password', 'security', 'analyzer', 'cyber', 'threat', 'auth'],
  },
  {
    id: 'cloud-cost-budget-tracker',
    title: 'Cloud Cost Budget Tracker',
    description: 'Cloud spend visibility for teams that need forecasting, anomaly flags, and budget guardrails.',
    image: '/project-showcase/cloud-cost-budget-tracker.svg',
    techStack: ['AWS', 'TypeScript', 'Analytics'],
    keyFeatures: ['Service-level spend trends', 'Budget drift alerts', 'Forecast snapshots'],
    github: '',
    demo: '',
    featured: false,
    order: 3,
    status: 'BUILDING',
    match: ['cloud', 'aws', 'cost', 'budget', 'finance', 'billing', 'tracker'],
  },
  {
    id: 'interview-ai',
    title: 'Interview AI',
    description: 'An interview prep assistant for coding rounds with adaptive prompts, feedback loops, and practice sessions.',
    image: '/project-showcase/interview-ai.svg',
    techStack: ['AI', 'Python', 'React'],
    keyFeatures: ['Prompted interview simulations', 'Answer quality insights', 'Role-specific prep tracks'],
    github: '',
    demo: '',
    featured: false,
    order: 4,
    status: 'PLANNING',
    match: ['interview', 'ai', 'assistant', 'chatbot', 'coding'],
  },
]

function normalizeText(value) {
  if (!value) {
    return ''
  }
  return String(value).toLowerCase()
}

export function isDevVaultProject(project) {
  const title = project?.title || project?.showcase?.title || ''
  return normalizeText(title).replace(/[^a-z0-9]+/g, '').includes('devvault')
    || project?.showcase?.logoVariant === 'devvault-mark'
}

export function shouldShowProjectLiveDemo(project) {
  const demoUrl = project?.showcase?.demo || project?.liveDemoUrl || ''
  return Boolean(demoUrl && !isDevVaultProject(project))
}

function uniq(values = []) {
  return [...new Set(values.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))]
}

function scorePreset(project, preset) {
  const haystack = [
    project.title,
    project.description,
    ...(project.techStack || []),
    ...(project.githubTopics || []),
    ...(project.githubLanguages || []),
  ]
    .map(normalizeText)
    .join(' ')

  return (preset.match || []).reduce((score, term) => {
    return haystack.includes(normalizeText(term)) ? score + 1 : score
  }, 0)
}

function resolvePreset(project) {
  const ranked = PROJECT_SHOWCASE_LIBRARY
    .map((preset) => ({ preset, score: scorePreset(project, preset) }))
    .sort((left, right) => right.score - left.score)

  if (!ranked.length || ranked[0].score === 0) {
    return null
  }

  return ranked[0].preset
}

function buildFallbackImage(project) {
  const normalized = normalizeText(project.accentTone)
  if (normalized.includes('security') || normalized.includes('cyber')) {
    return '/project-showcase/password-strength-analyzer.svg'
  }
  if (normalized.includes('cloud') || normalized.includes('finance')) {
    return '/project-showcase/cloud-cost-budget-tracker.svg'
  }
  if (normalized.includes('ai') || normalized.includes('assistant')) {
    return '/project-showcase/interview-ai.svg'
  }
  return '/project-showcase/generic-product.svg'
}

export function decorateProjectShowcase(project, index) {
  const preset = resolvePreset(project)
  const normalizedTitle = normalizeText(project.title)
  const isDevVaultProject = normalizedTitle.includes('devvault') || preset?.id === 'devvault'
  const persistedImage = project.image || project.bannerImageUrl
  const isAuthoritativeArtwork = ['CURATED', 'IMPORTED'].includes(project.bannerImageSource)
  const sourceImage = isAuthoritativeArtwork ? persistedImage : ''
  const resolvedImage = sourceImage || preset?.image || persistedImage || buildFallbackImage(project)
  const shouldForceDevVaultLogo = isDevVaultProject
    && (!sourceImage || normalizeText(sourceImage).includes('generic-product'))

  const techStack = uniq([
    ...(project.techStack || []),
    ...((project.githubLanguages || []).slice(0, 2)),
    ...((preset?.techStack || []).slice(0, 3)),
  ]).slice(0, 6)

  const keyFeatures = uniq([
    ...(project.keyFeatures || []),
    ...(preset?.keyFeatures || []),
  ]).slice(0, 4)

  const showcase = {
    title: project.title || preset?.title || 'Project showcase',
    description: project.description || preset?.description || 'A polished software product built for practical outcomes.',
    image: shouldForceDevVaultLogo ? '/project-showcase/devvault.svg' : resolvedImage,
    logoVariant: isDevVaultProject ? 'devvault-mark' : null,
    techStack,
    github: project.githubUrl || preset?.github || '',
    demo: project.liveDemoUrl || preset?.demo || '',
    featured: Boolean(project.featured),
    order: Number.isInteger(project.displayOrder) ? project.displayOrder : (preset?.order || index + 1),
    status: project.status || preset?.status || 'PLANNING',
    keyFeatures,
  }

  return {
    ...project,
    showcase,
  }
}

export { PROJECT_SHOWCASE_LIBRARY }
