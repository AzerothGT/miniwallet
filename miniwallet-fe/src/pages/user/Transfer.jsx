import { NotePencilIcon as NotePencil, UserCircleIcon as UserCircle, XIcon as X } from '@phosphor-icons/react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../../components/Alert.jsx'
import { FocusShell } from '../../components/AppShell.jsx'
import { Avatar } from '../../components/Avatar.jsx'
import { Keypad } from '../../components/Keypad.jsx'
import { PillButton } from '../../components/PillButton.jsx'
import { ScreenHeader } from '../../components/ScreenHeader.jsx'
import { TextField } from '../../components/TextField.jsx'
import api from '../../lib/api.js'
import { formatRupiah, withThousandSeparators } from '../../lib/format.js'
import { useAmountKeyboard } from '../../lib/useAmountKeyboard.js'
import { useApiResource } from '../../lib/useApiResource.js'
import { validateAmount, validateRecipient } from '../../lib/validation.js'

export default function Transfer() {
  const navigate = useNavigate()
  const location = useLocation()

  /*
   * Arriving from Quick Send pre-fills the recipient.
   *
   * `useState` initialiser rather than an effect: the value is known on the very
   * first render, so there is no reason to render an empty field and then
   * overwrite it. The field stays fully editable afterwards.
   */
  const preset = location.state?.recipient ?? null

  const [recipient, setRecipient] = useState(preset?.transfer_target ?? '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /*
   * Whether the chosen contact is still the target.
   *
   * Tracked separately from `recipient` so that editing the address by hand, or
   * clearing the chip, drops the identity card rather than leaving a name on
   * screen that no longer matches what will actually be sent.
   */
  const [pickedContact, setPickedContact] = useState(preset)

  const { data: wallet } = useApiResource('/wallet', {
    select: (payload) => payload.data,
  })

  const balance = wallet?.balance

  // A desktop has a number row. The hook ignores events from text fields, so
  // typing an email in the recipient box does not also feed the amount.
  useAmountKeyboard({
    value: amount,
    onChange: setAmount,
    enabled: !submitting,
  })

  const recipientError = validateRecipient(recipient)
  const amountError = validateAmount(amount)

  function changeRecipient(value) {
    setRecipient(value)

    if (pickedContact && value !== pickedContact.transfer_target) {
      setPickedContact(null)
    }
  }

  function clearRecipient() {
    setRecipient('')
    setPickedContact(null)
    setErrors((current) => ({ ...current, recipient: undefined }))
  }

  // Checked here purely for faster feedback. The authoritative check happens
  // inside the database transaction on the server, under a row lock.
  const exceedsBalance = amount && Number(amount) > Number(balance ?? 0)

  const canSubmit = !recipientError && !amountError && !exceedsBalance

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting || !canSubmit) return

    setSubmitting(true)
    setErrors({})
    setServerError('')

    try {
      await api.post('/transfer', {
        recipient: recipient.trim(),
        amount: Number(amount),
        description: description.trim() || undefined,
      })

      navigate('/dashboard', {
        replace: true,
        state: {
          flash: `Transfer ${formatRupiah(Number(amount))} berhasil dikirim.`,
        },
      })
    } catch (error) {
      setErrors(error.fieldErrors ?? {})

      // 422 messages belong under their field. A 400 such as "saldo tidak
      // cukup" concerns the request as a whole, so it becomes a banner.
      if (Object.keys(error.fieldErrors ?? {}).length === 0) {
        const shortfall = error.details?.shortfall

        setServerError(
          error.code === 'insufficient_balance' && shortfall
            ? `${error.message} Kekurangan ${formatRupiah(shortfall)}.`
            : error.message,
        )
      }

      setSubmitting(false)
    }
  }

  const amountMessage =
    errors.amount?.[0] ??
    (amount
      ? (amountError ??
        (exceedsBalance
          ? `Saldo tidak cukup. Saldo Anda ${formatRupiah(balance)}.`
          : ''))
      : '')

  return (
    <FocusShell>
      <ScreenHeader title="Kirim Uang" to="/dashboard" />

      <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col">
        <div className="px-5 lg:px-0">
          <Alert onDismiss={() => setServerError('')}>{serverError}</Alert>

          {pickedContact && (
            <div className="card mb-4 flex items-center gap-3 py-3.5">
              <Avatar name={pickedContact.name} size="md" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {pickedContact.name}
                </p>
                <p className="text-ink-faint truncate text-xs">
                  {pickedContact.transfer_target}
                </p>
              </div>

              <button
                type="button"
                onClick={clearRecipient}
                disabled={submitting}
                aria-label={`Ganti penerima, saat ini ${pickedContact.name}`}
                className="text-ink-faint bg-canvas grid size-8 shrink-0
                  cursor-pointer place-items-center rounded-full transition
                  enabled:hover:bg-negative-wash enabled:hover:text-negative
                  disabled:opacity-45"
              >
                <X size={14} weight="bold" aria-hidden />
              </button>
            </div>
          )}

          <TextField
            id="recipient"
            label="Email atau Nomor HP Penerima"
            icon={UserCircle}
            value={recipient}
            onChange={changeRecipient}
            error={
              errors.recipient?.[0] ?? (recipient ? recipientError : undefined)
            }
            hint={
              pickedContact
                ? 'Terisi dari Kirim Cepat. Bisa diubah bila perlu.'
                : 'budi@example.com atau 081200000002'
            }
            autoComplete="off"
            disabled={submitting}
          />

          <TextField
            id="description"
            label="Catatan (opsional)"
            icon={NotePencil}
            value={description}
            onChange={setDescription}
            error={errors.description?.[0]}
            placeholder="Bayar makan siang"
            disabled={submitting}
          />
        </div>

        {/* Amount display. */}
        <div className="px-5 pt-1 pb-4 text-center lg:px-0">
          <p
            className="font-display text-ink text-[2.5rem] leading-none font-bold
              tabular-nums"
            aria-live="polite"
          >
            <span className="text-ink-faint mr-1 text-2xl">Rp</span>
            {withThousandSeparators(amount) || '0'}
          </p>

          {amountMessage ? (
            <p className="text-negative mt-2 text-sm font-semibold" role="alert">
              {amountMessage}
            </p>
          ) : (
            <p className="text-ink-muted mt-2 text-sm">
              Saldo {formatRupiah(balance)}
            </p>
          )}
        </div>

        {/*
          The keypad sheet hugs the bottom edge on mobile. On desktop it becomes
          an ordinary card: there is no thumb reaching up the screen, and a sheet
          pinned to a tall window would leave a gap in the middle.
        */}
        <div
          className="rounded-t-sheet bg-canvas animate-sheet mt-auto px-5 pt-5
            pb-6 shadow-nav lg:rounded-card lg:bg-paper lg:shadow-lift lg:mt-6
            lg:p-5"
        >
          <Keypad value={amount} onChange={setAmount} disabled={submitting} />

          <p className="text-ink-faint mt-3 hidden text-center text-xs lg:block">
            Bisa juga langsung ketik angka di keyboard.
          </p>

          <div className="mt-4">
            <PillButton
              tone="lime"
              loading={submitting}
              disabled={!canSubmit}
              loadingText="Mengirim transfer…"
            >
              Lanjutkan
            </PillButton>
          </div>
        </div>
      </form>
    </FocusShell>
  )
}
