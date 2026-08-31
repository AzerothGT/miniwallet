/**
 * Role and suspension badges.
 *
 * Suspension is stated in words, not signalled by colour alone: a greyed-out row
 * is easy to miss and impossible to interpret for anyone who cannot see the
 * difference.
 */

export function RoleBadge({ role, label }) {
  const isAdmin = role === 'admin'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem]
        font-semibold ${
          isAdmin ? 'bg-ink text-lime-glow' : 'bg-canvas text-ink-muted'
        }`}
    >
      {label ?? (isAdmin ? 'Admin' : 'Pengguna')}
    </span>
  )
}

export function StatusBadge({ suspended }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem]
        font-semibold ${
          suspended
            ? 'bg-negative-wash text-negative'
            : 'bg-positive-wash text-positive'
        }`}
    >
      {suspended ? 'Nonaktif' : 'Aktif'}
    </span>
  )
}
