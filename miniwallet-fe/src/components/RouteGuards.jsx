import { CircleNotchIcon as CircleNotch } from '@phosphor-icons/react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'

function SessionLoading() {
  return (
    <div
      className="bg-canvas grid min-h-dvh place-content-center justify-items-center
        gap-3"
      role="status"
      aria-live="polite"
    >
      <CircleNotch
        size={30}
        weight="bold"
        className="text-lime-deep animate-spin"
        aria-hidden
      />
      <p className="text-ink-muted text-sm">Memuat sesi…</p>
    </div>
  )
}

/** Gate for routes that need a session. */
export function ProtectedRoute({ children }) {
  const { user, initialising } = useAuth()

  if (initialising) return <SessionLoading />
  if (!user) return <Navigate to="/login" replace />

  return children
}

/**
 * Gate for the administration area.
 *
 * A non-admin is sent to their own dashboard rather than shown an error: they are
 * legitimately signed in, just not here, and a redirect states that more plainly
 * than a permission notice.
 *
 * This only hides the UI. Authorisation lives on the server, where every
 * `/api/admin/*` route re-checks the role, so bypassing this guard reveals
 * nothing.
 */
export function AdminRoute({ children }) {
  const { user, isAdmin, initialising } = useAuth()

  if (initialising) return <SessionLoading />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return children
}

/** Inverse gate: keeps signed-in users away from onboarding and auth screens. */
export function GuestRoute({ children }) {
  const { user, isAdmin, initialising } = useAuth()

  if (initialising) return <SessionLoading />

  // Administrators land in their own area, since the wallet dashboard is not
  // what they signed in to do.
  if (user) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />

  return children
}
