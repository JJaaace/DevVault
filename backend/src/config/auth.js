const { environment } = require('./environment')

const hasClerkConfig = environment.hasClerkConfig

module.exports = {
  hasClerkConfig,
  allowDevAuth: !environment.isProduction && !hasClerkConfig,
}
