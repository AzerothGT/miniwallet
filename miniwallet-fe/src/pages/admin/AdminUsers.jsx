import { MagnifyingGlassIcon as MagnifyingGlass, UsersIcon as Users } from '@phosphor-icons/react'
import { useState } from 'react'
import { Alert } from '../../components/Alert.jsx'
import { AdminShell } from '../../components/AppShell.jsx'
import { Pagination } from '../../components/Pagination.jsx'
import { UserRow } from '../../components/admin/UserRow.jsx'
import { useAuth } from '../../auth/useAuth.js'
import api from '../../lib/api.js'
import { useApiResource } from '../../lib/useApiResource.js'

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'suspended', label: 'Nonaktif' },
]

const ROLE_FILTERS = [
  { value: '', label: 'Semua peran' },
  { value: 'user', label: 'Pengguna' },
  { value: 'admin', label: 'Admin' },
]

export default function AdminUsers() {
  const { user: currentUser } = useAuth()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)

  /*
   * The id of the row currently being mutated, so only that row shows a spinner.
   * A single boolean would freeze the whole list while one account changed.
   */
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const { data, loading, error, reload } = useApiResource('/admin/users', {
    params: {
      search: search || undefined,
      status: status || undefined,
      role: role || undefined,
      page,
      per_page: 15,
    },
  })

  const users = data?.data ?? []
  const meta = data?.meta ?? null

  /* Any filter change invalidates the current page number. */
  function applyFilter(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  async function mutate(userId, request) {
    if (busyId) return

    setBusyId(userId)
    setActionError('')
    setActionMessage('')

    try {
      const response = await request()
      setActionMessage(response.data.message)
      // Refetch rather than patching local state: suspension also revokes
      // tokens, and a stale row would misreport what the server now holds.
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  function toggleSuspension(target) {
    return mutate(target.id, () =>
      api.patch(`/admin/users/${target.id}/suspension`, {
        suspended: !target.suspended,
      }),
    )
  }

  function toggleRole(target) {
    return mutate(target.id, () =>
      api.patch(`/admin/users/${target.id}/role`, {
        role: target.role === 'admin' ? 'user' : 'admin',
      }),
    )
  }

  return (
    <AdminShell>
      <header className="px-5 pt-6 pb-4 lg:px-0 lg:pt-0">
        <h1 className="text-[1.375rem] lg:text-[1.75rem]">Kelola Pengguna</h1>
        <p className="text-ink-muted text-sm">
          Nonaktifkan akun atau ubah peran. Tindakan berlaku segera.
        </p>
      </header>

      <div className="px-5 pb-4 lg:px-0 lg:pb-0">
        <Alert onDismiss={() => setActionError('')}>{actionError}</Alert>
        <Alert kind="success" onDismiss={() => setActionMessage('')}>
          {actionMessage}
        </Alert>

        {/* Filters. */}
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
              onChange={(event) => applyFilter(setSearch)(event.target.value)}
              placeholder="Cari nama, username, email, atau nomor HP"
              aria-label="Cari pengguna"
              className="field-input pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div
              className="flex gap-0.5"
              role="group"
              aria-label="Filter status akun"
            >
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => applyFilter(setStatus)(option.value)}
                  aria-pressed={status === option.value}
                  className={`seg ${status === option.value ? 'seg-on' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div
              className="flex gap-0.5"
              role="group"
              aria-label="Filter peran akun"
            >
              {ROLE_FILTERS.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => applyFilter(setRole)(option.value)}
                  aria-pressed={role === option.value}
                  className={`seg ${role === option.value ? 'seg-on' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {meta && !loading && !error && meta.total > 0 && (
          <p className="text-ink-muted mb-3 text-xs" aria-live="polite">
            {meta.total} pengguna · halaman {meta.current_page} dari{' '}
            {meta.last_page}
          </p>
        )}

        <section className="card" aria-labelledby="users-heading">
          <h2 id="users-heading" className="sr-only">
            Daftar pengguna
          </h2>

          {error && (
            <p className="text-negative py-10 text-center text-sm" role="alert">
              {error}
            </p>
          )}

          {loading && !error && (
            <ul className="space-y-2" aria-label="Memuat pengguna">
              {[0, 1, 2, 3, 4].map((row) => (
                <li
                  key={row}
                  className="bg-canvas h-16 animate-pulse rounded-2xl"
                />
              ))}
            </ul>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="py-12 text-center">
              <span
                className="bg-canvas text-ink-faint mx-auto grid size-14
                  place-items-center rounded-2xl"
                aria-hidden
              >
                <Users size={24} />
              </span>
              <p className="text-ink-soft mt-3 font-semibold">
                Tidak ada pengguna
              </p>
              <p className="text-ink-muted mt-1 text-sm">
                Coba ubah kata kunci atau filter.
              </p>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <>
              <ul className="divide-hairline divide-y">
                {users.map((row) => (
                  <UserRow
                    key={row.id}
                    user={row}
                    isSelf={row.id === currentUser?.id}
                    busy={busyId === row.id}
                    onToggleSuspension={toggleSuspension}
                    onToggleRole={toggleRole}
                  />
                ))}
              </ul>

              <Pagination
                meta={meta}
                onPageChange={setPage}
                label="Navigasi halaman pengguna"
              />
            </>
          )}
        </section>
      </div>
    </AdminShell>
  )
}
