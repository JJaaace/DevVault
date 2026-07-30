export const SKILL_LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
]

const levelMeta = {
  BEGINNER: {
    label: 'Beginner',
    toneClass: 'text-[var(--color-text-soft)]',
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    toneClass: 'text-[var(--color-brand-ink)]',
  },
  ADVANCED: {
    label: 'Advanced',
    toneClass: 'text-[#2c8551]',
  },
  EXPERT: {
    label: 'Expert',
    toneClass: 'text-[#7a3ad6]',
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
