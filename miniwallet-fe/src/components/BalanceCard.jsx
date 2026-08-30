import { formatRupiah } from '../lib/format.js'

export function BalanceCard({ wallet, loading, user }) {
  return (
    <section className="card balance-card" aria-labelledby="balance-heading">
      <div>
        <p className="balance-label" id="balance-heading">
          Saldo Tersedia
        </p>
        {loading ? (
          <p className="balance-amount balance-loading" aria-live="polite">
            Memuat…
          </p>
        ) : (
          <p className="balance-amount">{formatRupiah(wallet?.balance)}</p>
        )}
      </div>
      <div className="balance-owner">
        <p className="balance-owner-name">{user?.name}</p>
        <p className="balance-owner-meta">@{user?.username}</p>
        <p className="balance-owner-meta">{user?.phone}</p>
      </div>
    </section>
  )
}
