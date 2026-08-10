import { useEffect, useMemo, useState } from 'react'
import { publicBlobRequest } from '../lib/api'
import { loadPublicPdfObjectUrl } from '../lib/publicPdfMedia'

export function usePublicPdfObjectUrls(entries, { enabled = true } = {}) {
  const signature = useMemo(
    () => JSON.stringify((enabled ? entries : []).filter((entry) => entry?.key && entry?.source).map((entry) => ({
      key: String(entry.key),
      source: String(entry.source),
    }))),
    [enabled, entries],
  )
  const normalizedEntries = useMemo(() => JSON.parse(signature), [signature])
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!normalizedEntries.length) return undefined

    let active = true
    const releases = []

    Promise.all(normalizedEntries.map(async ({ key, source }) => {
      try {
        const loaded = await loadPublicPdfObjectUrl(source, {
          request: publicBlobRequest,
          createObjectURL: (blob) => URL.createObjectURL(blob),
          revokeObjectURL: (url) => URL.revokeObjectURL(url),
        })
        if (!active) {
          loaded.revoke()
          return [key, '', null]
        }
        releases.push(loaded.revoke)
        return [key, loaded.url, null]
      } catch (error) {
        return [key, '', error]
      }
    })).then((values) => {
      if (!active) return
      setResult({
        signature,
        urls: Object.fromEntries(values.map(([key, url]) => [key, url])),
        errors: Object.fromEntries(values.filter(([, , error]) => error).map(([key, , error]) => [key, error])),
      })
    })

    return () => {
      active = false
      releases.forEach((release) => release())
    }
  }, [normalizedEntries, signature])

  const current = result?.signature === signature ? result : null
  return {
    urls: current?.urls || {},
    errors: current?.errors || {},
    loading: Boolean(normalizedEntries.length && !current),
  }
}
