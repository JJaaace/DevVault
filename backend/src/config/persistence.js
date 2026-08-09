const { environment } = require('./environment')

const persistenceMode = environment.persistenceMode

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
