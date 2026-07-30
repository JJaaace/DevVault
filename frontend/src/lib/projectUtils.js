export const PROJECT_STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const statusMeta = {
  PLANNING: {
    label: 'Planning',
    badgeClass: 'chip',
    toneClass: 'text-[var(--color-text-soft)]',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badgeClass: 'chip chip--accent',
    toneClass: 'text-[var(--color-brand-ink)]',
  },
  COMPLETED: {
    label: 'Completed',
    badgeClass: 'chip border-[rgba(44,133,72,0.16)] bg-[rgba(236,249,242,0.95)] text-[#2c8551]',
    toneClass: 'text-[#2c8551]',
  },
  ARCHIVED: {
    label: 'Archived',
    badgeClass: 'chip bg-[rgba(241,236,229,0.95)] text-[var(--color-text-muted)]',
    toneClass: 'text-[var(--color-text-muted)]',
  },
}

export function getProjectStatusMeta(status) {
  return statusMeta[status] || statusMeta.PLANNING
}

export function formatProjectDate(value) {
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

export function formatProjectRelativeDate(value) {
  const formatted = formatProjectDate(value)
  return formatted ? `Updated ${formatted}` : 'Recently updated'
}

export function listToTextarea(value) {
  if (!value) {
    return ''
  }

  return Array.isArray(value) ? value.join('\n') : String(value)
}

export function textareaToList(value) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function toDateInputValue(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

export function toDateOrNull(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}