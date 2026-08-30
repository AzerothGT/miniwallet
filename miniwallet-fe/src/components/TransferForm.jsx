import { useState } from 'react'
import api from '../lib/api.js'
import { formatRupiah } from '../lib/format.js'
import { validateAmount, validateRecipient } from '../lib/validation.js'
import { Alert } from './Alert.jsx'
import { AmountInput } from './AmountInput.jsx'
import { SubmitButton } from './SubmitButton.jsx'
import { TextField } from './TextField.jsx'

export function TransferForm({ balance, onSuccess }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const recipientError = validateRecipient(recipient)
  const amountError = validateAmount(amount)

  // Checked locally too, purely for faster feedback. The authoritative check
  // happens inside the database transaction on the server.
  const exceedsBalance = amount && Number(amount) > Number(balance ?? 0)

  const canSubmit = !recipientError && !amountError && !exceedsBalance

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting || !canSubmit) return

    setSubmitting(true)
    setErrors({})
    setServerError('')
    setSuccess('')

    try {
      const response = await api.post('/transfer', {
        recipient: recipient.trim(),
        amount: Number(amount),
        description: description.trim() || undefined,
      })

      setRecipient('')
      setAmount('')
      setDescription('')
      setSuccess(response.data.message)
      onSuccess?.(response.data)
    } catch (error) {
      setErrors(error.fieldErrors ?? {})

      // 422 messages belong under their field; 400 rule violations such as
      // "saldo tidak cukup" are about the request as a whole.
      if (Object.keys(error.fieldErrors ?? {}).length === 0) {
        const shortfall = error.details?.shortfall

        setServerError(
          error.code === 'insufficient_balance' && shortfall
            ? `${error.message} Kekurangan ${formatRupiah(shortfall)}.`
            : error.message,
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card" aria-labelledby="transfer-heading">
      <h2 id="transfer-heading">Transfer Saldo</h2>

      <Alert onDismiss={() => setServerError('')}>{serverError}</Alert>
      <Alert kind="success" onDismiss={() => setSuccess('')}>
        {success}
      </Alert>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="recipient"
          label="Email atau Nomor HP Penerima"
          value={recipient}
          onChange={(value) => setRecipient(value)}
          error={
            errors.recipient?.[0] ?? (recipient ? recipientError : undefined)
          }
          hint="Contoh: budi@example.com atau 081200000002"
          autoComplete="off"
          disabled={submitting}
        />

        <AmountInput
          id="transfer-amount"
          label="Nominal"
          value={amount}
          onChange={setAmount}
          error={
            errors.amount?.[0] ??
            (amount
              ? (amountError ??
                (exceedsBalance
                  ? `Saldo tidak cukup. Saldo Anda ${formatRupiah(balance)}.`
                  : undefined))
              : undefined)
          }
          disabled={submitting}
        />

        <TextField
          id="description"
          label="Catatan (opsional)"
          value={description}
          onChange={setDescription}
          error={errors.description?.[0]}
          placeholder="Bayar makan siang"
          disabled={submitting}
        />

        <SubmitButton
          loading={submitting}
          disabled={!canSubmit}
          loadingText="Mengirim transfer…"
        >
          Kirim
        </SubmitButton>
      </form>
    </section>
  )
}
