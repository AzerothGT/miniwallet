import { CircleNotch } from '@phosphor-icons/react'
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

/** Inverse gate: keeps signed-in users away from onboarding and auth screens. */
export function GuestRoute({ children }) {
  const { user, initialising } = useAuth()

  if (initialising) return <SessionLoading />
  if (user) return <Navigate to="/dashboard" replace />

  return children
}
