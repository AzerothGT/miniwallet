import {
  ArrowDown,
  ArrowUp,
  Coins,
  Plus,
  Prohibit,
  Users,
  Wallet,
} from '@phosphor-icons/react'
import { AdminShell } from '../../components/AppShell.jsx'
import { StatCard } from '../../components/admin/StatCard.jsx'
import { VolumeChart } from '../../components/admin/VolumeChart.jsx'
import { formatRupiah } from '../../lib/format.js'
import { useApiResource } from '../../lib/useApiResource.js'

/**
 * Platform overview.
 *
 * Every figure comes from `/api/admin/stats`, which aggregates in SQL. Deriving
 * them on the client would mean downloading the whole ledger to add it up, and
 * would quietly become wrong as soon as the data outgrew one page.
 */
export default function AdminOverview() {
  const { data, loading, error } = useApiResource('/admin/stats', {
    select: (payload) => payload.data,
  })

  const users = data?.users
  const transactions = data?.transactions

  return (
    <AdminShell>
      <header className="px-5 pt-6 pb-4 lg:px-0 lg:pt-0">
        <h1 className="text-[1.375rem] lg:text-[1.75rem]">Ringkasan Platform</h1>
        <p className="text-ink-muted text-sm">
          Angka dihitung langsung di database, bukan dari satu halaman data.
        </p>
      </header>

      <div className="grid gap-3.5 px-5 pb-4 lg:gap-5 lg:px-0 lg:pb-0">
        {error && (
          <p className="text-negative card text-center text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          <StatCard
            icon={Users}
            label="Total Pengguna"
            value={users?.total ?? 0}
            hint={`${users?.new_this_week ?? 0} baru minggu ini`}
            loading={loading}
          />
          <StatCard
            icon={Wallet}
            label="Total Saldo"
            value={formatRupiah(data?.wallets?.total_balance)}
            hint="Seluruh wallet"
            tone="positive"
            loading={loading}
          />
          <StatCard
            icon={Coins}
            label="Total Transaksi"
            value={transactions?.total ?? 0}
            hint="Termasuk kedua sisi transfer"
            tone="ink"
            loading={loading}
          />
          <StatCard
            icon={Prohibit}
            label="Akun Nonaktif"
            value={users?.suspended ?? 0}
            hint={`${users?.admins ?? 0} administrator`}
            tone="negative"
            loading={loading}
          />
        </div>

        <div className="grid gap-3.5 lg:grid-cols-3 lg:gap-5">
          <div className="lg:col-span-2">
            <VolumeChart daily={data?.daily} loading={loading} />
          </div>

          <div className="grid content-start gap-3.5 lg:gap-5">
            <StatCard
              icon={Plus}
              label="Volume Top Up"
              value={formatRupiah(transactions?.topup?.total)}
              hint={`${transactions?.topup?.count ?? 0} transaksi`}
              loading={loading}
            />

            {/*
              Counted from the outgoing leg only. A transfer writes two rows, so
              summing both would report twice the money that actually moved.
            */}
            <StatCard
              icon={ArrowUp}
              label="Volume Transfer"
              value={formatRupiah(transactions?.transfer?.total)}
              hint={`${transactions?.transfer?.count ?? 0} pengiriman`}
              tone="negative"
              loading={loading}
            />

            <StatCard
              icon={ArrowDown}
              label="Rata-rata Saldo"
              value={formatRupiah(
                users?.total > 0
                  ? Math.round((data?.wallets?.total_balance ?? 0) / users.total)
                  : 0,
              )}
              hint="Per pengguna"
              tone="ink"
              loading={loading}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
