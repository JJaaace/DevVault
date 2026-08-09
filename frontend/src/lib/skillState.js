export function getGuestSkillSource(isGuestMode, portfolio) {
  if (!isGuestMode || !portfolio) {
    return { profile: null, skills: [], projects: [] }
  }

  return {
    profile: portfolio.profile || null,
    skills: Array.isArray(portfolio.skills) ? portfolio.skills : [],
    projects: Array.isArray(portfolio.projects) ? portfolio.projects : [],
  }
}

export function applySavedSkill(skills, savedSkill) {
  if (!savedSkill?.id) return Array.isArray(skills) ? skills : []

  const current = Array.isArray(skills) ? skills : []
  const exists = current.some((skill) => skill.id === savedSkill.id)
  const next = current.map((skill) => {
    if (skill.id === savedSkill.id) return savedSkill
    return savedSkill.favorite && skill.favorite ? { ...skill, favorite: false } : skill
  })

  return exists ? next : [savedSkill, ...next]
}

export function buildSkillUpdatePayload(skill, overrides = {}) {
  return {
    name: skill.name,
    technologyKey: skill.technologyKey,
    category: skill.category,
    experienceLevel: skill.experienceLevel,
    yearsExperience: skill.yearsExperience,
    firstUsedYear: skill.firstUsedYear,
    color: skill.color,
    lastUsed: skill.lastUsed,
    notes: skill.notes || '',
    relatedProjectIds: (skill.relatedProjects || []).map((project) => project.id),
    favorite: Boolean(skill.favorite),
    publicVisible: skill.publicVisible ?? true,
    ...overrides,
  }
}
