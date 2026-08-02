function normalizeGitHubUsername(value) {
  if (!value || typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const sshMatch = trimmed.match(/github\.com:([^/]+)\//i)
  if (sshMatch?.[1]) {
    return sshMatch[1].replace(/\.$/, '')
  }

  try {
    const parsedUrl = new URL(trimmed)
    if (parsedUrl.hostname.toLowerCase().includes('github.com')) {
      const segments = parsedUrl.pathname.split('/').filter(Boolean)
      if (segments[0] === 'users' || segments[0] === 'orgs') {
        return (segments[1] || '').replace(/\.$/, '')
      }

      return (segments[0] || '').replace(/\.$/, '')
    }
  } catch {
    // fall through to path parsing
  }

  const pathMatch = trimmed.match(/github\.com\/(.+)$/i)
  if (pathMatch?.[1]) {
    const segments = pathMatch[1].split('/').filter(Boolean)
    if (segments[0] === 'users' || segments[0] === 'orgs') {
      return (segments[1] || '').replace(/\.$/, '')
    }

    return (segments[0] || '').replace(/\.$/, '')
  }

  return trimmed.replace(/^@/, '').replace(/\/$/, '').replace(/\.$/, '')
}

async function fetchGitHubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(payload || `GitHub request failed with status ${response.status}`)
  }

  return response.json()
}

export function extractGitHubUsername(value) {
  return normalizeGitHubUsername(value)
}

export async function fetchGitHubProfile(username) {
  const normalizedUsername = normalizeGitHubUsername(username)
  if (!normalizedUsername) {
    throw new Error('GitHub username is required.')
  }

  return fetchGitHubJson(`https://api.github.com/users/${encodeURIComponent(normalizedUsername)}`)
}

export async function fetchGitHubRepos(username) {
  const normalizedUsername = normalizeGitHubUsername(username)
  if (!normalizedUsername) {
    throw new Error('GitHub username is required.')
  }

  const repos = await fetchGitHubJson(`https://api.github.com/users/${encodeURIComponent(normalizedUsername)}/repos?per_page=100&sort=updated`)
  return Array.isArray(repos) ? repos : []
}

export function buildGitHubProfileDraft(profile, githubUser) {
  const nameParts = typeof githubUser?.name === 'string' ? githubUser.name.trim().split(/\s+/) : []
  const currentGithubUrl = profile?.githubUrl || profile?.websiteUrl || ''
  const githubUrl = githubUser?.html_url || currentGithubUrl

  return {
    ...profile,
    firstName: profile?.firstName || nameParts[0] || profile?.username || githubUser?.login || '',
    lastName: profile?.lastName || nameParts.slice(1).join(' ') || '',
    bio: githubUser?.bio || profile?.bio || '',
    profileImageUrl: githubUser?.avatar_url || profile?.profileImageUrl || profile?.profileImage || '',
    location: githubUser?.location || profile?.location || '',
    websiteUrl: githubUser?.blog || profile?.websiteUrl || '',
    githubUrl,
  }
}

export function buildGitHubProfilePayload(profile, githubUser) {
  const draft = buildGitHubProfileDraft(profile, githubUser)

  return {
    firstName: draft.firstName,
    lastName: draft.lastName,
    username: draft.username || githubUser?.login || profile?.username || '',
    bio: draft.bio || '',
    profileImageUrl: draft.profileImageUrl || '',
    school: profile?.school || profile?.university || '',
    graduationYear: profile?.graduationYear ?? '',
    major: profile?.major || '',
    location: draft.location || '',
    dreamCompanies: Array.isArray(profile?.dreamCompanies) ? profile.dreamCompanies : [],
    currentRole: profile?.currentRole || '',
    favoriteLanguage: profile?.favoriteLanguage || '',
    favoriteFramework: profile?.favoriteFramework || '',
    yearsCoding: profile?.yearsCoding ?? '',
    interests: Array.isArray(profile?.interests) ? profile.interests : [],
    githubUrl: draft.githubUrl || '',
    linkedinUrl: profile?.linkedinUrl || '',
    websiteUrl: githubUser?.blog || profile?.websiteUrl || '',
  }
}

export function buildGitHubProjectDrafts(repos = []) {
  return repos
    .filter((repo) => !repo.fork)
    .map((repo) => ({
      title: repo.name,
      description: repo.description && repo.description.trim().length >= 20 ? repo.description.trim() : 'Open-source project imported from GitHub.',
      githubUrl: repo.html_url,
      liveDemoUrl: repo.homepage || '',
      bannerImageUrl: repo.owner?.avatar_url || '',
      techStack: [repo.language].filter(Boolean),
      status: repo.archived ? 'ARCHIVED' : 'PLANNING',
      dateStarted: repo.created_at || null,
      targetCompletion: null,
      challenges: '',
      lessonsLearned: '',
    }))
}