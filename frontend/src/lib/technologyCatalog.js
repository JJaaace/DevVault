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
  html5: {
    key: 'html5',
    label: 'HTML5',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
    accent: '#e34f26',
  },
  css3: {
    key: 'css3',
    label: 'CSS3',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
    accent: '#1572b6',
  },
  sql: {
    key: 'sql',
    label: 'SQL',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    accent: '#3f7cac',
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
  expressjs: {
    key: 'expressjs',
    label: 'Express.js',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
    accent: '#b3b3b3',
  },
  postgres: {
    key: 'postgres',
    label: 'PostgreSQL',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    accent: '#4f89c7',
  },
  prisma: {
    key: 'prisma',
    label: 'Prisma ORM',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg',
    accent: '#7a8da3',
  },
  git: {
    key: 'git',
    label: 'Git',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
    accent: '#f05032',
  },
  github: {
    key: 'github',
    label: 'GitHub',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
    accent: '#dbdbdb',
  },
  clerk: {
    key: 'clerk',
    label: 'Clerk',
    iconUrl: null,
    accent: '#6c47ff',
  },
  'github-api': {
    key: 'github-api',
    label: 'GitHub API',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
    accent: '#a7a7a7',
  },
  'rest-apis': {
    key: 'rest-apis',
    label: 'REST APIs',
    iconUrl: null,
    accent: '#0ea5e9',
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
    accent: '#e79b3f',
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
