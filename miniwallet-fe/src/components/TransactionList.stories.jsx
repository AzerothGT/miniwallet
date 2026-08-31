import { TransactionList } from './TransactionList.jsx'

function tx(overrides) {
  return {
    id: Math.random(),
    reference: 'ref',
    type: 'topup',
    type_label: 'Top Up',
    direction: 'in',
    amount: 100_000,
    signed_amount: 100_000,
    amount_formatted: 'Rp 100.000',
    balance_after: 435_000,
    description: null,
    counterpart: null,
    created_at: '2026-08-30T09:15:00+07:00',
    ...overrides,
  }
}

const transactions = [
  tx({
    id: 1,
    type: 'transfer_out',
    type_label: 'Transfer Keluar',
    direction: 'out',
    amount: 75_000,
    balance_after: 435_000,
    description: 'Bayar makan siang',
    counterpart: {
      name: 'Budi Santoso',
      username: 'budi',
      transfer_target: 'budi@example.com',
    },
  }),
  tx({
    id: 2,
    type: 'transfer_in',
    type_label: 'Transfer Masuk',
    direction: 'in',
    amount: 10_000,
    balance_after: 510_000,
    description: 'Kembalian parkir',
    // Incoming transfers carry no address: it is the sender's, not ours to hand out.
    counterpart: { name: 'Citra Dewi', username: 'citra', transfer_target: null },
    created_at: '2026-08-29T18:40:00+07:00',
  }),
  tx({
    id: 3,
    amount: 500_000,
    balance_after: 500_000,
    description: 'Top up awal',
    created_at: '2026-08-28T11:05:00+07:00',
  }),
]

export default {
  title: 'Wallet/TransactionList',
  component: TransactionList,
  args: {
    transactions,
    loading: false,
    error: '',
  },
  decorators: [
    (Story) => (
      <div className="max-w-[24rem]">
        <Story />
      </div>
    ),
  ],
}

/** Preview only: filters and paging live on the /history screen. */
export const Default = {}

/** Skeleton rows hold the layout, so the page does not jump on arrival. */
export const Loading = {
  args: { loading: true, transactions: [] },
}

export const Empty = {
  args: { transactions: [] },
}

export const RequestFailed = {
  args: {
    transactions: [],
    error: 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.',
  },
}

/** Top-ups have no counterpart, so they show a glyph instead of an avatar. */
export const MixedTypes = {
  args: {
    transactions: [
      ...transactions,
      tx({
        id: 4,
        type: 'transfer_out',
        type_label: 'Transfer Keluar',
        direction: 'out',
        amount: 1_250_000,
        balance_after: 3_180_000,
        description: 'Sewa kantor',
        counterpart: { name: 'Dewi Lestari', username: 'dewi' },
        created_at: '2026-08-27T08:00:00+07:00',
      }),
      tx({
        id: 5,
        amount: 25_000,
        balance_after: 25_000,
        created_at: '2026-08-26T20:12:00+07:00',
      }),
    ],
  },
}
