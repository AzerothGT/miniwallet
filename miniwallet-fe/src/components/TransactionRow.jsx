import { ArrowDownLeft, ArrowUpRight, Plus } from '@phosphor-icons/react'
import { formatDateTime, formatTime } from '../lib/format.js'
import { formatRupiah } from '../lib/format.js'
import { Avatar } from './Avatar.jsx'

const GLYPHS = {
  topup: { Icon: Plus, tone: 'bg-lime-wash text-lime-deep' },
  transfer_in: { Icon: ArrowDownLeft, tone: 'bg-positive-wash text-positive' },
  transfer_out: { Icon: ArrowUpRight, tone: 'bg-negative-wash text-negative' },
}

/**
 * One mutation.
 *
 * `timeOnly` is used where rows already sit beneath a date heading, so the day
 * is not repeated on every line.
 */
export function TransactionRow({ transaction, timeOnly = false }) {
  const { Icon, tone } = GLYPHS[transaction.type]
  const isOut = transaction.direction === 'out'
  const counterpart = transaction.counterpart

  return (
    <li className="flex items-center gap-3 py-3">
      {counterpart ? (
        <Avatar name={counterpart.name} size="md" />
      ) : (
        <span
          className={`grid size-[2.625rem] shrink-0 place-items-center
            rounded-full ${tone}`}
          aria-hidden
        >
          <Icon size={18} weight="bold" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {counterpart ? counterpart.name : transaction.type_label}
        </p>
        <p className="text-ink-faint truncate text-xs">
          {timeOnly
            ? formatTime(transaction.created_at)
            : formatDateTime(transaction.created_at)}
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
        <p className="text-ink-faint text-[0.6875rem] tabular-nums">
          Saldo {formatRupiah(transaction.balance_after)}
        </p>
      </div>
    </li>
  )
}
