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

/** Time only, for rows that already sit under a date heading. */
export function formatTime(iso) {
  if (!iso) return '-'

  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Heading for a group of transactions: "Hari ini", "Kemarin", or a full date.
 *
 * Relative labels are only used for the two most recent days. Beyond that they
 * stop helping — "3 hari lalu" forces the reader to do arithmetic, whereas an
 * explicit date does not.
 */
export function formatDateGroup(iso) {
  if (!iso) return 'Tanpa tanggal'

  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a, b) => a.toDateString() === b.toDateString()

  if (sameDay(date, today)) return 'Hari ini'
  if (sameDay(date, yesterday)) return 'Kemarin'

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}

/**
 * Group transactions into date buckets, preserving the order the API returned.
 *
 * The API already sorts newest first, so iterating in order and starting a new
 * bucket whenever the day changes is enough — no sorting or comparison needed.
 *
 * @returns {Array<{key: string, label: string, items: Array<object>}>}
 */
export function groupByDate(transactions) {
  const groups = []

  for (const transaction of transactions) {
    const key = transaction.created_at?.slice(0, 10) ?? 'unknown'
    const last = groups.at(-1)

    if (last?.key === key) {
      last.items.push(transaction)
    } else {
      groups.push({
        key,
        label: formatDateGroup(transaction.created_at),
        items: [transaction],
      })
    }
  }

  return groups
}
