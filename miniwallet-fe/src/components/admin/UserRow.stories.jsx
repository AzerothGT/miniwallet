import { UserRow } from './UserRow.jsx'

function user(overrides) {
  return {
    id: 2,
    name: 'Budi Santoso',
    username: 'budi',
    email: 'budi@example.com',
    phone: '081200000002',
    role: 'user',
    role_label: 'Pengguna',
    suspended: false,
    suspended_at: null,
    balance: 300_000,
    transactions_count: 4,
    created_at: '2026-08-01T09:00:00+07:00',
    ...overrides,
  }
}

export default {
  title: 'Admin/UserRow',
  component: UserRow,
  argTypes: {
    onToggleSuspension: { control: false },
    onToggleRole: { control: false },
  },
  args: {
    user: user(),
    isSelf: false,
    busy: false,
    onToggleSuspension: () => {},
    onToggleRole: () => {},
  },
  decorators: [
    (Story) => (
      <ul className="card divide-hairline max-w-3xl divide-y">
        <Story />
      </ul>
    ),
  ],
}

export const Active = {}

/** Suspension is stated in words, never signalled by colour alone. */
export const Suspended = {
  args: {
    user: user({ suspended: true, suspended_at: '2026-08-29T10:00:00+07:00' }),
  },
}

export const Administrator = {
  args: {
    user: user({ role: 'admin', role_label: 'Super Administrator' }),
  },
}

/**
 * Actions are disabled on the administrator's own row rather than hidden: hiding
 * them would leave the reader wondering why this row looks different. The server
 * refuses the request regardless.
 */
export const OwnAccount = {
  args: {
    isSelf: true,
    user: user({ role: 'admin', role_label: 'Super Administrator' }),
  },
}

/** Only the row being changed spins, so the rest of the list stays usable. */
export const Busy = {
  args: { busy: true },
}

export const ZeroBalance = {
  args: { user: user({ balance: 0, transactions_count: 0 }) },
}
