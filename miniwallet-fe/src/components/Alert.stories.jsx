import { Alert } from './Alert.jsx'

export default {
  title: 'Feedback/Alert',
  component: Alert,
  argTypes: {
    kind: { control: 'radio', options: ['error', 'success'] },
    children: { control: 'text', name: 'message' },
    onDismiss: { control: false },
  },
  args: {
    kind: 'error',
    children: 'Saldo tidak cukup untuk melakukan transaksi ini.',
  },
}

export const Error = {}

export const Success = {
  args: {
    kind: 'success',
    children: 'Transfer berhasil.',
  },
}

export const Dismissible = {
  args: {
    onDismiss: () => {},
  },
}

/** A 400 from the API carries `shortfall`, which the transfer form appends. */
export const InsufficientBalance = {
  args: {
    children:
      'Saldo tidak cukup untuk melakukan transaksi ini. Kekurangan Rp 8.565.000.',
    onDismiss: () => {},
  },
}

export const NetworkFailure = {
  args: {
    children: 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.',
  },
}

/** Nothing renders when there is no message, so callers need no guard. */
export const EmptyRendersNothing = {
  args: { children: '' },
}
