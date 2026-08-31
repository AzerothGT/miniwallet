import { QuickSend } from './QuickSend.jsx'

const contacts = [
  { name: 'Budi Santoso', username: 'budi', transfer_target: 'budi@example.com' },
  {
    name: 'Citra Dewi',
    username: 'citra',
    transfer_target: 'citra@example.com',
  },
  {
    name: 'Dewi Lestari',
    username: 'dewi',
    transfer_target: '081200000004',
  },
  { name: 'Eko Prasetyo', username: 'eko', transfer_target: 'eko@example.com' },
  {
    name: 'Fitri Handayani',
    username: 'fitri',
    transfer_target: '081200000006',
  },
]

export default {
  title: 'Wallet/QuickSend',
  component: QuickSend,
  argTypes: {
    onPick: { control: false },
    onAdd: { control: false },
  },
  args: {
    contacts,
    loading: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-[24rem]">
        <Story />
      </div>
    ),
  ],
}

export const Default = {}

export const Loading = {
  args: { loading: true, contacts: [] },
}

/**
 * Only outgoing transfers produce a contact, because only those carry an address
 * the API will accept. A brand-new account therefore has nothing to show and
 * gets an explanation rather than an empty row.
 */
export const NoContactsYet = {
  args: { contacts: [] },
}

export const SingleContact = {
  args: { contacts: contacts.slice(0, 1) },
}

/** Targets can be an email or a phone number, whichever was used originally. */
export const MixedTargets = {
  args: { contacts: contacts.slice(0, 3) },
}
