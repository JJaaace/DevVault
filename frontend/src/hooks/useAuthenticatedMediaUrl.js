import { useEffect, useMemo, useState } from 'react'
import { frontendEnvironment } from '../config/runtime'
import { authenticatedBlobRequest } from '../lib/api'
import { getAuthenticatedMediaPath, loadAuthenticatedMediaObjectUrl } from '../lib/authenticatedMedia'

export function useAuthenticatedMediaUrl(source, getToken, { enabled = true } = {}) {
  const [resolved, setResolved] = useState(null)
  const protectedPath = useMemo(
    () => enabled ? getAuthenticatedMediaPath(source, frontendEnvironment.apiBaseUrl) : null,
    [enabled, source],
  )

  useEffect(() => {
    if (!protectedPath) return undefined

    let active = true
    let release = () => {}

    loadAuthenticatedMediaObjectUrl(source, getToken, {
      apiBaseUrl: frontendEnvironment.apiBaseUrl,
      request: authenticatedBlobRequest,
      createObjectURL: (blob) => URL.createObjectURL(blob),
      revokeObjectURL: (url) => URL.revokeObjectURL(url),
    }).then((result) => {
      if (!active) {
        result.revoke()
        return
      }

      release = result.revoke
      setResolved({ source, url: result.url, error: null })
    }).catch((error) => {
      if (active) setResolved({ source, url: '', error })
    })

    return () => {
      active = false
      release()
    }
  }, [getToken, protectedPath, source])

  if (!protectedPath) {
    return { src: String(source || ''), loading: false, error: null }
  }

  const current = resolved?.source === source ? resolved : null
  return {
    src: current?.url || '',
    loading: !current,
    error: current?.error || null,
  }
}
