import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { AppShell } from '../components/AppShell.jsx'
import { BalanceCard } from '../components/BalanceCard.jsx'
import { GreetingHeader } from '../components/GreetingHeader.jsx'
import { QuickSend } from '../components/QuickSend.jsx'
import { TransactionList } from '../components/TransactionList.jsx'
import { useApiResource } from '../lib/useApiResource.js'

/*
 * A stable reference for "no data yet": `?? []` would allocate a fresh array on
 * every render, which would defeat the useMemo dependency below.
 */
const NO_TRANSACTIONS = []

/* Fetched once and used twice: five rows for the preview, ten for contacts. */
const RECENT_SIZE = 10
const PREVIEW_SIZE = 5

/**
 * Derive Quick Send contacts from history.
 *
 * Only outgoing transfers qualify: those carry a `transfer_target` the API will
 * accept, so tapping a contact fills the form completely. People who only ever
 * sent money *to* this user are excluded, because the API deliberately withholds
 * their address and a contact that cannot be acted on is worse than no contact.
 *
 * Deduplicated by username and capped at five — the row scrolls horizontally,
 * but beyond five entries it stops being a shortcut and becomes a list to read.
 */
function quickSendContacts(transactions) {
  const seen = new Map()

  for (const transaction of transactions) {
    const contact = transaction.counterpart

    if (!contact?.transfer_target) continue
    if (seen.has(contact.username)) continue

    seen.set(contact.username, contact)

    if (seen.size >= 5) break
  }

  return [...seen.values()]
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: wallet, loading: walletLoading } = useApiResource('/wallet', {
    select: (payload) => payload.data,
  })

  /*
   * Deliberately unfiltered and unpaginated. The dashboard is a glance at the
   * latest activity; filtering and paging live on /history, so there is one
   * place that owns that state instead of two that can disagree.
   */
  const {
    data: history,
    loading: historyLoading,
    error: historyError,
  } = useApiResource('/transactions', {
    params: { per_page: RECENT_SIZE },
  })

  const transactions = history?.data ?? NO_TRANSACTIONS

  const contacts = useMemo(
    () => quickSendContacts(transactions),
    [transactions],
  )

  const preview = useMemo(
    () => transactions.slice(0, PREVIEW_SIZE),
    [transactions],
  )

  return (
    <AppShell>
      <GreetingHeader user={user} />

      {/*
        Two columns from `lg`: balance and shortcuts on the left, history on the
        right. On a wide screen this puts the figure and the activity that
        explains it side by side, instead of one scroll apart.
      */}
      <div className="grid gap-3.5 px-5 pb-4 lg:grid-cols-5 lg:gap-5 lg:px-0 lg:pb-0">
        <div className="grid gap-3.5 lg:col-span-3 lg:content-start lg:gap-5">
          <BalanceCard
            wallet={wallet}
            loading={walletLoading}
            onTopup={() => navigate('/topup')}
            onTransfer={() => navigate('/transfer')}
            onMore={() => navigate('/history')}
          />

          <QuickSend
            contacts={contacts}
            loading={historyLoading}
            onPick={(contact) =>
              navigate('/transfer', { state: { recipient: contact } })
            }
            onAdd={() => navigate('/transfer')}
          />
        </div>

        <div className="lg:col-span-2">
          <TransactionList
            transactions={preview}
            loading={historyLoading}
            error={historyError}
          />
        </div>
      </div>
    </AppShell>
  )
}
