export function getPortfolioPath(username) {
  const normalizedUsername = String(username || '').trim()
  return normalizedUsername ? `/portfolio/${encodeURIComponent(normalizedUsername)}` : '/profile'
}

export function resolvePortfolioResourcePath(value, username) {
  const path = String(value || '')
  const match = path.match(/^\/portfolio\/[^/?#]+(?=\/|[?#]|$)/i)
  if (!match) return path

  return `${getPortfolioPath(username)}${path.slice(match[0].length)}`
}
