import { VolumeChart } from './VolumeChart.jsx'

const daily = [
  { day: '2026-08-24', total: 120_000, count: 3 },
  { day: '2026-08-25', total: 340_000, count: 7 },
  { day: '2026-08-26', total: 90_000, count: 2 },
  { day: '2026-08-27', total: 610_000, count: 11 },
  { day: '2026-08-28', total: 250_000, count: 5 },
  { day: '2026-08-29', total: 480_000, count: 9 },
  { day: '2026-08-30', total: 175_000, count: 4 },
]

export default {
  title: 'Admin/VolumeChart',
  component: VolumeChart,
  args: {
    daily,
    loading: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
}

/**
 * Bars rather than a line: seven discrete daily totals are values to compare, and
 * a spline between them would imply amounts in between that do not exist. The
 * same numbers are repeated in a screen-reader table.
 */
export const Default = {}

export const Loading = {
  args: { loading: true, daily: [] },
}

/** A quiet week still renders the frame, so the layout does not jump. */
export const NoActivity = {
  args: { daily: [] },
}

/** One dominant day is the case where a shared scale matters most. */
export const SinglePeak = {
  args: {
    daily: daily.map((day, index) =>
      index === 3 ? { ...day, total: 5_000_000 } : { ...day, total: 50_000 },
    ),
  },
}
