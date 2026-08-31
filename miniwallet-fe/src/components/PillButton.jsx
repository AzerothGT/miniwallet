import { ArrowRight } from '@phosphor-icons/react'

/**
 * Pill CTA with a trailing circular arrow, matching the reference's
 * "Get Started" and "Continue" buttons.
 *
 * `loading` disables the button, which is what actually prevents a second
 * submission — the spinning cap only explains the wait.
 */
export function PillButton({
  loading = false,
  disabled = false,
  loadingText = 'Memproses…',
  tone = 'paper',
  type = 'submit',
  children,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      aria-busy={loading}
      className={`${tone === 'lime' ? 'btn-pill-lime' : 'btn-pill'} ${className}`}
      {...props}
    >
      <span>{loading ? loadingText : children}</span>
      <span className="btn-pill-cap" aria-hidden>
        <ArrowRight
          size={18}
          weight="bold"
          className={loading ? 'animate-pulse' : ''}
        />
      </span>
    </button>
  )
}
