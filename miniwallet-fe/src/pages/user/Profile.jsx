import {
  AtIcon as At,
  EnvelopeIcon as Envelope,
  PhoneIcon as Phone,
  ShieldCheckIcon as ShieldCheck,
  SignOutIcon as SignOut,
  WalletIcon as Wallet,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { AppShell } from '../../components/AppShell.jsx'
import { Avatar } from '../../components/Avatar.jsx'
import { formatRupiah } from '../../lib/format.js'
import { useApiResource } from '../../lib/useApiResource.js'

export default function Profile() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const { data: wallet, loading } = useApiResource('/wallet', {
    select: (payload) => payload.data,
  })

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
    // Account details are a short read; a 2xl measure keeps the definition list
    // from stretching into two unrelated halves.
    <AppShell maxWidth="max-w-2xl">
      <header className="px-5 pt-6 pb-4 lg:px-0 lg:pt-0">
        <h1 className="text-[1.375rem] lg:text-[1.75rem]">Profil</h1>
      </header>

      <div className="grid gap-3.5 px-5 pb-4 lg:px-0 lg:pb-0 lg:gap-5">
        <section className="card flex items-center gap-4">
          <Avatar name={user?.name} size="lg" label={user?.name} />

          <div className="min-w-0">
            <p className="font-display truncate font-bold">{user?.name}</p>
            <p className="text-ink-muted truncate text-sm">@{user?.username}</p>
          </div>
        </section>

        <section
          className="rounded-card bg-forest-800 on-forest p-5"
          aria-labelledby="profile-balance"
        >
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-lime-glow" aria-hidden />
            <p
              id="profile-balance"
              className="text-lime-glow/80 text-[0.6875rem] font-semibold
                tracking-[0.16em] uppercase"
            >
              Saldo Aktif
            </p>
          </div>

          {loading ? (
            <div className="mt-2 h-8 w-36 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <p className="font-display mt-1 text-3xl font-bold text-white tabular-nums">
              {formatRupiah(wallet?.balance)}
            </p>
          )}
        </section>

        <section className="card" aria-labelledby="account-heading">
          <h2 id="account-heading" className="mb-3 text-base">
            Informasi Akun
          </h2>

          <dl className="divide-hairline divide-y">
            <Detail icon={Envelope} label="Email" value={user?.email} />
            <Detail icon={Phone} label="Nomor HP" value={user?.phone} />
            <Detail icon={At} label="Username" value={`@${user?.username}`} />
          </dl>
        </section>

        <section className="card" aria-labelledby="security-heading">
          <h2 id="security-heading" className="mb-2 text-base">
            Keamanan
          </h2>

          <div className="flex items-start gap-3">
            <span
              className="bg-lime-wash text-lime-deep grid size-9 shrink-0
                place-items-center rounded-xl"
              aria-hidden
            >
              <ShieldCheck size={17} weight="bold" />
            </span>
            <p className="text-ink-muted text-sm">
              Sesi Anda dijaga token yang disimpan dalam cookie httpOnly, tidak
              dapat dibaca JavaScript. Keluar akan mencabut token perangkat ini
              saja.
            </p>
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-busy={loggingOut}
          className="btn bg-negative-wash text-negative w-full px-5 py-3.5
            enabled:hover:bg-negative enabled:hover:text-white
            disabled:opacity-45"
        >
          <SignOut size={18} weight="bold" aria-hidden />
          {loggingOut ? 'Keluar…' : 'Keluar dari Akun'}
        </button>
      </div>
    </AppShell>
  )
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-ink-faint shrink-0" aria-hidden>
        <Icon size={17} />
      </span>
      <dt className="text-ink-muted text-sm">{label}</dt>
      <dd className="ml-auto truncate text-sm font-semibold">{value}</dd>
    </div>
  )
}
