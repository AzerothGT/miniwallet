import {
  ArrowsLeftRight,
  ChartPieSlice,
  House,
  Receipt,
  ShieldCheck,
  User,
  Users,
} from '@phosphor-icons/react'

/**
 * Destinations for an ordinary wallet holder.
 *
 * Kept in its own module so the sidebar and the bottom bar read from one list —
 * otherwise adding a screen means remembering to edit two arrays.
 */
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', Icon: House },
  { to: '/transfer', label: 'Kirim', Icon: ArrowsLeftRight },
  { to: '/history', label: 'Riwayat', Icon: Receipt },
  { to: '/report', label: 'Laporan', Icon: ChartPieSlice },
  { to: '/profile', label: 'Profil', Icon: User },
]

/**
 * Destinations for the administration area.
 *
 * A separate list, not a filtered version of the one above: an administrator is
 * doing a different job, and mixing wallet actions into an oversight tool would
 * blur which account the numbers on screen belong to.
 */
export const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Ringkasan', Icon: ShieldCheck },
  { to: '/admin/users', label: 'Pengguna', Icon: Users },
  { to: '/admin/transactions', label: 'Ledger', Icon: Receipt },
]
