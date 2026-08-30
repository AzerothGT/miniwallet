/**
 * Submit button that shows progress and cannot be pressed twice.
 *
 * Disabling while `loading` is what prevents the "clicked ten times" problem:
 * without it, an impatient user can fire ten transfers from one form.
 */
export function SubmitButton({
  loading = false,
  disabled = false,
  loadingText = 'Memproses…',
  children,
  ...props
}) {
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={loading || disabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="spinner spinner-sm" aria-hidden="true" />}
      {loading ? loadingText : children}
    </button>
  )
}
