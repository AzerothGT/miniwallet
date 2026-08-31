import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../lib/api.js'
import { AuthContext } from './AuthContext.js'

/**
 * Holds the current user.
 *
 * There is no token in state: the session lives entirely in the httpOnly
 * cookie, so "am I logged in?" is answered by asking the server (`GET /me`)
 * rather than by inspecting client storage.
 *
 * `is_admin` arrives with that payload and is used purely to decide what to
 * render. The server never trusts it — every admin endpoint re-checks the role
 * independently, so tampering with client state grants nothing.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    let cancelled = false

    api
      .get('/me')
      .then((response) => {
        if (!cancelled) setUser(response.data.user)
      })
      .catch(() => {
        // A 401 here simply means "not logged in", which is a normal state.
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setInitialising(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const response = await api.post('/login', credentials)
    setUser(response.data.user)
    return response.data.user
  }, [])

  const register = useCallback(async (payload) => {
    const response = await api.post('/register', payload)
    setUser(response.data.user)
    return response.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } finally {
      // Clear locally even if the request failed, so the user is never stuck
      // on a dashboard they can no longer use.
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.is_admin === true,
      initialising,
      login,
      register,
      logout,
    }),
    [user, initialising, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
