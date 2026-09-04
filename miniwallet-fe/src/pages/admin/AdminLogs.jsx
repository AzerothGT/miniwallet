import {
  ListMagnifyingGlassIcon as ListMagnifyingGlass,
  MagnifyingGlassIcon as MagnifyingGlass,
  ShieldCheckIcon as ShieldCheck,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { AdminShell } from '../../components/AppShell.jsx'
import { Pagination } from '../../components/Pagination.jsx'
import { ActivityRow } from '../../components/admin/ActivityRow.jsx'
import { useApiResource } from '../../lib/useApiResource.js'

const PER_PAGE = 25

/* Stable reference, so an empty result does not remount the list every render. */
const NO_ENTRIES = []

/**
 * Audit trail.
 *
 * Reads `/api/admin/logs`. Filter options come from `/api/admin/logs/filters`
 * rather than being hardcoded here, so adding an event server-side surfaces
 * without a client change.
 *
 * There is no edit or delete action anywhere on this screen, and none exists in
 * the API either. A trail that can be rewritten is not evidence of anything.
 */
export default function AdminLogs() {
  const [category, setCategory] = useState('')
  const [event, setEvent] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const { data: filters } = useApiResource('/admin/logs/filters', {
    select: (payload) => payload.data,
  })

  const { data, loading, error } = useApiResource('/admin/logs', {
    params: {
      category: category || undefined,
      event: event || undefined,
      search: search || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      per_page: PER_PAGE,
    },
  })

  const entries = data?.data ?? NO_ENTRIES
  const meta = data?.meta ?? null

  const categories = filters?.categories ?? []
  const allEvents = filters?.events ?? []

  /*
   * Narrow the event list to the chosen category. Offering events that cannot
   * appear alongside the current category would let the user build a filter pair
   * that always returns nothing.
   */
  const events = category
    ? allEvents.filter((option) => option.category === category)
    : allEvents

  function change(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  function changeCategory(value) {
    setCategory(value)
    // A held-over event from another category would contradict the new one.
    setEvent('')
    setPage(1)
  }

  const hasFilters = category || event || search || from || to

  function reset() {
    setCategory('')
    setEvent('')
    setSearch('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <AdminShell>
      <header className="px-5 pt-6 pb-4 lg:px-0 lg:pt-0">
        <h1 className="text-[1.375rem] lg:text-[1.75rem]">Jejak Aktivitas</h1>
        <p className="text-ink-muted text-sm">
          Catatan seluruh kejadian di platform. Bersifat append-only — tidak dapat
          diubah maupun dihapus.
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
              onChange={(item) => change(setSearch)(item.target.value)}
              placeholder="Cari deskripsi atau alamat IP"
              aria-label="Cari jejak aktivitas"
              className="field-input pl-10"
            />
          </div>

          {/* Category. */}
          <div
            className="-mx-1 flex gap-0.5 overflow-x-auto px-1 py-1"
            role="group"
            aria-label="Filter kategori"
          >
            <button
              type="button"
              onClick={() => changeCategory('')}
              aria-pressed={category === ''}
              className={`seg shrink-0 ${category === '' ? 'seg-on' : ''}`}
            >
              Semua
            </button>

            {categories.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeCategory(option.value)}
                aria-pressed={category === option.value}
                className={`seg shrink-0 ${
                  category === option.value ? 'seg-on' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="event" className="field-label">
                Jenis kejadian
              </label>
              <select
                id="event"
                value={event}
                onChange={(item) => change(setEvent)(item.target.value)}
                className="field-input"
              >
                <option value="">Semua kejadian</option>
                {events.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="from" className="field-label">
                Dari tanggal
              </label>
              <input
                id="from"
                type="date"
                value={from}
                onChange={(item) => change(setFrom)(item.target.value)}
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="to" className="field-label">
                Sampai tanggal
              </label>
              <input
                id="to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(item) => change(setTo)(item.target.value)}
                className="field-input"
              />
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {meta && !loading && !error && meta.total > 0 ? (
            <p className="text-ink-muted text-xs" aria-live="polite">
              {meta.total} kejadian · halaman {meta.current_page} dari{' '}
              {meta.last_page}
            </p>
          ) : (
            <span />
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="text-lime-deep cursor-pointer text-xs font-semibold"
            >
              Reset filter
            </button>
          )}
        </div>

        <section className="card" aria-labelledby="logs-heading">
          <h2 id="logs-heading" className="sr-only">
            Daftar jejak aktivitas
          </h2>

          {error && (
            <p className="text-negative py-10 text-center text-sm" role="alert">
              {error}
            </p>
          )}

          {loading && !error && (
            <ul className="space-y-2" aria-label="Memuat jejak aktivitas">
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <li
                  key={row}
                  className="bg-canvas h-16 animate-pulse rounded-2xl"
                />
              ))}
            </ul>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="py-12 text-center">
              <span
                className="bg-canvas text-ink-faint mx-auto grid size-14
                  place-items-center rounded-2xl"
                aria-hidden
              >
                <ListMagnifyingGlass size={24} />
              </span>
              <p className="text-ink-soft mt-3 font-semibold">
                Tidak ada kejadian
              </p>
              <p className="text-ink-muted mt-1 text-sm">
                {hasFilters
                  ? 'Coba ubah atau reset filter.'
                  : 'Aktivitas akan tercatat di sini begitu ada yang terjadi.'}
              </p>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <>
              <ul className="divide-hairline divide-y">
                {entries.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </ul>

              <Pagination
                meta={meta}
                onPageChange={setPage}
                label="Navigasi halaman jejak aktivitas"
              />
            </>
          )}
        </section>

        <p className="text-ink-faint mt-3 flex items-start gap-1.5 text-[0.6875rem]">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden />
          Percobaan login yang gagal ikut dicatat, termasuk untuk email yang tidak
          terdaftar. Password yang dikirim tidak pernah disimpan.
        </p>
      </div>
    </AdminShell>
  )
}
