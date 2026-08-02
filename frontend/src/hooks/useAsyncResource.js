import { useCallback, useEffect, useRef, useState } from 'react'

function getErrorMessage(error) {
  if (!error) {
    return 'Unexpected error.'
  }

  if (typeof error === 'string') {
    return error
  }

  return error.message || 'Unexpected error.'
}

export function useAsyncResource(loader, options = {}) {
  const {
    immediate = true,
    onSuccess,
    onError,
    initialData = null,
  } = options

  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(immediate))
  const requestIdRef = useRef(0)

  const run = useCallback(async (...args) => {
    const nextRequestId = requestIdRef.current + 1
    requestIdRef.current = nextRequestId
    setIsLoading(true)
    setError(null)

    try {
      const result = await loader(...args)

      if (requestIdRef.current !== nextRequestId) {
        return null
      }

      setData(result)
      onSuccess?.(result)
      return result
    } catch (err) {
      if (requestIdRef.current === nextRequestId) {
        setError(getErrorMessage(err))
      }

      onError?.(err)
      throw err
    } finally {
      if (requestIdRef.current === nextRequestId) {
        setIsLoading(false)
      }
    }
  }, [loader, onError, onSuccess])

  useEffect(() => {
    if (!immediate) {
      return
    }

    const timeoutId = setTimeout(() => {
      run().catch(() => {
        // Errors are already reflected in state.
      })
    }, 0)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [immediate, run])

  return {
    data,
    error,
    isLoading,
    reload: run,
    setData,
  }
}
