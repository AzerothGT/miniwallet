import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react'

const TONES = {
  error: {
    box: 'bg-negative-wash text-negative ring-negative/16',
    Icon: WarningCircle,
  },
  success: {
    box: 'bg-positive-wash text-positive ring-positive/16',
    Icon: CheckCircle,
  },
}

/**
 * Inline banner for form-level feedback.
 *
 * Errors use `role="alert"` so assistive tech interrupts and announces them
 * immediately; success uses `role="status"`, which is polite and waits its turn.
 */
export function Alert({ kind = 'error', children, onDismiss }) {
  if (!children) return null

  const isError = kind === 'error'
  const { box, Icon } = TONES[isError ? 'error' : 'success']

  return (
    <div
      className={`animate-alert mb-4 flex items-start gap-2.5 rounded-2xl px-3.5
        py-3 text-sm leading-snug ring-1 ${box}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <Icon size={19} weight="fill" className="mt-px shrink-0" aria-hidden />

      <span className="min-w-0 flex-1">{children}</span>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup pesan"
          className="shrink-0 cursor-pointer rounded-lg p-0.5 opacity-60
            transition hover:opacity-100"
        >
          <X size={16} weight="bold" aria-hidden />
        </button>
      )}
    </div>
  )
}
