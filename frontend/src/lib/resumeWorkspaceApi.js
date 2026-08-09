import { authenticatedBlobRequest, authenticatedRequest, getApiAssetUrl } from './api'

export async function fetchWorkspaceResume(getToken) {
  const data = await authenticatedRequest('/api/resume', {}, getToken)
  return {
    ...data,
    fileUrl: getApiAssetUrl(data?.fileUrl),
  }
}

export async function fetchWorkspaceResumePdf(getToken) {
  return authenticatedBlobRequest('/api/resume/file', {}, getToken)
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
    fileUrl: getApiAssetUrl(data?.fileUrl),
  }
}

export async function deleteWorkspaceResume(getToken) {
  await authenticatedRequest('/api/resume', {
    method: 'DELETE',
  }, getToken)
}
