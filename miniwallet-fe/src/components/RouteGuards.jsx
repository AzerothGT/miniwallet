import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'

/** Gate for routes that need a session. */
export function ProtectedRoute({ children }) {
  const { user, initialising } = useAuth()

  if (initialising) {
    return (
      <div className="page-center" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>Memuat sesi…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

/** Inverse gate: keeps logged-in users away from login/register. */
export function GuestRoute({ children }) {
  const { user, initialising } = useAuth()

  if (initialising) {
    return (
      <div className="page-center" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>Memuat sesi…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
