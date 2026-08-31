import { Receipt } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell.jsx'
import { Pagination } from '../components/Pagination.jsx'
import { ScreenHeader } from '../components/ScreenHeader.jsx'
import { TransactionRow } from '../components/TransactionRow.jsx'
import { formatRupiah, groupByDate } from '../lib/format.js'
import { useApiResource } from '../lib/useApiResource.js'

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'topup', label: 'Top Up' },
  { value: 'transfer_in', label: 'Masuk' },
  { value: 'transfer_out', label: 'Keluar' },
]

const PER_PAGE = 15

/* A stable reference for "no data yet", so the useMemo below is not defeated. */
const NO_TRANSACTIONS = []

/**
 * Full mutation history with paging and filters.
 *
 * This is the paginated view; the dashboard only shows a preview and links here.
 * Keeping paging in one place means there is a single spot to reason about page
 * state, and no risk of two lists disagreeing.
 */
export default function History() {
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error } = useApiResource('/transactions', {
    params: { type: filter || undefined, page, per_page: PER_PAGE },
  })

  const transactions = data?.data ?? NO_TRANSACTIONS
  const meta = data?.meta ?? null

  const groups = useMemo(() => groupByDate(transactions), [transactions])

  function changeFilter(value) {
    setFilter(value)
    setPage(1)
  }

  /*
   * Changing the filter resets to page 1, and Pagination never offers a page
   * beyond `last_page`, so `page` cannot drift out of range. No clamping effect
   * is needed.
   */
  function changePage(next) {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    // A reading list gains nothing from extra width; capped at 3xl so lines stay
    // scannable instead of stretching the full window.
    <AppShell maxWidth="max-w-3xl">
      <ScreenHeader title="Riwayat Transaksi" to="/dashboard" />

      <div className="px-5 pb-4 lg:px-0 lg:pb-0">
        {/* Filters. */}
        <div
          className="-mx-1 mb-3 flex gap-0.5 overflow-x-auto px-1 py-1"
          role="group"
          aria-label="Filter jenis transaksi"
        >
          {FILTERS.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => changeFilter(option.value)}
              aria-pressed={filter === option.value}
              className={`seg shrink-0 ${
                filter === option.value ? 'seg-on' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Result count, so paging has context. */}
        {meta && !loading && !error && meta.total > 0 && (
          <p className="text-ink-muted mb-3 text-xs" aria-live="polite">
            {meta.total} transaksi · halaman {meta.current_page} dari{' '}
            {meta.last_page}
          </p>
        )}

        <section className="card" aria-labelledby="history-heading">
          <h2 id="history-heading" className="sr-only">
            Daftar mutasi saldo
          </h2>

          {error && (
            <p className="text-negative py-10 text-center text-sm" role="alert">
              {error}
            </p>
          )}

          {loading && !error && (
            <ul className="space-y-2" aria-label="Memuat riwayat">
              {[0, 1, 2, 3, 4].map((row) => (
                <li
                  key={row}
                  className="bg-canvas h-16 animate-pulse rounded-2xl"
                />
              ))}
            </ul>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div className="py-12 text-center">
              <span
                className="bg-canvas text-ink-faint mx-auto grid size-14
                  place-items-center rounded-2xl"
                aria-hidden
              >
                <Receipt size={24} />
              </span>
              <p className="text-ink-soft mt-3 font-semibold">
                {filter ? 'Tidak ada transaksi' : 'Belum ada transaksi'}
              </p>
              <p className="text-ink-muted mt-1 text-sm">
                {filter
                  ? 'Coba pilih filter lain.'
                  : 'Mulai dengan melakukan top up saldo.'}
              </p>
            </div>
          )}

          {!loading && !error && groups.length > 0 && (
            <>
              {groups.map((group) => (
                <section key={group.key} className="mb-1 last:mb-0">
                  <h3
                    className="text-ink-faint bg-paper sticky top-0 z-1 py-2
                      text-[0.6875rem] font-semibold tracking-[0.12em]
                      uppercase"
                  >
                    {group.label}
                  </h3>

                  <ul className="divide-hairline divide-y">
                    {group.items.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        timeOnly
                      />
                    ))}
                  </ul>

                  <DayTotal items={group.items} />
                </section>
              ))}

              <Pagination
                meta={meta}
                onPageChange={changePage}
                label="Navigasi halaman riwayat"
              />
            </>
          )}
        </section>
      </div>
    </AppShell>
  )
}

/**
 * Net movement for a day group.
 *
 * Only shown when the day has both directions; otherwise the single row above
 * already states the figure, and repeating it would be noise.
 */
function DayTotal({ items }) {
  const incoming = items
    .filter((item) => item.direction === 'in')
    .reduce((sum, item) => sum + item.amount, 0)

  const outgoing = items
    .filter((item) => item.direction === 'out')
    .reduce((sum, item) => sum + item.amount, 0)

  if (incoming === 0 || outgoing === 0) return null

  const net = incoming - outgoing

  return (
    <p className="text-ink-muted border-hairline border-t py-2 text-right text-xs">
      Selisih hari ini{' '}
      <span
        className={`font-semibold tabular-nums ${
          net < 0 ? 'text-negative' : 'text-positive'
        }`}
      >
        {net < 0 ? '−' : '+'}
        {formatRupiah(Math.abs(net))}
      </span>
    </p>
  )
}
