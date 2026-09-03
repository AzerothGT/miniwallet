import { ActivityRow } from './ActivityRow.jsx'

function entry(overrides) {
  return {
    id: 1,
    event: 'logged_in',
    event_label: 'Login',
    category: 'auth',
    category_label: 'Autentikasi',
    alarming: false,
    description: 'Ian Pratama berhasil login.',
    properties: null,
    ip_address: '203.0.113.7',
    user_agent: 'Mozilla/5.0',
    user: { id: 1, name: 'Ian Pratama', username: 'ian' },
    actor: null,
    created_at: '2026-08-30T09:15:00+07:00',
    ...overrides,
  }
}

export default {
  title: 'Admin/ActivityRow',
  component: ActivityRow,
  args: { entry: entry() },
  decorators: [
    (Story) => (
      <ul className="card divide-hairline max-w-3xl divide-y">
        <Story />
      </ul>
    ),
  ],
}

export const Login = {}

/**
 * A failed attempt is marked in red and flagged by the API as `alarming`, so the
 * client does not need to know which event names matter.
 */
export const LoginFailed = {
  args: {
    entry: entry({
      id: 2,
      event: 'login_failed',
      event_label: 'Login Gagal',
      alarming: true,
      description: 'Percobaan login gagal untuk tidakada@example.com.',
      user: null,
      properties: { email: 'tidakada@example.com', akun_terdaftar: false },
    }),
  },
}

/** Properties are collapsed by default: useful for one entry, noise across a hundred. */
export const TopupWithProperties = {
  args: {
    entry: entry({
      id: 3,
      event: 'topped_up',
      event_label: 'Top Up',
      category: 'wallet',
      category_label: 'Wallet',
      description: 'Ian Pratama melakukan top up Rp 50.000.',
      properties: { nominal: 50_000, saldo_akhir: 435_000 },
    }),
  },
}

export const Transfer = {
  args: {
    entry: entry({
      id: 4,
      event: 'transfer_sent',
      event_label: 'Transfer',
      category: 'wallet',
      category_label: 'Wallet',
      description: 'Ian Pratama mengirim Rp 30.000 ke Budi Santoso.',
      properties: {
        nominal: 30_000,
        penerima: 'budi',
        reference: '71a1e3db-2c4f-4a8b-9d1e-6f3a5b8c2d7e',
      },
    }),
  },
}

/**
 * An actor only appears when it differs from the subject, so its presence alone
 * already means "someone acted on someone else's account".
 */
export const AdminActionOnSomeoneElse = {
  args: {
    entry: entry({
      id: 5,
      event: 'user_suspended',
      event_label: 'Akun Dinonaktifkan',
      category: 'admin',
      category_label: 'Administrasi',
      alarming: true,
      description: 'Akun budi dinonaktifkan oleh Super Admin.',
      user: { id: 2, name: 'Budi Santoso', username: 'budi' },
      actor: { id: 4, name: 'Super Admin', username: 'admin' },
      properties: null,
    }),
  },
}

export const RoleChanged = {
  args: {
    entry: entry({
      id: 6,
      event: 'role_changed',
      event_label: 'Peran Diubah',
      category: 'admin',
      category_label: 'Administrasi',
      description:
        'Peran budi diubah dari Pengguna menjadi Super Administrator oleh Super Admin.',
      actor: { id: 4, name: 'Super Admin', username: 'admin' },
      properties: {
        peran_lama: 'Pengguna',
        peran_baru: 'Super Administrator',
      },
    }),
  },
}

/** An unrecognised event still renders instead of crashing on a missing glyph. */
export const UnknownEvent = {
  args: {
    entry: entry({
      id: 7,
      event: 'something_new',
      event_label: 'Kejadian Baru',
      description: 'Kejadian yang belum dikenal klien.',
    }),
  },
}

export const AllTypes = {
  render: () => (
    <>
      <ActivityRow entry={entry()} />
      <ActivityRow
        entry={entry({
          id: 2,
          event: 'login_failed',
          event_label: 'Login Gagal',
          alarming: true,
          description: 'Percobaan login gagal untuk tidakada@example.com.',
          properties: { email: 'tidakada@example.com', akun_terdaftar: false },
        })}
      />
      <ActivityRow
        entry={entry({
          id: 3,
          event: 'topped_up',
          event_label: 'Top Up',
          category: 'wallet',
          category_label: 'Wallet',
          description: 'Ian Pratama melakukan top up Rp 50.000.',
          properties: { nominal: 50_000, saldo_akhir: 435_000 },
        })}
      />
      <ActivityRow
        entry={entry({
          id: 5,
          event: 'user_suspended',
          event_label: 'Akun Dinonaktifkan',
          category: 'admin',
          category_label: 'Administrasi',
          alarming: true,
          description: 'Akun budi dinonaktifkan oleh Super Admin.',
          actor: { id: 4, name: 'Super Admin', username: 'admin' },
        })}
      />
    </>
  ),
}
