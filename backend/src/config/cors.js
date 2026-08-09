const { environment } = require('./environment')

const allowedOrigins = environment.corsOrigins.length
  ? environment.corsOrigins
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5176', 'http://127.0.0.1:5176']

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.includes(String(origin).replace(/\/$/, ''))) return callback(null, true)
  const error = new Error('Origin is not allowed by DevVault CORS policy.')
  error.statusCode = 403
  error.code = 'CORS_ORIGIN_DENIED'
  return callback(error)
}

module.exports = {
  corsOptions: {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  },
  allowedOrigins,
}
