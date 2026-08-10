import assert from 'node:assert/strict'
import test from 'node:test'
import { loadPublicPdfObjectUrl } from './publicPdfMedia.js'

test('loads a public PDF as an object URL and revokes it once', async () => {
  const blob = new Blob(['%PDF-test'], { type: 'application/pdf' })
  const requests = []
  const revoked = []
  const result = await loadPublicPdfObjectUrl('https://api.example.test/public/resume', {
    request: async (source) => {
      requests.push(source)
      return blob
    },
    createObjectURL: (value) => {
      assert.equal(value, blob)
      return 'blob:public-pdf'
    },
    revokeObjectURL: (url) => revoked.push(url),
  })

  assert.equal(result.url, 'blob:public-pdf')
  assert.deepEqual(requests, ['https://api.example.test/public/resume'])
  result.revoke()
  result.revoke()
  assert.deepEqual(revoked, ['blob:public-pdf'])
})

test('rejects a non-PDF public media response', async () => {
  await assert.rejects(
    loadPublicPdfObjectUrl('https://api.example.test/public/certificate', {
      request: async () => new Blob(['image'], { type: 'image/png' }),
      createObjectURL: () => 'blob:unexpected',
      revokeObjectURL: () => {},
    }),
    /not a PDF/,
  )
})
