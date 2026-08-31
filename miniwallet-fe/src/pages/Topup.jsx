import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell.jsx'
import { Alert } from '../components/Alert.jsx'
import { Keypad } from '../components/Keypad.jsx'
import { PillButton } from '../components/PillButton.jsx'
import { ScreenHeader } from '../components/ScreenHeader.jsx'
import api from '../lib/api.js'
import { formatRupiah, withThousandSeparators } from '../lib/format.js'
import { useApiResource } from '../lib/useApiResource.js'
import { AMOUNT_LIMITS, validateAmount } from '../lib/validation.js'

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000]

export default function Topup() {
  const navigate = useNavigate()

  const [amount, setAmount] = useState('')
  const [serverError, setServerError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: wallet } = useApiResource('/wallet', {
    select: (payload) => payload.data,
  })

  const localError = validateAmount(amount)
  const canSubmit = !localError

  async function handleSubmit(event) {
    event.preventDefault()

    // Catches an Enter press racing a click, before any request goes out.
    if (submitting || !canSubmit) return

    setSubmitting(true)
    setServerError('')
    setFieldError('')

    try {
      await api.post('/topup', { amount: Number(amount) })
      navigate('/dashboard', {
        replace: true,
        state: { flash: `Top up ${formatRupiah(Number(amount))} berhasil.` },
      })
    } catch (error) {
      const amountMessage = error.fieldError?.('amount')

      if (amountMessage) {
        setFieldError(amountMessage)
      } else {
        setServerError(error.message)
      }
      setSubmitting(false)
    }
  }

  // The local rule only surfaces once something has been typed, so an untouched
  // screen does not greet the user with a red message.
  const shownError = fieldError || (amount ? localError : '')

  return (
    <AppShell>
      <ScreenHeader title="Top Up Saldo" to="/dashboard" />

      <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col">
        <div className="px-5">
          <Alert onDismiss={() => setServerError('')}>{serverError}</Alert>
        </div>

        {/* Amount display. */}
        <div className="px-5 pt-2 pb-5 text-center">
          <p
            className="font-display text-ink text-[2.5rem] leading-none font-bold
              tabular-nums"
            aria-live="polite"
          >
            <span className="text-ink-faint mr-1 text-2xl">Rp</span>
            {withThousandSeparators(amount) || '0'}
          </p>

          <p className="text-ink-muted mt-2.5 text-sm">
            Saldo saat ini {formatRupiah(wallet?.balance)}
          </p>

          {shownError ? (
            <p className="text-negative mt-2 text-sm font-semibold" role="alert">
              {shownError}
            </p>
          ) : (
            <p className="text-ink-faint mt-2 text-xs">
              Rp {AMOUNT_LIMITS.min.toLocaleString('id-ID')} – Rp{' '}
              {AMOUNT_LIMITS.max.toLocaleString('id-ID')}
            </p>
          )}
        </div>

        <div className="mb-5 flex flex-wrap justify-center gap-2 px-5">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setAmount(String(value))
                setFieldError('')
              }}
              disabled={submitting}
              className={`chip ${amount === String(value) ? 'chip-on' : ''}`}
            >
              {value.toLocaleString('id-ID')}
            </button>
          ))}
        </div>

        {/* Keypad sheet pinned to the bottom. */}
        <div
          className="rounded-t-sheet bg-canvas animate-sheet mt-auto px-5 pt-5
            pb-6 shadow-nav"
        >
          <Keypad
            value={amount}
            onChange={(next) => {
              setAmount(next)
              setFieldError('')
            }}
            disabled={submitting}
          />

          <div className="mt-4">
            <PillButton
              tone="lime"
              loading={submitting}
              disabled={!canSubmit}
              loadingText="Memproses top up…"
            >
              Top Up
            </PillButton>
          </div>
        </div>
      </form>
    </AppShell>
  )
}
