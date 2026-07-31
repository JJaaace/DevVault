function toDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateKey(date) {
  return date.toISOString().slice(0, 10)
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function getUniqueDates(entries) {
  return [...new Set(entries.map((entry) => dateKey(entry.date)))]
}

export function calculateProfileCompletion(profile) {
  const requiredFields = [
    profile?.firstName,
    profile?.lastName,
    profile?.username,
    profile?.bio,
    profile?.profileImageUrl || profile?.profileImage,
    profile?.school || profile?.university,
    profile?.major,
    profile?.location || [profile?.state, profile?.country].filter(Boolean).join(', '),
    profile?.currentRole,
    profile?.favoriteLanguage,
    profile?.favoriteFramework,
    profile?.yearsCoding !== null && profile?.yearsCoding !== undefined && profile?.yearsCoding !== '',
    (profile?.dreamCompanies || []).length > 0,
    (profile?.interests || []).length > 0,
  ]

  const completed = requiredFields.filter(Boolean).length
  const percentage = requiredFields.length ? Math.round((completed / requiredFields.length) * 100) : 0

  return { completed, total: requiredFields.length, percentage }
}

export function buildRecentActivity(profile, projects = [], skills = []) {
  const entries = []

  const profileDate = profile?.savedAt || profile?.updatedAt || profile?.createdAt
  const parsedProfileDate = toDate(profileDate)
  if (parsedProfileDate) {
    entries.push({
      type: 'profile',
      label: 'Profile updated',
      description: profile?.savedAt ? 'Saved locally and synced to your workspace.' : 'Workspace profile refreshed.',
      date: parsedProfileDate,
    })
  }

  projects.forEach((project) => {
    const projectDate = toDate(project.updatedAt || project.createdAt)
    if (!projectDate) {
      return
    }

    entries.push({
      type: 'project',
      label: project.title,
      description: `${project.status.replace('_', ' ').toLowerCase()} • ${project.completionPercentage}% complete`,
      date: projectDate,
    })
  })

  skills.forEach((skill) => {
    const skillDate = toDate(skill.updatedAt || skill.createdAt)
    if (!skillDate) {
      return
    }

    entries.push({
      type: 'skill',
      label: skill.name,
      description: `${skill.category} • ${skill.percentage}%`,
      date: skillDate,
    })
  })

  return entries.sort((left, right) => right.date - left.date).slice(0, 5)
}

export function buildActivitySeries(entries) {
  const today = startOfToday()
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return date
  })

  const counts = dates.map((date) => {
    const key = dateKey(date)
    return entries.filter((entry) => dateKey(entry.date) === key).length
  })

  return counts
}

export function calculateCurrentStreak(entries) {
  if (!entries.length) {
    return 0
  }

  const sortedDates = entries.map((entry) => entry.date).sort((left, right) => right - left)
  const latestDate = sortedDates[0]
  const daysSinceToday = Math.floor((startOfToday() - new Date(latestDate.setHours(0, 0, 0, 0))) / 86400000)

  if (daysSinceToday > 1) {
    return 0
  }

  const dateSet = new Set(getUniqueDates(entries))
  let streak = 0
  const cursor = new Date(latestDate)
  cursor.setHours(0, 0, 0, 0)

  while (dateSet.has(dateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function buildWorkspaceStats(profile, projects = [], skills = [], activityEntries = []) {
  const profileCompletion = calculateProfileCompletion(profile)
  const averageProjectProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.completionPercentage || 0), 0) / projects.length)
    : 0
  const averageSkillProgress = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + Number(skill.percentage || 0), 0) / skills.length)
    : 0

  return {
    profileCompletion: profileCompletion.percentage,
    projectCount: projects.length,
    averageProjectProgress,
    skillCount: skills.length,
    averageSkillProgress,
    currentStreak: calculateCurrentStreak(activityEntries),
  }
}

export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getCurrentProfileCompletion(profile) {
  return calculateProfileCompletion(profile).percentage
}

function getIncompleteProfileFields(profile) {
  const fields = [
    ['first name', profile?.firstName],
    ['last name', profile?.lastName],
    ['username', profile?.username],
    ['bio', profile?.bio],
    ['avatar', profile?.profileImageUrl || profile?.profileImage],
    ['school', profile?.school || profile?.university],
    ['major', profile?.major],
    ['location', profile?.location || [profile?.state, profile?.country].filter(Boolean).join(', ')],
    ['current role', profile?.currentRole],
    ['favorite language', profile?.favoriteLanguage],
    ['favorite framework', profile?.favoriteFramework],
    ['years coding', profile?.yearsCoding !== null && profile?.yearsCoding !== undefined && profile?.yearsCoding !== ''],
    ['dream companies', (profile?.dreamCompanies || []).length > 0],
    ['interests', (profile?.interests || []).length > 0],
  ]

  return fields.filter(([, value]) => !value).map(([label]) => label)
}

function getActiveProjects(projects = []) {
  return projects.filter((project) => project.status !== 'ARCHIVED')
}

function getSoonestDeadlineProject(projects = []) {
  return projects
    .map((project) => ({
      ...project,
      deadline: project.targetCompletion ? new Date(project.targetCompletion) : null,
    }))
    .filter((project) => project.deadline && !Number.isNaN(project.deadline.getTime()))
    .filter((project) => project.deadline >= startOfToday())
    .sort((left, right) => left.deadline - right.deadline)[0] || null
}

function getLowestProgressProject(projects = []) {
  const activeProjects = getActiveProjects(projects)
  if (!activeProjects.length) {
    return null
  }

  return [...activeProjects]
    .sort((left, right) => Number(left.completionPercentage || 0) - Number(right.completionPercentage || 0))[0]
}

function getLowestProgressSkill(skills = []) {
  if (!skills.length) {
    return null
  }

  return [...skills]
    .sort((left, right) => Number(left.percentage || 0) - Number(right.percentage || 0))[0]
}

export function buildHeroFocus(profile, projects = [], skills = []) {
  const profileCompletion = getCurrentProfileCompletion(profile)
  const deadlineProject = getSoonestDeadlineProject(projects)
  const activeProject = getLowestProgressProject(projects)
  const lowestSkill = getLowestProgressSkill(skills)
  const incompleteFields = getIncompleteProfileFields(profile)

  if (profileCompletion < 100 && incompleteFields.length) {
    return {
      eyebrow: 'Current focus',
      title: 'Finish your profile',
      detail: `${incompleteFields.length} fields still need attention.`,
      meta: `Missing ${incompleteFields.slice(0, 3).join(', ')}`,
      href: profile ? '/profile/edit' : '/profile',
      actionLabel: profile ? 'Edit profile' : 'Create profile',
    }
  }

  if (deadlineProject) {
    return {
      eyebrow: 'Current focus',
      title: deadlineProject.title,
      detail: `${deadlineProject.completionPercentage || 0}% complete · due ${formatDate(deadlineProject.deadline)}`,
      meta: deadlineProject.status.replace('_', ' ').toLowerCase(),
      href: '/projects',
      actionLabel: 'Open project',
    }
  }

  if (activeProject) {
    return {
      eyebrow: 'Current focus',
      title: activeProject.title,
      detail: `${activeProject.completionPercentage || 0}% complete · ${activeProject.status.replace('_', ' ').toLowerCase()}`,
      meta: 'Most active project',
      href: '/projects',
      actionLabel: 'Open project',
    }
  }

  if (lowestSkill) {
    return {
      eyebrow: 'Current focus',
      title: lowestSkill.name,
      detail: `${lowestSkill.percentage || 0}% complete · ${lowestSkill.category || 'Skill'}`,
      meta: 'Growth lane',
      href: '/skills',
      actionLabel: 'Open skill',
    }
  }

  return {
    eyebrow: 'Current focus',
    title: 'Add your first project',
    detail: 'A project gives the dashboard live work to track.',
    meta: 'No active work yet',
    href: '/projects/new',
    actionLabel: 'Create project',
  }
}

export function buildHeroDeadline(projects = []) {
  const deadlineProject = getSoonestDeadlineProject(projects)

  if (!deadlineProject) {
    return {
      label: 'Upcoming deadline',
      title: 'No deadline added',
      detail: 'Add one in Projects to turn this card into a live target.',
      href: '/projects/new',
      actionLabel: 'Set deadline',
    }
  }

  return {
    label: 'Upcoming deadline',
    title: deadlineProject.title,
    detail: `Due ${formatDate(deadlineProject.deadline)} · ${deadlineProject.completionPercentage || 0}% complete`,
    href: '/projects',
    actionLabel: 'Open project',
  }
}

export function buildHeroQuickStats(profile, projects = [], skills = [], activityEntries = []) {
  const profileCompletion = calculateProfileCompletion(profile).percentage
  const activeProjects = getActiveProjects(projects)
  const upcomingCount = projects.filter((project) => {
    if (!project.targetCompletion) {
      return false
    }

    const deadline = new Date(project.targetCompletion)
    return !Number.isNaN(deadline.getTime()) && deadline >= startOfToday()
  }).length

  return [
    { label: 'Profile', value: `${profileCompletion}%`, note: 'Completion' },
    { label: 'Projects', value: activeProjects.length, note: 'Active' },
    { label: 'Skills', value: skills.length, note: 'Tracked' },
    { label: 'Streak', value: `${calculateCurrentStreak(activityEntries)}d`, note: 'Coding days' },
    { label: 'Deadlines', value: upcomingCount, note: 'Upcoming' },
  ]
}

export function buildHeroQuickActions(profile, projects = [], skills = [], deadline) {
  const profileCompletion = calculateProfileCompletion(profile).percentage
  const actions = []

  actions.push({
    label: profileCompletion < 100 ? 'Finish profile' : 'Edit profile',
    href: profileCompletion < 100 ? '/profile' : '/profile/edit',
    tone: profileCompletion < 100 ? 'primary' : 'secondary',
  })

  actions.push({
    label: projects.length ? 'Open projects' : 'Create project',
    href: projects.length ? '/projects' : '/projects/new',
    tone: 'secondary',
  })

  actions.push({
    label: skills.length ? 'Open skills' : 'Add skill',
    href: '/skills',
    tone: 'secondary',
  })

  if (deadline?.href && deadline?.actionLabel) {
    actions.unshift({
      label: deadline.actionLabel,
      href: deadline.href,
      tone: 'accent',
    })
  }

  return actions.slice(0, 4)
}

export function buildHeroProgress(profile, projects = [], skills = []) {
  const profileCompletion = calculateProfileCompletion(profile).percentage
  const projectMomentum = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.completionPercentage || 0), 0) / projects.length)
    : 0
  const skillMomentum = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + Number(skill.percentage || 0), 0) / skills.length)
    : 0

  return [
    { label: 'Profile', value: profileCompletion, note: 'Ready for recruiters' },
    { label: 'Projects', value: projectMomentum, note: 'Build momentum' },
    { label: 'Skills', value: skillMomentum, note: 'Stay sharp' },
  ]
}

export function buildOnboardingChecklist(profile, projects = [], skills = []) {
  const profileCompletion = calculateProfileCompletion(profile).percentage

  return [
    {
      label: 'Complete your profile',
      href: profile ? '/profile/edit' : '/profile',
      done: profileCompletion >= 100,
      note: profileCompletion >= 100 ? 'Profile complete' : 'Fill in the missing details',
    },
    {
      label: 'Add your first project',
      href: '/projects/new',
      done: projects.length > 0,
      note: projects.length > 0 ? `${projects.length} project${projects.length === 1 ? '' : 's'} tracked` : 'Showcase work you have shipped',
    },
    {
      label: 'Add your first skill',
      href: '/skills',
      done: skills.length > 0,
      note: skills.length > 0 ? `${skills.length} skill${skills.length === 1 ? '' : 's'} tracked` : 'Start your growth map',
    },
  ]
}

export function buildProjectProgressSummary(projects = []) {
  const activeProjects = projects.filter((project) => project.status !== 'ARCHIVED')
  const topProjects = [...activeProjects].sort((left, right) => right.completionPercentage - left.completionPercentage).slice(0, 3)

  return {
    activeProjects,
    topProjects,
    average: projects.length
      ? Math.round(projects.reduce((sum, project) => sum + Number(project.completionPercentage || 0), 0) / projects.length)
      : 0,
  }
}

export function buildSkillOverviewSummary(skills = []) {
  const topSkills = [...skills].sort((left, right) => right.percentage - left.percentage).slice(0, 3)
  const categories = [...new Set(skills.map((skill) => skill.category).filter(Boolean))].sort((left, right) => left.localeCompare(right))

  return {
    topSkills,
    categories,
    average: skills.length
      ? Math.round(skills.reduce((sum, skill) => sum + Number(skill.percentage || 0), 0) / skills.length)
      : 0,
  }
}

export function buildLearningGoals(profile, projects = [], skills = []) {
  const profileCompletion = calculateProfileCompletion(profile).percentage
  const projectCompletion = projects.length
    ? Math.round((projects.filter((project) => project.status === 'COMPLETED').length / projects.length) * 100)
    : 0
  const skillCompletion = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + Number(skill.percentage || 0), 0) / skills.length)
    : 0

  return [
    {
      title: 'Complete profile',
      progress: profileCompletion,
      note: 'Keep your professional story sharp and recruiter-ready.',
    },
    {
      title: 'Ship more projects',
      progress: projectCompletion,
      note: 'Use projects to show momentum and product thinking.',
    },
    {
      title: 'Push core skills',
      progress: skillCompletion,
      note: 'Keep progress visible so learning stays intentional.',
    },
  ]
}

export function buildUpcomingDeadlines(projects = []) {
  const upcoming = projects
    .map((project) => ({
      ...project,
      deadline: toDate(project.targetCompletion),
    }))
    .filter((project) => project.deadline)
    .filter((project) => project.deadline >= startOfToday())
    .sort((left, right) => left.deadline - right.deadline)

  return upcoming.slice(0, 4)
}

export function buildCertificationsOverview() {
  return [
    {
      name: 'Cloud foundations',
      progress: 18,
      note: 'Track certificates that support platform and deployment work.',
    },
    {
      name: 'Frontend systems',
      progress: 42,
      note: 'Use this to follow badges tied to accessibility and UI craftsmanship.',
    },
    {
      name: 'Security basics',
      progress: 12,
      note: 'Keep future compliance and security learning visible.',
    },
  ]
}

export function buildInternshipTracker() {
  return [
    { stage: 'Applied', count: 0, description: 'Applications sent out and waiting for responses.' },
    { stage: 'Interviewing', count: 0, description: 'Track conversations that are already moving forward.' },
    { stage: 'Offers', count: 0, description: 'A clear place to compare opportunities when they arrive.' },
  ]
}