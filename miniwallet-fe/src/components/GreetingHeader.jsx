import { Link } from 'react-router-dom'
import { Avatar } from './Avatar.jsx'
import { NotificationBell } from './NotificationBell.jsx'

/**
 * Greeting header for the dashboard.
 *
 * The avatar and bell are hidden at `lg`, where the sidebar already shows the
 * signed-in user and offers logout. Repeating identity in two places on the same
 * screen invites the question of which one is authoritative.
 */
export function GreetingHeader({ user, transactions }) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pt-6 pb-4 lg:px-0 lg:pt-0">
      <div className="min-w-0">
        <h1 className="truncate text-[1.375rem] lg:text-[1.75rem]">
          Halo, {user?.name?.split(' ')[0] ?? 'Kawan'}
        </h1>
        <p className="text-ink-muted text-sm">Selamat datang kembali</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell transactions={transactions} />

        <Link to="/profile" aria-label="Buka profil" className="lg:hidden">
          <Avatar name={user?.name} size="md" />
        </Link>
      </div>
    </header>
  )
}
