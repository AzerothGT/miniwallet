import {
  ArrowDownLeft,
  ArrowUpRight,
  MagnifyingGlass,
  Plus,
  Receipt,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { AdminShell } from '../../components/AppShell.jsx'
import { Pagination } from '../../components/Pagination.jsx'
import { Avatar } from '../../components/Avatar.jsx'
import { formatDateTime, formatRupiah } from '../../lib/format.js'
import { useApiResource } from '../../lib/useApiResource.js'

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'topup', label: 'Top Up' },
  { value: 'transfer_out', label: 'Keluar' },
  { value: 'transfer_in', label: 'Masuk' },
]

const GLYPHS = {
  topup: { Icon: Plus, tone: 'bg-lime-wash text-lime-deep' },
  transfer_in: { Icon: ArrowDownLeft, tone: 'bg-positive-wash text-positive' },
  transfer_out: { Icon: ArrowUpRight, tone: 'bg-negative-wash text-negative' },
}

/**
 * Platform-wide ledger.
 *
 * Unlike the user-facing history, both legs of a transfer appear here as separate
 * rows. That is deliberate: an administrator investigating a dispute needs to see
 * the debit and the credit as independently verifiable records, joined by their
 * shared reference.
 */
export default function AdminTransactions() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error } = useApiResource('/admin/transactions', {
    params: {
      search: search || undefined,
      type: type || undefined,
      page,
      per_page: 20,
    },
  })

  const transactions = data?.data ?? []
  const meta = data?.meta ?? null

  return (
    <AdminShell>
      <header className="px-5 pt-6 pb-4 lg:px-0 lg:pt-0">
        <h1 className="text-[1.375rem] lg:text-[1.75rem]">Ledger Platform</h1>
        <p className="text-ink-muted text-sm">
          Setiap transfer muncul dua baris: sisi keluar dan sisi masuk.
        </p>
      </header>

      <div className="px-5 pb-4 lg:px-0 lg:pb-0">
        <div className="mb-4 grid gap-3">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="text-ink-faint pointer-events-none absolute top-1/2
                left-3.5 -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Cari reference atau nama pemilik"
              aria-label="Cari transaksi"
              className="field-input pl-10"
            />
          </div>

          <div
            className="-mx-1 flex gap-0.5 overflow-x-auto px-1 py-1"
            role="group"
            aria-label="Filter jenis transaksi"
          >
            {FILTERS.map((option) => (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => {
                  setType(option.value)
                  setPage(1)
                }}
                aria-pressed={type === option.value}
                className={`seg shrink-0 ${type === option.value ? 'seg-on' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {meta && !loading && !error && meta.total > 0 && (
          <p className="text-ink-muted mb-3 text-xs" aria-live="polite">
            {meta.total} baris · halaman {meta.current_page} dari {meta.last_page}
          </p>
        )}

        <section className="card" aria-labelledby="ledger-heading">
          <h2 id="ledger-heading" className="sr-only">
            Daftar seluruh transaksi
          </h2>

          {error && (
            <p className="text-negative py-10 text-center text-sm" role="alert">
              {error}
            </p>
          )}

          {loading && !error && (
            <ul className="space-y-2" aria-label="Memuat ledger">
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
                Tidak ada transaksi
              </p>
              <p className="text-ink-muted mt-1 text-sm">
                Coba ubah kata kunci atau filter.
              </p>
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <>
              <ul className="divide-hairline divide-y">
                {transactions.map((row) => (
                  <LedgerRow key={row.id} transaction={row} />
                ))}
              </ul>

              <Pagination
                meta={meta}
                onPageChange={setPage}
                label="Navigasi halaman ledger"
              />
            </>
          )}
        </section>
      </div>
    </AdminShell>
  )
}

function LedgerRow({ transaction }) {
  const { Icon, tone } = GLYPHS[transaction.type]
  const isOut = transaction.direction === 'out'
  const owner = transaction.owner
  const counterpart = transaction.counterpart

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}
        aria-hidden
      >
        <Icon size={16} weight="bold" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {owner && <Avatar name={owner.name} size="sm" />}
          <p className="truncate text-sm font-semibold">
            {owner?.name ?? 'Tidak diketahui'}
          </p>
        </div>

        <p className="text-ink-faint truncate text-xs">
          {transaction.type_label}
          {counterpart ? ` · ${isOut ? 'ke' : 'dari'} ${counterpart.name}` : ''}
          {transaction.description ? ` · ${transaction.description}` : ''}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`font-display text-sm font-bold tabular-nums ${
            isOut ? 'text-negative' : 'text-positive'
          }`}
        >
          {isOut ? '−' : '+'}
          {formatRupiah(transaction.amount)}
        </p>
        <p className="text-ink-faint text-[0.6875rem]">
          {formatDateTime(transaction.created_at)}
        </p>
      </div>

      {/* The reference is what pairs the two legs of a transfer. */}
      <p className="text-ink-faint w-full font-mono text-[0.625rem] lg:w-auto">
        {transaction.reference.slice(0, 8)}
      </p>
    </li>
  )
}
