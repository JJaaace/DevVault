export async function loadPublicPdfObjectUrl(source, options) {
  const {
    request,
    createObjectURL,
    revokeObjectURL,
  } = options || {}

  if (!source || typeof request !== 'function' || typeof createObjectURL !== 'function' || typeof revokeObjectURL !== 'function') {
    throw new TypeError('Public PDF loading requires a source, request, and object URL helpers.')
  }

  const blob = await request(source)
  if (blob.type && blob.type.toLowerCase() !== 'application/pdf') {
    throw new TypeError('Public media response is not a PDF.')
  }

  const url = createObjectURL(blob)
  let revoked = false
  return {
    url,
    revoke() {
      if (revoked) return
      revoked = true
      revokeObjectURL(url)
    },
  }
}
