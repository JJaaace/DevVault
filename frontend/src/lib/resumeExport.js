function toText(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).replace(/\s+/g, ' ').trim()
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
    year: 'numeric',
  }).format(date)
}

function listLine(label, value) {
  const text = toText(value)
  return text ? `${label}: ${text}` : ''
}

function joinNonEmpty(items, separator = '\n') {
  return items.filter(Boolean).join(separator)
}

function buildProjectSummary(project) {
  const parts = []

  if (project.status) {
    parts.push(project.status.replace(/_/g, ' ').toLowerCase())
  }

  if (project.targetCompletion) {
    parts.push(`target ${formatDate(project.targetCompletion)}`)
  }

  return parts.join(' · ')
}

function buildSkillSummary(skill) {
  const parts = []

  if (skill.category) {
    parts.push(skill.category)
  }

  if (skill.experienceLevel) {
    parts.push(getSkillLevelMeta(skill.experienceLevel).name)
  }

  if (skill.yearsExperience !== null && skill.yearsExperience !== undefined && skill.yearsExperience !== '') {
    parts.push(`${skill.yearsExperience}y experience`)
  }

  if (skill.projectsBuilt !== null && skill.projectsBuilt !== undefined && skill.projectsBuilt !== '') {
    parts.push(`${skill.projectsBuilt} projects`)
  }

  return parts.join(' · ')
}

export function buildResumeMarkdown(profile, projects = [], skills = []) {
  if (!profile) {
    return ''
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || 'DevVault Profile'
  const headline = [profile.currentRole, profile.location].filter(Boolean).join(' · ')
  const education = joinNonEmpty([
    listLine('School', profile.school || profile.university),
    listLine('Major', profile.major),
    listLine('Graduation', profile.graduationYear),
  ])
  const profileLinks = joinNonEmpty([
    listLine('GitHub', profile.githubUrl),
    listLine('LinkedIn', profile.linkedinUrl),
    listLine('Website', profile.websiteUrl),
  ])

  const sortedProjects = [...projects].sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
  const sortedSkills = [...skills].sort((left, right) => {
    const yearsDelta = Number(right.yearsExperience || 0) - Number(left.yearsExperience || 0)
    if (yearsDelta !== 0) {
      return yearsDelta
    }

    return Number(right.projectsBuilt || 0) - Number(left.projectsBuilt || 0)
  })

  const sections = [
    `# ${fullName}`,
    headline ? `_${headline}_` : '',
    profile.bio ? profile.bio : '',
    '',
    '## Summary',
    joinNonEmpty([
      listLine('Username', profile.username),
      listLine('Years coding', profile.yearsCoding),
      listLine('Favorite language', profile.favoriteLanguage),
      listLine('Favorite framework', profile.favoriteFramework),
    ], '\n'),
    '',
    '## Skills',
    sortedSkills.length
      ? sortedSkills.slice(0, 8).map((skill) => `- ${skill.name}${buildSkillSummary(skill) ? ` (${buildSkillSummary(skill)})` : ''}`).join('\n')
      : '- Add your skills in DevVault to populate this section.',
    '',
    '## Projects',
    sortedProjects.length
      ? sortedProjects.slice(0, 6).map((project) => {
        const summary = buildProjectSummary(project)
        const parts = [`- ${project.title}`]
        if (summary) {
          parts[0] += ` (${summary})`
        }
        if (project.description) {
          parts.push(`  - ${project.description}`)
        }
        if (project.techStack?.length) {
          parts.push(`  - Tech: ${project.techStack.join(', ')}`)
        }
        return parts.join('\n')
      }).join('\n')
      : '- Add your projects in DevVault to populate this section.',
    '',
    '## Education',
    education || '- Add your education details in DevVault.',
    '',
    '## Links',
    profileLinks || '- Add your social links in DevVault.',
  ]

  return sections.filter((section) => section !== '').join('\n') + '\n'
}

export function downloadResumeMarkdown(profile, projects = [], skills = []) {
  if (typeof document === 'undefined') {
    return null
  }

  const markdown = buildResumeMarkdown(profile, projects, skills)
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.username || 'devvault-profile'
  const safeSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'devvault-profile'
  const fileName = `${safeSlug}-resume.md`
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)

  return fileName
}
import { getSkillLevelMeta } from './skillUtils'
