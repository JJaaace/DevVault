export async function authenticatedRequest(path, options = {}, getToken) {
  return request(path, {
    ...options,
    headers: options.headers,
  }, async () => getToken())
}

async function request(path, options = {}, getToken) {
  const token = await getToken()

  const headers = new Headers(options.headers || {})

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type')
  const rawBody = await response.text()

  if (!response.ok) {
    throw new Error(rawBody || 'Request failed')
  }

  if (!rawBody) {
    return null
  }

  if (contentType && contentType.includes('application/json')) {
    return JSON.parse(rawBody)
  }

  return rawBody
}

export async function publicRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type')
  const rawBody = await response.text()

  if (!response.ok) {
    throw new Error(rawBody || 'Request failed')
  }

  if (!rawBody) {
    return null
  }

  if (contentType && contentType.includes('application/json')) {
    return JSON.parse(rawBody)
  }

  return rawBody
}
