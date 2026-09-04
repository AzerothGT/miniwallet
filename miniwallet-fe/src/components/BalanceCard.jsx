import {
  ArrowsLeftRightIcon as ArrowsLeftRight,
  DotsNineIcon as DotsNine,
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  PlusIcon as Plus,
  QrCodeIcon as QrCode,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { formatRupiah } from '../lib/format.js'

/**
 * Balance hero with the action row underneath.
 *
 * The balance can be hidden — a small courtesy when checking a wallet in public.
 * The choice is deliberately not persisted: every visit starts visible, and
 * remembering it would mean storing something about the user for little gain.
 */
export function BalanceCard({ wallet, loading, onTopup, onTransfer, onMore }) {
  const [hidden, setHidden] = useState(false)

  return (
    <section
      aria-labelledby="balance-heading"
      className="rounded-hero bg-paper shadow-lift animate-rise overflow-hidden"
    >
      {/* Sage gradient panel carrying the amount. */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-sage-100
          via-sage-200 to-sage-400 px-5 pt-5 pb-6 lg:px-7 lg:pt-7 lg:pb-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-52
            rounded-full bg-white/35 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-1/3 size-44
            rounded-full bg-sage-400/40 blur-2xl"
        />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p
              id="balance-heading"
              className="text-forest-800/70 text-[0.6875rem] font-semibold
                tracking-[0.16em] uppercase"
            >
              Total Saldo
            </p>

            {loading ? (
              <div
                className="bg-forest-800/10 mt-2 h-9 w-40 animate-pulse
                  rounded-lg lg:h-12 lg:w-56"
                role="status"
                aria-label="Memuat saldo"
              />
            ) : (
              <p
                className="font-display text-forest-900 mt-0.5 text-[2.25rem]
                  leading-none font-bold tracking-tight tabular-nums
                  lg:text-[3rem]"
              >
                {hidden ? '••••••' : formatRupiah(wallet?.balance)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setHidden((current) => !current)}
            aria-pressed={hidden}
            aria-label={hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            className="bg-lime-zest text-forest-900 grid size-10 shrink-0
              cursor-pointer place-items-center rounded-2xl transition
              hover:bg-lime-glow"
          >
            {hidden ? (
              <EyeSlash size={18} weight="bold" aria-hidden />
            ) : (
              <Eye size={18} weight="bold" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Action row. */}
      <div className="grid grid-cols-4 gap-1 px-2 py-3 lg:px-4">
        <Action icon={Plus} label="Top Up" onClick={onTopup} />
        <Action icon={ArrowsLeftRight} label="Transfer" onClick={onTransfer} />
        <Action icon={QrCode} label="Terima" onClick={onMore} />
        <Action icon={DotsNine} label="Lainnya" onClick={onMore} />
      </div>
    </section>
  )
}

function Action({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-forest-800 flex cursor-pointer flex-col items-center gap-1.5
        rounded-2xl py-2 transition hover:bg-lime-wash lg:flex-row
        lg:justify-center lg:gap-2 lg:py-3"
    >
      <Icon size={22} weight="regular" aria-hidden />
      <span className="text-[0.6875rem] font-semibold lg:text-sm">{label}</span>
    </button>
  )
}
