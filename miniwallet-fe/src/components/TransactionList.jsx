import { CaretRightIcon as CaretRight, ReceiptIcon as Receipt } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { TransactionRow } from './TransactionRow.jsx'

/**
 * Recent mutations preview for the dashboard.
 *
 * Deliberately has no filters or paging: this is a glance at the latest activity,
 * with a link through to /history where both belong. Two paginated lists over the
 * same data would just be two places to keep in sync.
 *
 * Rows rather than a `<table>`: each entry is one record with a visual hierarchy
 * (who, then what, then how much), not a grid of comparable cells. A list also
 * survives a narrow screen without horizontal scrolling.
 */
export function TransactionList({ transactions, loading, error }) {
  return (
    <section className="card" aria-labelledby="recent-heading">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="recent-heading" className="text-base">
          Transaksi Terakhir
        </h2>

        <Link
          to="/history"
          className="text-lime-deep flex items-center gap-0.5 text-xs
            font-semibold"
        >
          Lihat semua
          <CaretRight size={13} weight="bold" aria-hidden />
        </Link>
      </div>

      {error && (
        <p className="text-negative py-8 text-center text-sm" role="alert">
          {error}
        </p>
      )}

      {loading && !error && (
        <ul className="space-y-2" aria-label="Memuat riwayat">
          {[0, 1, 2].map((row) => (
            <li key={row} className="bg-canvas h-16 animate-pulse rounded-2xl" />
          ))}
        </ul>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="py-10 text-center">
          <span
            className="bg-canvas text-ink-faint mx-auto grid size-14
              place-items-center rounded-2xl"
            aria-hidden
          >
            <Receipt size={24} />
          </span>
          <p className="text-ink-soft mt-3 font-semibold">Belum ada transaksi</p>
          <p className="text-ink-muted mt-1 text-sm">
            Mulai dengan melakukan top up saldo.
          </p>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <ul className="divide-hairline divide-y">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      )}
    </section>
  )
}
