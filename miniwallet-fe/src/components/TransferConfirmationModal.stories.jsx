import { useState } from 'react'
import { TransferConfirmationModal } from './TransferConfirmationModal.jsx'

export default {
  title: 'Transfers/TransferConfirmationModal',
  component: TransferConfirmationModal,
  parameters: {
    layout: 'fullscreen',
  },
}

function Interactive(args) {
  const [mode, setMode] = useState(args.mode)
  const [pin, setPin] = useState(args.pin ?? '')
  const [pinConfirmation, setPinConfirmation] = useState(args.pinConfirmation ?? '')

  return (
    <TransferConfirmationModal
      {...args}
      mode={mode}
      pin={pin}
      pinConfirmation={pinConfirmation}
      onPinChange={setPin}
      onPinConfirmationChange={setPinConfirmation}
      onBack={() => setMode(mode === 'pin' ? 'review' : 'setup')}
      onReview={() => setMode('pin')}
      onSubmit={(event) => event.preventDefault()}
      onClose={() => setMode(null)}
    />
  )
}

export const Setup = {
  render: Interactive,
  args: {
    open: true,
    mode: 'setup',
  },
}

export const Review = {
  render: Interactive,
  args: {
    open: true,
    mode: 'review',
    recipient: 'Budi Santoso · budi@example.com',
    amount: 30000,
    balanceAfter: 170000,
  },
}

export const PinError = {
  render: Interactive,
  args: {
    open: true,
    mode: 'pin',
    amount: 30000,
    error: 'Security PIN salah.',
  },
}

export const Loading = {
  args: {
    open: true,
    mode: 'pin',
    amount: 30000,
    pin: '123456',
    submitting: true,
  },
}
