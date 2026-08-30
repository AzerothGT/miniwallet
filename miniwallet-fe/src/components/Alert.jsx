/**
 * Inline message shown above a form after a failed submit.
 *
 * `role="alert"` makes screen readers announce it as soon as it appears.
 */
export function Alert({ kind = 'error', children, onDismiss }) {
  if (!children) return null

  return (
    <div className={`alert alert-${kind}`} role="alert">
      <span>{children}</span>
      {onDismiss && (
        <button
          type="button"
          className="alert-close"
          onClick={onDismiss}
          aria-label="Tutup pesan"
        >
          ×
        </button>
      )}
    </div>
  )
}
