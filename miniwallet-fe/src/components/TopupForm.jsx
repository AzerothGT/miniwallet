import { useState } from 'react'
import api from '../lib/api.js'
import { AMOUNT_LIMITS, validateAmount } from '../lib/validation.js'
import { Alert } from './Alert.jsx'
import { AmountInput } from './AmountInput.jsx'
import { SubmitButton } from './SubmitButton.jsx'

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000]

export function TopupForm({ onSuccess }) {
  const [amount, setAmount] = useState('')
  const [serverError, setServerError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const localError = validateAmount(amount)
  const canSubmit = !localError

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting || !canSubmit) return

    setSubmitting(true)
    setServerError('')
    setFieldError('')
    setSuccess('')

    try {
      const response = await api.post('/topup', { amount: Number(amount) })

      setAmount('')
      setSuccess(response.data.message)
      onSuccess?.(response.data)
    } catch (error) {
      const amountMessage = error.fieldError?.('amount')

      if (amountMessage) {
        setFieldError(amountMessage)
      } else {
        setServerError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card" aria-labelledby="topup-heading">
      <h2 id="topup-heading">Top Up Saldo</h2>

      <Alert onDismiss={() => setServerError('')}>{serverError}</Alert>
      <Alert kind="success" onDismiss={() => setSuccess('')}>
        {success}
      </Alert>

      <form onSubmit={handleSubmit} noValidate>
        <AmountInput
          id="topup-amount"
          label="Nominal"
          value={amount}
          onChange={(value) => {
            setAmount(value)
            setFieldError('')
          }}
          // Only surface the local rule once the user has typed something,
          // so an untouched form does not greet them with a red message.
          error={fieldError || (amount ? localError : undefined)}
          hint={`Minimal Rp ${AMOUNT_LIMITS.min.toLocaleString('id-ID')}, maksimal Rp ${AMOUNT_LIMITS.max.toLocaleString('id-ID')}.`}
          disabled={submitting}
        />

        <div className="quick-amounts">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              onClick={() => {
                setAmount(String(value))
                setFieldError('')
              }}
              disabled={submitting}
            >
              {value.toLocaleString('id-ID')}
            </button>
          ))}
        </div>

        <SubmitButton
          loading={submitting}
          disabled={!canSubmit}
          loadingText="Memproses top up…"
        >
          Top Up
        </SubmitButton>
      </form>
    </section>
  )
}
