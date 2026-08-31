import { BalanceCard } from './BalanceCard.jsx'

export default {
  title: 'Wallet/BalanceCard',
  component: BalanceCard,
  argTypes: {
    onTopup: { control: false },
    onTransfer: { control: false },
    onMore: { control: false },
  },
  args: {
    wallet: { balance: 435_000, balance_formatted: 'Rp 435.000' },
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

/** Skeleton rather than a zero: showing "Rp 0" while loading would be a lie. */
export const Loading = {
  args: { loading: true, wallet: null },
}

export const ZeroBalance = {
  args: { wallet: { balance: 0 } },
}

export const LargeBalance = {
  args: { wallet: { balance: 128_750_000 } },
}

/**
 * The eye toggle hides the amount for checking a balance in public. The choice
 * is deliberately not persisted, so every visit starts visible.
 */
export const HiddenBalance = {
  name: 'Hidden balance (click the eye)',
}
