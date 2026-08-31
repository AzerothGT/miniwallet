import {
  ArrowsLeftRight,
  ChartPieSlice,
  House,
  Receipt,
  User,
} from '@phosphor-icons/react'

/**
 * The five destinations, shared by the sidebar and the bottom bar.
 *
 * Kept in its own module so both navigations read from one list — otherwise
 * adding a screen means remembering to edit two arrays.
 */
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', Icon: House },
  { to: '/transfer', label: 'Kirim', Icon: ArrowsLeftRight },
  { to: '/history', label: 'Riwayat', Icon: Receipt },
  { to: '/report', label: 'Laporan', Icon: ChartPieSlice },
  { to: '/profile', label: 'Profil', Icon: User },
]
