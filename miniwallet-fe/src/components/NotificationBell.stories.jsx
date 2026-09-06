import { NotificationBell } from './NotificationBell.jsx'

export default {
  title: 'Dashboard/NotificationBell',
  component: NotificationBell,
  parameters: {
    layout: 'centered',
  },
}

const now = new Date().toISOString()

export const WithRecentActivity = {
  args: {
    transactions: [
      {
        id: 1,
        type: 'transfer_out',
        amount: 30000,
        description: 'Bayar makan siang',
        created_at: now,
      },
      {
        id: 2,
        type: 'transfer_in',
        amount: 150000,
        description: null,
        created_at: now,
      },
      {
        id: 3,
        type: 'topup',
        amount: 500000,
        description: 'Isi saldo',
        created_at: now,
      },
    ],
  },
}

export const Empty = {
  args: {
    transactions: [],
  },
}
