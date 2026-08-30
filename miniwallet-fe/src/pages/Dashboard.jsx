import { useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { BalanceCard } from '../components/BalanceCard.jsx'
import { TopupForm } from '../components/TopupForm.jsx'
import { TransactionTable } from '../components/TransactionTable.jsx'
import { TransferForm } from '../components/TransferForm.jsx'
import { useApiResource } from '../lib/useApiResource.js'

export default function Dashboard() {
  const { user, logout } = useAuth()

  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loggingOut, setLoggingOut] = useState(false)

  const {
    data: wallet,
    loading: walletLoading,
    reload: reloadWallet,
    setData: setWallet,
  } = useApiResource('/wallet', {
    select: (payload) => payload.data,
  })

  const {
    data: history,
    loading: historyLoading,
    error: historyError,
    reload: reloadHistory,
  } = useApiResource('/transactions', {
    params: { type: filter || undefined, page, per_page: 10 },
  })

  const transactions = history?.data ?? []
  const meta = history?.meta ?? null

  /**
   * After a successful top-up or transfer the response already contains the new
   * balance, so it is applied straight away and only the history is re-fetched.
   */
  function handleMutation(data) {
    const updatedWallet = data?.wallet?.data ?? data?.wallet

    if (updatedWallet) {
      setWallet(updatedWallet)
    } else {
      reloadWallet()
    }

    if (page === 1) {
      reloadHistory()
    } else {
      setPage(1)
    }
  }

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <p className="topbar-brand">Mini Wallet</p>
          <p className="topbar-greeting">Halo, {user?.name}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-busy={loggingOut}
        >
          {loggingOut ? 'Keluar…' : 'Keluar'}
        </button>
      </header>

      <main className="dashboard-main">
        <BalanceCard wallet={wallet} loading={walletLoading} user={user} />

        <div className="form-grid">
          <TopupForm onSuccess={handleMutation} />
          <TransferForm balance={wallet?.balance} onSuccess={handleMutation} />
        </div>

        <TransactionTable
          transactions={transactions}
          loading={historyLoading}
          error={historyError}
          filter={filter}
          onFilterChange={(value) => {
            setFilter(value)
            setPage(1)
          }}
          meta={meta}
          onPageChange={setPage}
        />
      </main>
    </div>
  )
}
