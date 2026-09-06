import {
  ArrowDownLeftIcon as ArrowDownLeft,
  ArrowUpRightIcon as ArrowUpRight,
  BellIcon as Bell,
  CheckCircleIcon as CheckCircle,
  PlusIcon as Plus,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { formatRupiah, formatTime } from '../lib/format.js'

const NOTIFICATION_TYPES = {
  topup: {
    Icon: Plus,
    tone: 'bg-lime-wash text-lime-deep',
    title: 'Top up berhasil',
  },
  transfer_in: {
    Icon: ArrowDownLeft,
    tone: 'bg-positive-wash text-positive',
    title: 'Uang masuk',
  },
  transfer_out: {
    Icon: ArrowUpRight,
    tone: 'bg-negative-wash text-negative',
    title: 'Transfer berhasil dikirim',
  },
}

function notificationDescription(transaction) {
  if (transaction.type === 'topup') {
    return `Saldo bertambah ${formatRupiah(transaction.amount)}`
  }

  if (transaction.type === 'transfer_in') {
    return `Anda menerima ${formatRupiah(transaction.amount)}`
  }

  return `Anda mengirim ${formatRupiah(transaction.amount)}`
}

export function NotificationBell({ transactions = [] }) {
  const [open, setOpen] = useState(false)
  const notifications = transactions.slice(0, 5)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifikasi"
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen((current) => !current)}
        className="bg-paper shadow-lift text-ink relative grid size-10
          cursor-pointer place-items-center rounded-full transition hover:bg-lime-wash"
      >
        <Bell size={19} aria-hidden />
        {notifications.length > 0 && (
          <span
            className="bg-lime-zest absolute top-2 right-2.5 size-2 rounded-full
              ring-2 ring-white"
            aria-label={`${notifications.length} notifikasi baru`}
          />
        )}
      </button>

      {open && (
        <section
          id="notification-panel"
          aria-label="Daftar notifikasi"
          className="bg-paper shadow-lift absolute top-12 right-0 z-40 w-[min(21rem,calc(100vw-2.5rem))] overflow-hidden rounded-3xl ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div>
              <h2 className="text-sm font-bold">Notifikasi</h2>
              <p className="text-ink-faint mt-0.5 text-xs">Aktivitas terbaru wallet Anda</p>
            </div>
            <CheckCircle className="text-positive" size={18} weight="fill" aria-hidden />
          </div>

          {notifications.length === 0 ? (
            <div className="border-ink-faint/10 text-ink-muted border-t px-4 py-8 text-center text-sm">
              Belum ada aktivitas terbaru.
            </div>
          ) : (
            <ul className="border-ink-faint/10 max-h-80 overflow-y-auto border-t px-4">
              {notifications.map((transaction) => {
                const type = NOTIFICATION_TYPES[transaction.type] ?? NOTIFICATION_TYPES.topup
                const { Icon } = type

                return (
                  <li key={transaction.id} className="border-ink-faint/10 flex gap-3 border-b py-3 last:border-b-0">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${type.tone}`} aria-hidden>
                      <Icon size={17} weight="bold" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-xs font-bold">{type.title}</p>
                        <time className="text-ink-faint shrink-0 text-[0.6875rem]" dateTime={transaction.created_at}>
                          {formatTime(transaction.created_at)}
                        </time>
                      </div>
                      <p className="text-ink-muted mt-0.5 text-xs">
                        {notificationDescription(transaction)}
                      </p>
                      {transaction.description && (
                        <p className="text-ink-faint mt-0.5 truncate text-[0.6875rem]">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
