import { authenticatedRequest } from './api'

const RESUME_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

function createResumeError(message, status, code) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function toAbsoluteUrl(path) {
  if (!path) {
    return null
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const base = RESUME_API_BASE_URL
  return new URL(path, base).toString()
}

export async function fetchWorkspaceResume(getToken) {
  const data = await authenticatedRequest('/api/resume', {}, getToken)
  return {
    ...data,
    fileUrl: toAbsoluteUrl(data?.fileUrl),
  }
}

export async function fetchWorkspaceResumePdf(getToken) {
  const token = await getToken()
  const response = await fetch(new URL('/api/resume/file', RESUME_API_BASE_URL).toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    const rawBody = await response.text()
    let parsed

    try {
      parsed = rawBody ? JSON.parse(rawBody) : null
    } catch {
      parsed = null
    }

    if (response.status === 404) {
      throw createResumeError('Resume preview is unavailable right now. Please upload your PDF again.', 404, parsed?.error?.code)
    }

    if (response.status === 401 || response.status === 403) {
      throw createResumeError('Your session expired. Please sign in again to access your resume.', response.status, parsed?.error?.code)
    }

    throw createResumeError(
      parsed?.error?.message || 'Unable to load resume file.',
      response.status,
      parsed?.error?.code,
    )
  }

  const contentType = String(response.headers.get('content-type') || '').toLowerCase()
  if (!contentType.includes('pdf')) {
    throw createResumeError('Resume preview is unavailable right now. Please upload your PDF again.', response.status || 500, 'RESUME_FILE_INVALID_TYPE')
  }

  return response.blob()
}

export async function uploadWorkspaceResume(file, getToken) {
  const fileData = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read resume file.'))
    reader.readAsDataURL(file)
  })

  const data = await authenticatedRequest('/api/resume', {
    method: 'PUT',
    body: JSON.stringify({
      fileName: file.name,
      fileData,
    }),
  }, getToken)

  return {
    ...data,
    fileUrl: toAbsoluteUrl(data?.fileUrl),
  }
}

export async function deleteWorkspaceResume(getToken) {
  await authenticatedRequest('/api/resume', {
    method: 'DELETE',
  }, getToken)
}
