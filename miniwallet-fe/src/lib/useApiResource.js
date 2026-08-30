import { useCallback, useEffect, useState } from 'react'
import api from './api.js'

/**
 * GET a resource whenever `params` change, exposing loading and error state.
 *
 * The request lives inside an async function so that state updates happen after
 * an await rather than synchronously during the effect, and a `cancelled` flag
 * drops responses that arrive after the inputs changed (or the component
 * unmounted), which is what prevents a slow first request from overwriting a
 * fresh one.
 */
export function useApiResource(path, { params, select } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const serialisedParams = JSON.stringify(params ?? {})

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const response = await api.get(path, {
          params: JSON.parse(serialisedParams),
        })

        if (cancelled) return

        setData(select ? select(response.data) : response.data)
        setError('')
      } catch (requestError) {
        if (cancelled) return

        setData(null)
        setError(requestError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
    // `select` is intentionally excluded: callers pass an inline function, and
    // depending on it would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, serialisedParams, reloadToken])

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  return { data, loading, error, reload, setData }
}
