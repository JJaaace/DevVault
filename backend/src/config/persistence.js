const SUPPORTED_MODES = new Set(['postgres', 'local'])

const persistenceMode = String(process.env.PERSISTENCE_MODE || 'postgres').trim().toLowerCase()

if (!SUPPORTED_MODES.has(persistenceMode)) {
  throw new Error(`Unsupported PERSISTENCE_MODE "${process.env.PERSISTENCE_MODE}". Use "postgres" or "local".`)
}

if (persistenceMode === 'local' && process.env.NODE_ENV === 'production') {
  throw new Error('PERSISTENCE_MODE=local is not allowed when NODE_ENV=production.')
}

if (persistenceMode === 'postgres' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required when PERSISTENCE_MODE=postgres.')
}

function isPostgresMode() {
  return persistenceMode === 'postgres'
}

function isLocalMode() {
  return persistenceMode === 'local'
}

module.exports = {
  persistenceMode,
  isPostgresMode,
  isLocalMode,
}
