import { ArrowDown, ArrowUp } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { AppShell } from '../../components/AppShell.jsx'
import { TransactionList } from '../../components/TransactionList.jsx'
import { formatRupiah } from '../../lib/format.js'
import { useApiResource } from '../../lib/useApiResource.js'

/*
 * A stable reference for "no data yet": `?? []` would allocate a fresh array on
 * every render, which would defeat the useMemo dependencies below.
 */
const NO_TRANSACTIONS = []

/**
 * Spending report.
 *
 * The API exposes no aggregate endpoint for a single user, so the totals and the
 * chart are derived from the transaction page already being fetched. That keeps
 * the screen honest about its scope — it summarises recent activity, not all-time
 * history — and avoids inventing a backend feature the spec never asked for.
 */
export default function Report() {
  const [range, setRange] = useState('out')

  const {
    data: history,
    loading,
    error,
  } = useApiResource('/transactions', {
    params: { per_page: 50 },
  })

  const transactions = history?.data ?? NO_TRANSACTIONS

  const summary = useMemo(() => {
    let incoming = 0
    let outgoing = 0

    for (const transaction of transactions) {
      if (transaction.direction === 'out') {
        outgoing += transaction.amount
      } else {
        incoming += transaction.amount
      }
    }

    return { incoming, outgoing }
  }, [transactions])

  // Last seven days, oldest first, so the chart reads left to right.
  const series = useMemo(() => {
    const days = []
    const today = new Date()

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today)
      day.setDate(today.getDate() - offset)

      days.push({
        key: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString('id-ID', { weekday: 'short' }),
        total: 0,
      })
    }

    const index = new Map(days.map((day) => [day.key, day]))

    for (const transaction of transactions) {
      const key = transaction.created_at?.slice(0, 10)
      const bucket = index.get(key)

      if (!bucket) continue

      const matches =
        range === 'out'
          ? transaction.direction === 'out'
          : transaction.direction === 'in'

      if (matches) bucket.total += transaction.amount
    }

    return days
  }, [transactions, range])

  const preview = useMemo(() => transactions.slice(0, 5), [transactions])

  const peak = Math.max(...series.map((day) => day.total), 1)

  return (
    <AppShell>
      <header className="px-5 pt-6 pb-4 lg:px-0 lg:pt-0">
        <h1 className="text-[1.375rem] lg:text-[1.75rem]">Laporan</h1>
        <p className="text-ink-muted text-sm">
          Ringkasan dari 50 transaksi terakhir
        </p>
      </header>

      <div className="grid gap-3.5 px-5 pb-4 lg:grid-cols-5 lg:gap-5 lg:px-0 lg:pb-0">
        <div className="grid gap-3.5 lg:col-span-3 lg:content-start lg:gap-5">
          <div className="grid grid-cols-2 gap-3 lg:gap-5">
            <SummaryCard
              icon={ArrowDown}
              label="Uang Masuk"
              amount={summary.incoming}
              tone="positive"
              loading={loading}
            />
            <SummaryCard
              icon={ArrowUp}
              label="Uang Keluar"
              amount={summary.outgoing}
              tone="negative"
              loading={loading}
            />
          </div>

          <section className="card" aria-labelledby="chart-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="chart-heading" className="text-base">
                7 Hari Terakhir
              </h2>

              <div
                className="flex gap-0.5"
                role="group"
                aria-label="Pilih arah transaksi"
              >
                {[
                  { value: 'out', label: 'Keluar' },
                  { value: 'in', label: 'Masuk' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    aria-pressed={range === option.value}
                    className={`seg ${range === option.value ? 'seg-on' : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/*
              A bar chart rather than the reference's smooth line: with seven
              discrete daily totals, bars state the values plainly, whereas a
              spline would imply values between the days that do not exist.
            */}
            <ul className="flex h-40 items-end gap-2 lg:h-56" aria-hidden>
              {series.map((day) => (
                <li
                  key={day.key}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-lg transition-[height] ${
                        day.total > 0 ? 'bg-lime-zest' : 'bg-canvas'
                      }`}
                      style={{
                        height: `${Math.max((day.total / peak) * 100, 3)}%`,
                      }}
                    />
                  </div>
                  <span className="text-ink-faint text-[0.625rem] font-semibold">
                    {day.label}
                  </span>
                </li>
              ))}
            </ul>

            {/* The same data as text, for anyone not reading the bars. */}
            <table className="sr-only">
              <caption>
                Total {range === 'out' ? 'uang keluar' : 'uang masuk'} per hari
              </caption>
              <thead>
                <tr>
                  <th scope="col">Hari</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {series.map((day) => (
                  <tr key={day.key}>
                    <th scope="row">{day.label}</th>
                    <td>{formatRupiah(day.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="lg:col-span-2">
          <TransactionList
            transactions={preview}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </AppShell>
  )
}

function SummaryCard({ icon: Icon, label, amount, tone, loading }) {
  const tones = {
    positive: 'bg-positive-wash text-positive',
    negative: 'bg-negative-wash text-negative',
  }

  return (
    <div className="card">
      <span
        className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}
        aria-hidden
      >
        <Icon size={17} weight="bold" />
      </span>

      <p className="text-ink-muted mt-3 text-xs font-semibold">{label}</p>

      {loading ? (
        <div className="bg-canvas mt-1 h-6 animate-pulse rounded-lg" />
      ) : (
        <p className="font-display mt-0.5 font-bold tabular-nums">
          {formatRupiah(amount)}
        </p>
      )}
    </div>
  )
}
