export const SKILL_LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: '🌱 Learning' },
  { value: 'ADVANCED_BEGINNER', label: '⚡ Comfortable' },
  { value: 'INTERMEDIATE', label: '⚡ Comfortable' },
  { value: 'ADVANCED', label: '🚀 Confident' },
  { value: 'EXPERT', label: '🏆 Advanced' },
]

const levelMeta = {
  BEGINNER: {
    label: '🌱 Learning',
    toneClass: 'text-[var(--color-text-soft)]',
  },
  ADVANCED_BEGINNER: {
    label: '⚡ Comfortable',
    toneClass: 'text-[#d9ad74]',
  },
  INTERMEDIATE: {
    label: '⚡ Comfortable',
    toneClass: 'text-[var(--color-brand-ink)]',
  },
  ADVANCED: {
    label: '🚀 Confident',
    toneClass: 'text-[#dfb983]',
  },
  EXPERT: {
    label: '🏆 Advanced',
    toneClass: 'text-[#e58f3d]',
  },
}

export function getSkillLevelMeta(level) {
  return levelMeta[level] || levelMeta.BEGINNER
}

export function formatSkillDate(value) {
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

export function formatSkillRelativeDate(value) {
  const formatted = formatSkillDate(value)
  return formatted ? `Last used ${formatted}` : 'Recently used'
}

export function formatYearsExperience(value) {
  const years = Number(value || 0)
  if (!Number.isFinite(years) || years <= 0) {
    return 'Less than 1 year'
  }

  return years === 1 ? '1 year' : `${years} years`
}

export function skillTextareaToList(value) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function skillListToTextarea(value) {
  if (!value) {
    return ''
  }

  return Array.isArray(value) ? value.join('\n') : String(value)
}

export function normalizeSkillDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const DEFAULT_SKILL_COLOR = '#ea8b21'
