import { SignOut, Wallet } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { NAV_ITEMS } from '../lib/navItems.js'
import { Avatar } from './Avatar.jsx'

/**
 * Persistent sidebar for desktop.
 *
 * Replaces the floating bottom bar above `lg`. On a wide screen the bottom edge
 * is the furthest point from both the eye and the mouse, so the same five
 * destinations move to a vertical rail where they read as labelled text rather
 * than icons needing interpretation.
 *
 * Rendered only at `lg` and up, so assistive tech is never offered the same set
 * of links twice.
 */
export function SideNav() {
  const { user, logout } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-0 flex h-dvh flex-col px-4 py-6">
        <div className="flex items-center gap-2.5 px-2">
          <span
            className="bg-forest-800 text-lime-glow grid size-10 place-items-center
              rounded-2xl"
            aria-hidden
          >
            <Wallet size={20} weight="bold" />
          </span>
          <span className="font-display text-lg font-bold">Mini Wallet</span>
        </div>

        <nav aria-label="Navigasi utama" className="mt-8 flex-1">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink to={to} end className="block">
                  {({ isActive }) => (
                    <span
                      className={`flex items-center gap-3 rounded-2xl px-3.5 py-3
                        font-semibold transition ${
                          isActive
                            ? 'bg-lime-zest text-forest-900'
                            : 'text-ink-muted hover:bg-lime-wash hover:text-lime-deep'
                        }`}
                    >
                      <Icon
                        size={20}
                        weight={isActive ? 'fill' : 'regular'}
                        aria-hidden
                      />
                      <span className="text-sm">{label}</span>
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bg-paper shadow-lift rounded-card flex items-center gap-3 p-3">
          <Avatar name={user?.name} size="sm" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user?.name}</p>
            <p className="text-ink-faint truncate text-[0.6875rem]">
              @{user?.username}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            aria-label="Keluar dari akun"
            className="text-ink-faint grid size-8 shrink-0 cursor-pointer
              place-items-center rounded-full transition
              hover:bg-negative-wash hover:text-negative"
          >
            <SignOut size={15} weight="bold" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  )
}

/**
 * Floating bottom navigation for narrow screens.
 *
 * The active item expands into a labelled lime pill while the others stay bare
 * icons — the pattern from the reference, and it also means the current location
 * is conveyed by shape and text rather than colour alone.
 *
 * Hidden at `lg` and up, where SideNav takes over.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="sticky bottom-0 z-20 px-4 pt-2 pb-4 lg:hidden"
    >
      <ul
        className="bg-paper shadow-lift-lg flex items-center justify-around gap-0.5
          rounded-full p-2"
      >
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} end className="block">
              {({ isActive }) => (
                <span
                  className={`flex items-center gap-1.5 rounded-full font-semibold
                    transition ${
                      isActive
                        ? 'bg-lime-zest text-forest-900 px-3.5 py-2.5'
                        : 'text-ink-faint hover:text-ink-soft px-2.5 py-2.5'
                    }`}
                >
                  <Icon
                    size={20}
                    weight={isActive ? 'fill' : 'regular'}
                    aria-hidden
                  />
                  {isActive ? (
                    <span className="text-xs">{label}</span>
                  ) : (
                    <span className="sr-only">{label}</span>
                  )}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
