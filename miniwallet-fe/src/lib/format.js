/** Format an integer amount of rupiah for display. */
export function formatRupiah(amount) {
  return `Rp ${Number(amount ?? 0).toLocaleString('id-ID')}`
}

/**
 * Strip everything that is not a digit.
 *
 * Amount inputs are text fields rather than `type="number"` so that pasted
 * separators and stray symbols can be cleaned as the user types, and so the
 * value sent to the API is always a plain integer string.
 */
export function digitsOnly(value) {
  return value.replace(/\D/g, '')
}

/** Render a digit string with thousand separators, e.g. "50000" -> "50.000". */
export function withThousandSeparators(digits) {
  if (!digits) return ''
  return Number(digits).toLocaleString('id-ID')
}

export function formatDateTime(iso) {
  if (!iso) return '-'

  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
