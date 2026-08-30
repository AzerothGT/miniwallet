import { formatDateTime, formatRupiah } from '../lib/format.js'

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'topup', label: 'Top Up' },
  { value: 'transfer_in', label: 'Masuk' },
  { value: 'transfer_out', label: 'Keluar' },
]

export function TransactionTable({
  transactions,
  loading,
  error,
  filter,
  onFilterChange,
  meta,
  onPageChange,
}) {
  return (
    <section className="card" aria-labelledby="history-heading">
      <div className="card-header">
        <h2 id="history-heading">Riwayat Transaksi</h2>

        <div
          className="filter-group"
          role="group"
          aria-label="Filter jenis transaksi"
        >
          {FILTERS.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              className={`chip ${filter === option.value ? 'chip-active' : ''}`}
              onClick={() => onFilterChange(option.value)}
              aria-pressed={filter === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="table-empty" role="alert">
          {error}
        </p>
      )}

      {loading && !error && (
        <p className="table-empty" aria-live="polite">
          Memuat riwayat…
        </p>
      )}

      {!loading && !error && transactions.length === 0 && (
        <p className="table-empty">
          Belum ada transaksi. Mulai dengan melakukan top up.
        </p>
      )}

      {!loading && !error && transactions.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="table">
              <caption className="sr-only">
                Daftar mutasi saldo, uang masuk dan keluar
              </caption>
              <thead>
                <tr>
                  <th scope="col">Waktu</th>
                  <th scope="col">Jenis</th>
                  <th scope="col">Pihak Terkait</th>
                  <th scope="col">Catatan</th>
                  <th scope="col" className="text-right">
                    Nominal
                  </th>
                  <th scope="col" className="text-right">
                    Saldo Akhir
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDateTime(transaction.created_at)}</td>
                    <td>
                      <span className={`badge badge-${transaction.direction}`}>
                        {transaction.type_label}
                      </span>
                    </td>
                    <td>
                      {transaction.counterpart
                        ? `${transaction.counterpart.name} (@${transaction.counterpart.username})`
                        : '-'}
                    </td>
                    <td>{transaction.description || '-'}</td>
                    <td
                      className={`text-right amount-${transaction.direction}`}
                    >
                      {transaction.direction === 'out' ? '-' : '+'}
                      {formatRupiah(transaction.amount).replace('Rp ', 'Rp ')}
                    </td>
                    <td className="text-right">
                      {formatRupiah(transaction.balance_after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <nav className="pagination" aria-label="Navigasi halaman riwayat">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onPageChange(meta.current_page - 1)}
                disabled={meta.current_page <= 1}
              >
                Sebelumnya
              </button>
              <span aria-live="polite">
                Halaman {meta.current_page} dari {meta.last_page}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onPageChange(meta.current_page + 1)}
                disabled={meta.current_page >= meta.last_page}
              >
                Berikutnya
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
