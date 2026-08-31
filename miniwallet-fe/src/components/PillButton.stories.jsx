import { PillButton } from './PillButton.jsx'

export default {
  title: 'Forms/PillButton',
  component: PillButton,
  argTypes: {
    tone: { control: 'radio', options: ['paper', 'lime'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text', name: 'label' },
  },
  args: {
    children: 'Lanjutkan',
    tone: 'lime',
    loading: false,
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="max-w-[20rem]">
        <Story />
      </div>
    ),
  ],
}

export const Lime = {}

/** White pill for dark backgrounds, as on the onboarding screen. */
export const OnForest = {
  args: { tone: 'paper', children: 'Mulai Sekarang' },
  parameters: { backgrounds: { value: 'forest' } },
  decorators: [
    (Story) => (
      <div className="bg-forest-900 max-w-[20rem] rounded-3xl p-6">
        <Story />
      </div>
    ),
  ],
}

/**
 * The state that prevents duplicate transfers. `disabled` is the real guard —
 * the pulsing cap only explains why nothing is happening.
 */
export const Loading = {
  args: { loading: true, loadingText: 'Mengirim transfer…' },
}

/** Stays disabled until validation passes, so no doomed request is ever sent. */
export const DisabledUntilValid = {
  args: { disabled: true },
}

export const AllStates = {
  render: () => (
    <div className="grid gap-3">
      <PillButton tone="lime">Top Up</PillButton>
      <PillButton tone="lime" loading loadingText="Memproses…">
        Top Up
      </PillButton>
      <PillButton tone="lime" disabled>
        Top Up
      </PillButton>
      <PillButton>Lanjutkan</PillButton>
    </div>
  ),
}
