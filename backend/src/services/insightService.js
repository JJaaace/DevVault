function normalizeProjectStatus(status) {
  if (status === 'IN_PROGRESS') {
    return 'BUILDING'
  }

  if (status === 'PLANNING' || status === 'BUILDING' || status === 'COMPLETED' || status === 'ARCHIVED') {
    return status
  }

  return 'PLANNING'
}

function getProjectStatusCounts(projects = []) {
  return projects.reduce((counts, project) => {
    const status = normalizeProjectStatus(project.status)
    return {
      ...counts,
      [status]: counts[status] + 1,
    }
  }, {
    PLANNING: 0,
    BUILDING: 0,
    COMPLETED: 0,
    ARCHIVED: 0,
  })
}

function getTopSkills(skills = [], limit = 5) {
  const levelRank = {
    BEGINNER: 0,
    ADVANCED_BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
  }

  return [...skills]
    .sort((left, right) => {
      const yearsDelta = Number(right.yearsExperience || 0) - Number(left.yearsExperience || 0)
      if (yearsDelta !== 0) {
        return yearsDelta
      }

      const projectsDelta = Number(right.projectsBuilt || 0) - Number(left.projectsBuilt || 0)
      if (projectsDelta !== 0) {
        return projectsDelta
      }

      const levelDelta = Number(levelRank[right.experienceLevel] || 0) - Number(levelRank[left.experienceLevel] || 0)
      return levelDelta || String(left.name || '').localeCompare(String(right.name || ''))
    })
    .slice(0, limit)
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      yearsExperience: Number(skill.yearsExperience || 0),
      projectsBuilt: Number(skill.projectsBuilt || 0),
      level: skill.experienceLevel,
    }))
}

function createInsight(id, type, priority, title, description, cta) {
  return {
    id,
    type,
    priority,
    title,
    description,
    cta,
  }
}

function buildInsights({ profile, projects, skills, statusCounts }) {
  const insights = []

  if (!profile) {
    insights.push(createInsight(
      'complete-profile',
      'profile',
      'high',
      'Finish your profile setup',
      'Complete profile details to unlock richer portfolio and resume output.',
      { label: 'Open profile', href: '/profile' },
    ))
  }

  if (!projects.length) {
    insights.push(createInsight(
      'create-project',
      'projects',
      'high',
      'Create your first project',
      'Start tracking builds to unlock dashboard intelligence and portfolio momentum.',
      { label: 'Create project', href: '/projects/new' },
    ))
  } else if (statusCounts.BUILDING === 0 && statusCounts.PLANNING > 0) {
    insights.push(createInsight(
      'activate-project',
      'projects',
      'medium',
      'Move one project into building',
      'Progress is clearer when at least one project is actively in the building lane.',
      { label: 'Open projects', href: '/projects' },
    ))
  }

  if (!skills.length) {
    insights.push(createInsight(
      'add-skills',
      'skills',
      'medium',
      'Add your strongest skills',
      'Track core skills so recruiters can quickly understand your technical strengths.',
      { label: 'Open skills', href: '/skills' },
    ))
  }

  if (!insights.length) {
    insights.push(createInsight(
      'keep-shipping',
      'momentum',
      'low',
      'Keep shipping this week',
      'Your profile foundation looks healthy. Focus on shipping one meaningful update.',
      { label: 'Review dashboard', href: '/dashboard' },
    ))
  }

  return insights.sort((left, right) => {
    const rank = { high: 0, medium: 1, low: 2 }
    const leftRank = rank[left.priority] ?? 10
    const rightRank = rank[right.priority] ?? 10
    return leftRank - rightRank || left.id.localeCompare(right.id)
  })
}

function dateValue(value) {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function displayEntityTitle(value) {
  const title = String(value || '').trim()
  if (!title || /\s/.test(title) || !/[-_]/.test(title)) return title
  return title
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

function selectCurrentProject(projects = []) {
  return [...projects]
    .sort((left, right) => {
      const featuredDelta = Number(Boolean(right.featured)) - Number(Boolean(left.featured))
      if (featuredDelta) return featuredDelta

      const statusRank = { BUILDING: 0, PLANNING: 1, COMPLETED: 2, ARCHIVED: 3 }
      const statusDelta = (statusRank[normalizeProjectStatus(left.status)] ?? 9) - (statusRank[normalizeProjectStatus(right.status)] ?? 9)
      if (statusDelta) return statusDelta

      const orderDelta = Number(left.displayOrder ?? Number.MAX_SAFE_INTEGER) - Number(right.displayOrder ?? Number.MAX_SAFE_INTEGER)
      return orderDelta || dateValue(right.updatedAt) - dateValue(left.updatedAt)
    })[0] || null
}

function selectFocusGoals(goals = [], limit = 3) {
  const statusRank = { current: 0, future: 1, complete: 2, archived: 3 }
  return [...goals]
    .filter((goal) => goal.status === 'current' || goal.status === 'future')
    .sort((left, right) => {
      const statusDelta = (statusRank[left.status] ?? 9) - (statusRank[right.status] ?? 9)
      if (statusDelta) return statusDelta
      const pinnedDelta = Number(Boolean(right.pinned)) - Number(Boolean(left.pinned))
      if (pinnedDelta) return pinnedDelta
      return Number(left.displayOrder || 0) - Number(right.displayOrder || 0)
    })
    .slice(0, limit)
}

function selectTechnologyBench(skills = [], profile, currentProject, limit = 8) {
  const favoriteNames = new Set([profile?.favoriteLanguage, profile?.favoriteFramework]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase()))
  const currentStack = new Set([...(currentProject?.techStack || []), ...(currentProject?.githubLanguages || [])]
    .map((value) => String(value).trim().toLowerCase()))
  const levelRank = { BEGINNER: 0, ADVANCED_BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }

  return [...skills]
    .sort((left, right) => {
      const persistedFavoriteDelta = Number(Boolean(right.favorite)) - Number(Boolean(left.favorite))
      if (persistedFavoriteDelta) return persistedFavoriteDelta
      const leftName = String(left.name || '').toLowerCase()
      const rightName = String(right.name || '').toLowerCase()
      const favoriteDelta = Number(favoriteNames.has(rightName)) - Number(favoriteNames.has(leftName))
      if (favoriteDelta) return favoriteDelta
      const currentDelta = Number(currentStack.has(rightName)) - Number(currentStack.has(leftName))
      if (currentDelta) return currentDelta
      const projectsDelta = Number(right.projectsBuilt || 0) - Number(left.projectsBuilt || 0)
      if (projectsDelta) return projectsDelta
      const yearsDelta = Number(right.yearsExperience || 0) - Number(left.yearsExperience || 0)
      if (yearsDelta) return yearsDelta
      const recencyDelta = dateValue(right.lastUsed) - dateValue(left.lastUsed)
      if (recencyDelta) return recencyDelta
      return (levelRank[right.experienceLevel] ?? 0) - (levelRank[left.experienceLevel] ?? 0)
        || leftName.localeCompare(rightName)
    })
    .slice(0, limit)
}

function selectCredentialSpotlight(certifications = []) {
  const earned = certifications
    .filter((certification) => certification.status === 'earned')
    .sort((left, right) => dateValue(right.issueDate) - dateValue(left.issueDate) || Number(right.year || 0) - Number(left.year || 0))[0] || null
  const learning = certifications
    .filter((certification) => certification.status === 'in-progress')
    .sort((left, right) => Number(Boolean(right.featured)) - Number(Boolean(left.featured)) || Number(left.displayOrder || 0) - Number(right.displayOrder || 0))[0] || null
  const planned = certifications
    .filter((certification) => certification.status === 'planned')
    .sort((left, right) => Number(left.year || 0) - Number(right.year || 0) || Number(left.displayOrder || 0) - Number(right.displayOrder || 0))[0] || null

  return { earned, learning, planned }
}

function buildRecentWins({ projects = [], goals = [], certifications = [] }, limit = 5) {
  const projectWins = projects
    .filter((project) => normalizeProjectStatus(project.status) === 'COMPLETED')
    .map((project) => ({
      id: `project-${project.id}`,
      type: 'project',
      title: `Completed ${displayEntityTitle(project.title)}`,
      date: project.completedAt || null,
      href: '/projects',
    }))
  const goalWins = goals
    .filter((goal) => goal.status === 'complete')
    .map((goal) => ({
      id: `goal-${goal.id}`,
      type: 'goal',
      title: `Completed ${goal.title}`,
      date: goal.completedAt || null,
      href: `/goals?goal=${goal.id}`,
    }))
  const credentialWins = certifications
    .filter((certification) => certification.status === 'earned' && certification.issueDate)
    .map((certification) => ({
      id: `certification-${certification.id}`,
      type: 'credential',
      title: `Earned ${certification.name}`,
      date: certification.issueDate,
      href: '/certifications',
    }))

  const selectedWins = [
    ...credentialWins.sort((left, right) => dateValue(right.date) - dateValue(left.date)).slice(0, 2),
    ...goalWins.slice(0, 1),
    ...projectWins.slice(0, 2),
  ]

  return selectedWins.slice(0, limit)
}

function buildCommandDeck({ profile, projects, skills, goals, certifications, resume }) {
  const currentProject = selectCurrentProject(projects)
  const focusGoals = selectFocusGoals(goals)
  const credentialSpotlight = selectCredentialSpotlight(certifications)
  const nextMilestone = [...goals]
    .filter((goal) => (goal.status === 'current' || goal.status === 'future') && dateValue(goal.targetCompletion))
    .sort((left, right) => dateValue(left.targetCompletion) - dateValue(right.targetCompletion))[0] || null

  return {
    currentProject,
    focusGoals,
    nextMilestone,
    technologyBench: selectTechnologyBench(skills, profile, currentProject),
    credentialSpotlight,
    recentWins: buildRecentWins({ projects, goals, certifications }),
    evidence: {
      projects: projects.length,
      technologies: skills.length,
      credentials: certifications.filter((certification) => certification.status === 'earned').length,
      activeGoals: goals.filter((goal) => goal.status === 'current').length,
      githubRepositories: projects.filter((project) => project.githubUrl || project.githubFullName || project.githubRepoId).length,
      hasResume: Boolean(resume?.uploaded),
    },
  }
}

function buildDashboardPayload({ profile, projects = [], skills = [], goals = [], certifications = [], resume = null }) {
  const statusCounts = getProjectStatusCounts(projects)
  const totals = {
    projects: projects.length,
    skills: skills.length,
    planning: statusCounts.PLANNING,
    building: statusCounts.BUILDING,
    completed: statusCounts.COMPLETED,
    archived: statusCounts.ARCHIVED,
    goals: goals.length,
    activeGoals: goals.filter((goal) => goal.status === 'current').length,
    certifications: certifications.length,
    certificationsEarned: certifications.filter((certification) => certification.status === 'earned').length,
  }

  return {
    generatedAt: new Date().toISOString(),
    profile: profile ? {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      username: profile.username || '',
      githubConnected: Boolean(profile.githubUrl),
      currentFocus: profile.currentFocus || '',
    } : null,
    totals,
    statusCounts,
    topSkills: getTopSkills(skills),
    insights: buildInsights({ profile, projects, skills, statusCounts }),
    commandDeck: buildCommandDeck({ profile, projects, skills, goals, certifications, resume }),
    workspace: {
      profile,
      projects,
      skills,
      goals,
      certifications,
      resume,
    },
  }
}

module.exports = {
  buildDashboardPayload,
  buildCommandDeck,
}
