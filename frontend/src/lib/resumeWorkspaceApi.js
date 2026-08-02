import { authenticatedRequest } from './api'

function toAbsoluteUrl(path) {
  if (!path) {
    return null
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin
  return new URL(path, base).toString()
}

export async function fetchWorkspaceResume(getToken) {
  const data = await authenticatedRequest('/api/resume', {}, getToken)
  return {
    ...data,
    fileUrl: toAbsoluteUrl(data?.fileUrl),
  }
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
