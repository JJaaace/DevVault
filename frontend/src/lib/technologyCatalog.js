export const technologyCatalog = {
  java: {
    key: 'java',
    label: 'Java',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    accent: '#f59f2f',
  },
  python: {
    key: 'python',
    label: 'Python',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    accent: '#5f8de6',
  },
  javascript: {
    key: 'javascript',
    label: 'JavaScript',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    accent: '#f7c948',
  },
  typescript: {
    key: 'typescript',
    label: 'TypeScript',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    accent: '#5ca6ff',
  },
  react: {
    key: 'react',
    label: 'React',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    accent: '#61dafb',
  },
  nodejs: {
    key: 'nodejs',
    label: 'Node.js',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    accent: '#7fc65b',
  },
  postgres: {
    key: 'postgres',
    label: 'PostgreSQL',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    accent: '#4f89c7',
  },
  aws: {
    key: 'aws',
    label: 'AWS',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    accent: '#f59e0b',
  },
}

export function getTechnologyMeta(technologyKey, fallbackName = '') {
  const normalizedKey = typeof technologyKey === 'string'
    ? technologyKey.trim().toLowerCase().replace(/\s+/g, '')
    : ''

  const candidate = technologyCatalog[normalizedKey]
  if (candidate) {
    return candidate
  }

  const fallbackLabel = fallbackName || technologyKey || 'Tech'
  const initials = String(fallbackLabel)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || '')
    .join('') || 'T'

  return {
    key: normalizedKey || 'custom',
    label: fallbackLabel,
    iconUrl: null,
    accent: '#61dafb',
    initials,
  }
}

export function getTechnologyOptions() {
  return Object.values(technologyCatalog)
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((tech) => ({
      value: tech.key,
      label: tech.label,
    }))
}
