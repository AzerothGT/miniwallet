import { TransactionRow } from './TransactionRow.jsx'

function tx(overrides) {
  return {
    id: 1,
    type: 'topup',
    type_label: 'Top Up',
    direction: 'in',
    amount: 100_000,
    balance_after: 435_000,
    description: null,
    counterpart: null,
    created_at: '2026-08-30T09:15:00+07:00',
    ...overrides,
  }
}

export default {
  title: 'Wallet/TransactionRow',
  component: TransactionRow,
  args: {
    transaction: tx(),
    timeOnly: false,
  },
  decorators: [
    (Story) => (
      <ul className="card divide-hairline max-w-[24rem] divide-y">
        <Story />
      </ul>
    ),
  ],
}

export const Topup = {}

export const TransferOut = {
  args: {
    transaction: tx({
      type: 'transfer_out',
      type_label: 'Transfer Keluar',
      direction: 'out',
      amount: 75_000,
      description: 'Bayar makan siang',
      counterpart: { name: 'Budi Santoso', username: 'budi' },
    }),
  },
}

export const TransferIn = {
  args: {
    transaction: tx({
      type: 'transfer_in',
      type_label: 'Transfer Masuk',
      direction: 'in',
      amount: 10_000,
      description: 'Kembalian parkir',
      counterpart: { name: 'Citra Dewi', username: 'citra' },
    }),
  },
}

/** Used on /history, where rows already sit beneath a date heading. */
export const TimeOnly = {
  args: {
    timeOnly: true,
    transaction: tx({
      type: 'transfer_out',
      type_label: 'Transfer Keluar',
      direction: 'out',
      amount: 1_250_000,
      description: 'Sewa kantor bulan September',
      counterpart: { name: 'Dewi Lestari', username: 'dewi' },
    }),
  },
}

/** Long names and notes truncate rather than pushing the amount off-screen. */
export const LongText = {
  args: {
    transaction: tx({
      type: 'transfer_out',
      type_label: 'Transfer Keluar',
      direction: 'out',
      amount: 12_500_000,
      description:
        'Pembayaran termin kedua untuk renovasi kantor cabang Jakarta Selatan',
      counterpart: {
        name: 'Muhammad Abdurrahman Wijayakusuma',
        username: 'abdurrahman',
      },
    }),
  },
}
