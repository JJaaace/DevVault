const isProduction = process.env.NODE_ENV === 'production'

const configuredOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean)

const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5176', 'http://127.0.0.1:5176']

if (isProduction && !configuredOrigins.length) {
  throw new Error('CORS_ORIGINS is required in production.')
}

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.includes(String(origin).replace(/\/$/, ''))) return callback(null, true)
  const error = new Error('Origin is not allowed by DevVault CORS policy.')
  error.statusCode = 403
  return callback(error)
}

module.exports = { corsOptions: { origin: corsOrigin, credentials: true }, allowedOrigins }
