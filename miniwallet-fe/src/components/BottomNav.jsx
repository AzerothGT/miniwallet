import {
  ArrowsLeftRight,
  ChartPieSlice,
  House,
  Receipt,
  User,
} from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/dashboard', label: 'Home', Icon: House },
  { to: '/transfer', label: 'Kirim', Icon: ArrowsLeftRight },
  { to: '/history', label: 'Riwayat', Icon: Receipt },
  { to: '/report', label: 'Laporan', Icon: ChartPieSlice },
  { to: '/profile', label: 'Profil', Icon: User },
]

/**
 * Floating bottom navigation.
 *
 * The active item expands into a labelled lime pill while the others stay as
 * bare icons — the pattern from the reference, and it also means the current
 * location is conveyed by shape and text rather than colour alone.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="sticky bottom-0 z-20 px-4 pt-2 pb-4"
    >
      <ul
        className="bg-paper shadow-lift-lg flex items-center justify-around gap-0.5
          rounded-full p-2"
      >
        {ITEMS.map(({ to, label, Icon }) => (
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
