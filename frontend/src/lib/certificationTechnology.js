const TECHNOLOGY_KEY_ALIASES = new Map([
  ['node', 'nodejs'],
  ['nodejs', 'nodejs'],
  ['express', 'express'],
  ['expressjs', 'express'],
  ['postgres', 'postgresql'],
  ['postgresql', 'postgresql'],
  ['prisma', 'prisma'],
  ['prismaorm', 'prisma'],
  ['restapi', 'rest-api'],
  ['restapis', 'rest-api'],
  ['githubapi', 'github-api'],
  ['html', 'html5'],
  ['html5', 'html5'],
  ['css', 'css3'],
  ['css3', 'css3'],
])

function normalizeKeyToken(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export function canonicalTechnologyKey(value) {
  const token = normalizeKeyToken(value)
  return TECHNOLOGY_KEY_ALIASES.get(token) || token
}

export function getCanonicalSkillKey(skill) {
  return canonicalTechnologyKey(skill?.technologyKey || skill?.name)
}

export function resolveCertificationTechnology(technology, skills = []) {
  const skillKey = canonicalTechnologyKey(technology)
  const skill = skills.find((candidate) => getCanonicalSkillKey(candidate) === skillKey) || null

  return {
    label: String(technology || '').trim(),
    skillKey: skill ? skillKey : null,
    skill,
  }
}
