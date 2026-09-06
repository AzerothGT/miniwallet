import { ArrowLeftIcon as ArrowLeft, XIcon as X } from '@phosphor-icons/react'
import { formatRupiah } from '../lib/format.js'
import { Alert } from './Alert.jsx'
import { PillButton } from './PillButton.jsx'

function PinInput({ id, label, value, onChange, disabled, autoFocus = false }) {
  return (
    <label htmlFor={id} className="mb-4 block">
      <span className="field-label">{label}</span>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        disabled={disabled}
        className="field-input text-center text-xl tracking-[0.55em]"
      />
    </label>
  )
}

export function TransferConfirmationModal({
  open,
  mode,
  recipient,
  amount,
  balanceAfter,
  pin = '',
  pinConfirmation = '',
  error = '',
  submitting = false,
  onPinChange,
  onPinConfirmationChange,
  onBack,
  onReview,
  onSubmit,
  onClose,
}) {
  if (!open || !mode) return null

  const isSetup = mode === 'setup'
  const isReview = mode === 'review'

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.(event)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-forest-900/55 p-4 lg:place-items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
        className="animate-sheet w-full max-w-md rounded-sheet bg-paper p-6 shadow-lift"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-ink-faint text-xs font-bold tracking-[0.18em] uppercase">
              {isSetup ? 'Langkah 1 dari 2' : isReview ? 'Periksa kembali' : 'Langkah terakhir'}
            </p>
            <h2 id="transfer-modal-title" className="mt-1 text-xl font-bold">
              {isSetup ? 'Buat Security PIN' : isReview ? 'Review Transfer' : 'Masukkan Security PIN'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup review transfer"
            className="text-ink-faint grid size-9 shrink-0 cursor-pointer place-items-center rounded-full transition hover:bg-canvas hover:text-ink disabled:opacity-40"
          >
            <X size={18} weight="bold" aria-hidden />
          </button>
        </div>

        {isSetup && (
          <form onSubmit={handleSubmit} noValidate>
            <p className="text-ink-muted mb-5 text-sm leading-relaxed">
              PIN 6 digit akan digunakan untuk melindungi setiap pengiriman uang. Jangan bagikan PIN kepada siapa pun.
            </p>
            <PinInput
              id="security-pin"
              label="Security PIN"
              value={pin}
              onChange={onPinChange}
              disabled={submitting}
              autoFocus
            />
            <PinInput
              id="security-pin-confirmation"
              label="Konfirmasi Security PIN"
              value={pinConfirmation}
              onChange={onPinConfirmationChange}
              disabled={submitting}
            />
            <Alert>{error}</Alert>
            <PillButton tone="lime" loading={submitting} loadingText="Menyimpan PIN…">
              Simpan PIN
            </PillButton>
          </form>
        )}

        {isReview && (
          <div>
            <div className="bg-canvas mb-5 space-y-4 rounded-2xl p-4">
              <div>
                <p className="text-ink-faint text-xs">Kirim ke</p>
                <p className="mt-1 wrap-break-word text-sm font-semibold">{recipient}</p>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-ink-faint text-xs">Nominal</p>
                  <p className="font-display mt-1 text-2xl font-bold tabular-nums">
                    {formatRupiah(amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-ink-faint text-xs">Saldo setelah</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatRupiah(balanceAfter)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="btn flex-1 justify-center"
              >
                <ArrowLeft size={17} weight="bold" aria-hidden />
                Kembali
              </button>
              <PillButton tone="lime" type="button" className="flex-1" onClick={onReview}>
                Konfirmasi
              </PillButton>
            </div>
          </div>
        )}

        {!isSetup && !isReview && (
          <form onSubmit={handleSubmit} noValidate>
            <p className="text-ink-muted mb-5 text-sm leading-relaxed">
              Masukkan PIN untuk menyelesaikan transfer sebesar{' '}
              <strong className="text-ink">{formatRupiah(amount)}</strong>.
            </p>
            <PinInput
              id="transfer-security-pin"
              label="Security PIN"
              value={pin}
              onChange={onPinChange}
              disabled={submitting}
              autoFocus
            />
            <Alert>{error}</Alert>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="btn flex-1 justify-center disabled:opacity-40"
              >
                <ArrowLeft size={17} weight="bold" aria-hidden />
                Kembali
              </button>
              <PillButton
                tone="lime"
                loading={submitting}
                disabled={pin.length !== 6}
                loadingText="Mengirim…"
                className="flex-1"
              >
                Kirim
              </PillButton>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
