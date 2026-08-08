const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5001')
const DEFAULT_TIMEOUT_MS = 12000
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

function isRetryableNetworkError(error) {
  if (!error) {
    return false
  }

  return error.name === 'AbortError' || error.name === 'TypeError'
}

function isRetryableResponse(status) {
  return RETRYABLE_STATUS.has(status)
}

function createApiError({ message, status, statusText, code, details, body, path, method }) {
  const error = new Error(message)
  error.status = status
  error.statusText = statusText
  error.code = code
  error.details = details
  error.body = body
  error.path = path
  error.method = method
  return error
}

function sanitizeErrorMessage(message, status, fallbackMessage) {
  const normalized = String(message || '')

  // Hide raw internal runtime exceptions from end users.
  if (status >= 500 && /(cannot read properties of undefined|typeerror|referenceerror|syntaxerror)/i.test(normalized)) {
    return fallbackMessage
  }

  return normalized || fallbackMessage
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function withJitter(baseDelayMs) {
  const jitter = Math.floor(Math.random() * 120)
  return baseDelayMs + jitter
}

function normalizeSuccessPayload(parsedBody) {
  if (parsedBody && typeof parsedBody === 'object' && 'success' in parsedBody) {
    return parsedBody.success ? parsedBody.data : parsedBody
  }

  return parsedBody
}

function parseResponseBody(rawBody, contentType) {
  if (!rawBody) {
    return null
  }

  if (contentType && contentType.includes('application/json')) {
    return JSON.parse(rawBody)
  }

  return rawBody
}

async function executeRequest(path, options = {}, token) {
  const method = options.method || 'GET'
  const headers = new Headers(options.headers || {})

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    const contentType = response.headers.get('content-type')
    const rawBody = await response.text()
    const parsedBody = parseResponseBody(rawBody, contentType)

    if (!response.ok) {
      const fallbackMessage = response.status >= 500
        ? 'Something went wrong while loading workspace data. Please try again.'
        : `Request failed with status ${response.status}`

      const errorMessage =
        sanitizeErrorMessage(
          parsedBody?.error?.message || parsedBody?.message || rawBody,
          response.status,
          fallbackMessage,
        )

      throw createApiError({
        message: errorMessage,
        status: response.status,
        statusText: response.statusText,
        code: parsedBody?.error?.code,
        details: parsedBody?.error?.details || parsedBody?.errors,
        body: rawBody,
        path,
        method,
      })
    }

    return normalizeSuccessPayload(parsedBody)
  } finally {
    clearTimeout(timeoutHandle)
  }
}

async function request(path, options = {}, getToken) {
  const retryCount = Number.isInteger(options.retryCount) ? options.retryCount : 1
  const retryDelayMs = Number.isInteger(options.retryDelayMs) ? options.retryDelayMs : 280
  const token = getToken ? await getToken() : null

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await executeRequest(path, options, token)
    } catch (error) {
      const shouldRetry =
        attempt < retryCount &&
        (isRetryableNetworkError(error) || isRetryableResponse(error.status))

      if (!shouldRetry) {
        throw error
      }

      await wait(withJitter(retryDelayMs * (attempt + 1)))
    }
  }

  throw new Error('Request failed after retry attempts.')
}

export async function authenticatedRequest(path, options = {}, getToken) {
  return request(
    path,
    {
      ...options,
      headers: options.headers,
    },
    async () => getToken(),
  )
}

export async function authenticatedBlobRequest(path, options = {}, getToken) {
  const method = options.method || 'GET'
  const headers = new Headers(options.headers || {})
  const token = await getToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      const rawBody = await response.text()
      let parsedBody = null

      try {
        parsedBody = parseResponseBody(rawBody, contentType)
      } catch {
        parsedBody = null
      }

      const fallbackMessage = response.status >= 500
        ? 'Something went wrong while loading this file. Please try again.'
        : `Request failed with status ${response.status}`

      throw createApiError({
        message: sanitizeErrorMessage(
          parsedBody?.error?.message || parsedBody?.message || rawBody,
          response.status,
          fallbackMessage,
        ),
        status: response.status,
        statusText: response.statusText,
        code: parsedBody?.error?.code,
        details: parsedBody?.error?.details || parsedBody?.errors,
        body: rawBody,
        path,
        method,
      })
    }

    return response.blob()
  } finally {
    clearTimeout(timeoutHandle)
  }
}

export async function publicRequest(path, options = {}) {
  return request(path, {
    ...options,
    headers: options.headers,
  })
}
