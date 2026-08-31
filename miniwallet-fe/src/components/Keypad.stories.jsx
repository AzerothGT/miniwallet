import { useState } from 'react'
import { Keypad } from './Keypad.jsx'
import { withThousandSeparators } from '../lib/format.js'

export default {
  title: 'Forms/Keypad',
  component: Keypad,
  argTypes: {
    onChange: { control: false },
    disabled: { control: 'boolean' },
    maxLength: { control: { type: 'number', min: 3, max: 15 } },
  },
  args: {
    value: '',
    disabled: false,
    maxLength: 12,
  },
  decorators: [
    (Story) => (
      <div className="max-w-[20rem]">
        <Story />
      </div>
    ),
  ],
}

/**
 * A keypad instead of a text input means non-digits are unreachable rather than
 * merely filtered: "abc" and "50.000!" cannot be produced at all.
 */
function Interactive(args) {
  const [value, setValue] = useState(args.value ?? '')

  return (
    <>
      <p className="font-display text-ink mb-4 text-center text-3xl font-bold tabular-nums">
        <span className="text-ink-faint mr-1 text-xl">Rp</span>
        {withThousandSeparators(value) || '0'}
      </p>

      <Keypad {...args} value={value} onChange={setValue} />

      <p className="text-ink-muted mt-3 text-center text-xs">
        Dikirim ke API: <code>{value || '(kosong)'}</code>
      </p>
    </>
  )
}

export const Default = {
  render: Interactive,
}

export const WithValue = {
  render: Interactive,
  args: { value: '250000' },
}

/** Disabled while a request is in flight, so the amount cannot change mid-send. */
export const Disabled = {
  args: { value: '100000', disabled: true },
}

/** `maxLength` caps the entry; further presses are ignored rather than trimmed. */
export const ShortMaxLength = {
  render: Interactive,
  args: { maxLength: 5 },
}
