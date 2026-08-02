import { useCallback, useState } from 'react'

function getErrorMessage(error) {
  if (!error) {
    return 'Unexpected error.'
  }

  if (typeof error === 'string') {
    return error
  }

  return error.message || 'Unexpected error.'
}

export function useApiMutation(mutation, options = {}) {
  const { onSuccess, onError } = options
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(async (...args) => {
    setIsPending(true)
    setError(null)

    try {
      const result = await mutation(...args)
      onSuccess?.(result)
      return result
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      onError?.(err)
      throw err
    } finally {
      setIsPending(false)
    }
  }, [mutation, onError, onSuccess])

  return {
    mutate: run,
    isPending,
    error,
    setError,
  }
}
