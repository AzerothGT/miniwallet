import { Coins, Prohibit, Users, Wallet } from '@phosphor-icons/react'
import { StatCard } from './StatCard.jsx'

export default {
  title: 'Admin/StatCard',
  component: StatCard,
  argTypes: {
    icon: { control: false },
    tone: { control: 'radio', options: ['lime', 'positive', 'negative', 'ink'] },
  },
  args: {
    icon: Users,
    label: 'Total Pengguna',
    value: 128,
    hint: '6 baru minggu ini',
    tone: 'lime',
    loading: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-[14rem]">
        <Story />
      </div>
    ),
  ],
}

export const Default = {}

export const Currency = {
  args: {
    icon: Wallet,
    label: 'Total Saldo',
    value: 'Rp 128.750.000',
    hint: 'Seluruh wallet',
    tone: 'positive',
  },
}

/** Skeleton instead of a zero: showing "0" while loading would be a lie. */
export const Loading = {
  args: { loading: true },
}

export const WithoutHint = {
  args: { hint: undefined },
}

export const Tones = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-4 gap-3">
      <StatCard icon={Users} label="Pengguna" value={128} tone="lime" />
      <StatCard icon={Wallet} label="Saldo" value="Rp 12,8jt" tone="positive" />
      <StatCard icon={Coins} label="Transaksi" value={1024} tone="ink" />
      <StatCard icon={Prohibit} label="Nonaktif" value={3} tone="negative" />
    </div>
  ),
  decorators: [(Story) => <Story />],
}
