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

      return Number(right.percentage || 0) - Number(left.percentage || 0)
    })
    .slice(0, limit)
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      yearsExperience: Number(skill.yearsExperience || 0),
      projectsBuilt: Number(skill.projectsBuilt || 0),
      percentage: Number(skill.percentage || 0),
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

function buildDashboardPayload({ profile, projects = [], skills = [] }) {
  const statusCounts = getProjectStatusCounts(projects)
  const totals = {
    projects: projects.length,
    skills: skills.length,
    planning: statusCounts.PLANNING,
    building: statusCounts.BUILDING,
    completed: statusCounts.COMPLETED,
    archived: statusCounts.ARCHIVED,
  }

  return {
    generatedAt: new Date().toISOString(),
    profile: profile ? {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      username: profile.username || '',
      githubLastSyncedAt: profile.githubLastSyncedAt || null,
    } : null,
    totals,
    statusCounts,
    topSkills: getTopSkills(skills),
    insights: buildInsights({ profile, projects, skills, statusCounts }),
  }
}

module.exports = {
  buildDashboardPayload,
}
