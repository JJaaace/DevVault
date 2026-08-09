const REDACTED = '[REDACTED]'
const SENSITIVE_KEY = /authorization|cookie|secret|token|password|database.?url|content|assetdata|filedata|profileimage/i
const DATA_URL = /data:[^;,\s]+;base64,[A-Za-z0-9+/=\s]+/gi
const BEARER_TOKEN = /Bearer\s+[A-Za-z0-9._~-]+/gi

function sanitize(value, key = '', depth = 0) {
  if (SENSITIVE_KEY.test(key)) return REDACTED
  if (depth > 4) return '[TRUNCATED]'
  if (value instanceof Error) return { name: value.name, message: sanitizeText(value.message), code: value.code }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, '', depth + 1))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, sanitize(childValue, childKey, depth + 1)]))
  }
  return typeof value === 'string' ? sanitizeText(value) : value
}

function sanitizeText(value) {
  return String(value || '').replace(DATA_URL, '[REDACTED_DATA_URL]').replace(BEARER_TOKEN, 'Bearer [REDACTED]')
}

function write(level, event, details = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event: sanitizeText(event),
    ...sanitize(details),
  }
  const output = JSON.stringify(record)
  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.log(output)
}

const logger = {
  info: (event, details) => write('info', event, details),
  warn: (event, details) => write('warn', event, details),
  error: (event, details) => write('error', event, details),
}

module.exports = { logger, sanitize, sanitizeText }
