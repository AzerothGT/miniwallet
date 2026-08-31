import { Envelope, Lock, UserCircle } from '@phosphor-icons/react'
import { useState } from 'react'
import { TextField } from './TextField.jsx'

export default {
  title: 'Forms/TextField',
  component: TextField,
  argTypes: {
    icon: { control: false },
    onChange: { control: false },
  },
  args: {
    id: 'demo',
    label: 'Email',
    value: '',
    placeholder: 'nama@example.com',
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
}

/** Controlled input; the wrapper supplies the state Storybook args cannot. */
function Interactive(args) {
  const [value, setValue] = useState(args.value ?? '')
  return <TextField {...args} value={value} onChange={setValue} />
}

export const Default = {
  render: Interactive,
}

export const WithIcon = {
  render: Interactive,
  args: { icon: Envelope },
}

export const WithHint = {
  render: Interactive,
  args: {
    label: 'Nomor HP',
    icon: UserCircle,
    hint: 'Contoh: 081234567890',
    placeholder: '08…',
  },
}

/** Errors set `aria-invalid` and are linked through `aria-describedby`. */
export const WithError = {
  render: Interactive,
  args: {
    icon: Envelope,
    value: 'user@',
    error: 'Format email tidak valid.',
  },
}

export const WithHintAndError = {
  render: Interactive,
  args: {
    label: 'Username',
    hint: '3-30 karakter, tanpa spasi.',
    error: 'Username sudah digunakan.',
    value: 'ian',
  },
}

/** All inputs are disabled while a request is in flight. */
export const Disabled = {
  args: {
    icon: Lock,
    label: 'Password',
    type: 'password',
    value: 'rahasia123',
    disabled: true,
  },
}

export const Password = {
  render: Interactive,
  args: {
    id: 'password',
    label: 'Password',
    type: 'password',
    icon: Lock,
    hint: 'Minimal 8 karakter.',
    placeholder: '',
  },
}
