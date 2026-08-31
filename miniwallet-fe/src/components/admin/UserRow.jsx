import { CircleNotch, Prohibit, ShieldCheck, UserCheck } from '@phosphor-icons/react'
import { Avatar } from '../Avatar.jsx'
import { RoleBadge, StatusBadge } from './Badges.jsx'
import { formatRupiah } from '../../lib/format.js'

/**
 * One user in the administration list.
 *
 * Actions are disabled on the administrator's own row rather than hidden: hiding
 * them would leave the reader wondering why this row looks different. The label
 * explains it instead, and the server refuses the request regardless.
 */
export function UserRow({ user, isSelf, busy, onToggleSuspension, onToggleRole }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3.5">
      <Avatar name={user.name} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <RoleBadge role={user.role} label={user.role_label} />
          <StatusBadge suspended={user.suspended} />
          {isSelf && (
            <span className="text-ink-faint text-[0.6875rem]">(Anda)</span>
          )}
        </div>

        <p className="text-ink-faint truncate text-xs">
          {user.email} · {user.phone}
        </p>
      </div>

      <div className="text-right">
        <p className="font-display text-sm font-bold tabular-nums">
          {formatRupiah(user.balance ?? 0)}
        </p>
        <p className="text-ink-faint text-[0.6875rem]">
          {user.transactions_count ?? 0} transaksi
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onToggleRole(user)}
          disabled={isSelf || busy}
          title={
            isSelf
              ? 'Tidak dapat mengubah peran akun sendiri'
              : user.role === 'admin'
                ? 'Turunkan menjadi pengguna'
                : 'Jadikan administrator'
          }
          className="text-ink-muted bg-canvas grid size-9 cursor-pointer
            place-items-center rounded-full transition
            enabled:hover:bg-lime-wash enabled:hover:text-lime-deep
            disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <CircleNotch size={15} weight="bold" className="animate-spin" aria-hidden />
          ) : user.role === 'admin' ? (
            <UserCheck size={15} weight="bold" aria-hidden />
          ) : (
            <ShieldCheck size={15} weight="bold" aria-hidden />
          )}
          <span className="sr-only">
            {user.role === 'admin'
              ? `Turunkan ${user.name} menjadi pengguna`
              : `Jadikan ${user.name} administrator`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggleSuspension(user)}
          disabled={isSelf || busy}
          title={
            isSelf
              ? 'Tidak dapat menonaktifkan akun sendiri'
              : user.suspended
                ? 'Aktifkan kembali akun'
                : 'Nonaktifkan akun'
          }
          className={`grid size-9 cursor-pointer place-items-center rounded-full
            transition disabled:cursor-not-allowed disabled:opacity-40 ${
              user.suspended
                ? 'bg-positive-wash text-positive enabled:hover:bg-positive enabled:hover:text-white'
                : 'bg-canvas text-ink-muted enabled:hover:bg-negative-wash enabled:hover:text-negative'
            }`}
        >
          {busy ? (
            <CircleNotch size={15} weight="bold" className="animate-spin" aria-hidden />
          ) : user.suspended ? (
            <UserCheck size={15} weight="bold" aria-hidden />
          ) : (
            <Prohibit size={15} weight="bold" aria-hidden />
          )}
          <span className="sr-only">
            {user.suspended
              ? `Aktifkan kembali ${user.name}`
              : `Nonaktifkan ${user.name}`}
          </span>
        </button>
      </div>
    </li>
  )
}
