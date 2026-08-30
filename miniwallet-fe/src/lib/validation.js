/**
 * Client-side amount rules.
 *
 * These mirror the backend rules so the submit button can stay disabled until
 * the input is plausible. The server remains the source of truth; this only
 * saves a round trip and gives immediate feedback.
 */
export const AMOUNT_LIMITS = {
  min: 1000,
  max: 10_000_000,
}

/**
 * @param {string} digits digit-only string from AmountInput
 * @returns {string|null} error message, or null when acceptable
 */
export function validateAmount(digits) {
  if (!digits) {
    return 'Nominal tidak boleh kosong.'
  }

  if (!/^\d+$/.test(digits)) {
    return 'Nominal harus berupa angka.'
  }

  const amount = Number(digits)

  if (!Number.isSafeInteger(amount)) {
    return 'Nominal harus berupa angka.'
  }

  if (amount < AMOUNT_LIMITS.min) {
    return `Nominal minimal Rp ${AMOUNT_LIMITS.min.toLocaleString('id-ID')}.`
  }

  if (amount > AMOUNT_LIMITS.max) {
    return 'Nominal melebihi batas maksimum transaksi.'
  }

  return null
}

/** Accepts either an email address or an Indonesian mobile number. */
export function validateRecipient(value) {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Email atau nomor HP penerima tidak boleh kosong.'
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  const isPhone = /^08\d{8,12}$/.test(trimmed)

  if (!isEmail && !isPhone) {
    return 'Masukkan email yang valid atau nomor HP yang diawali 08.'
  }

  return null
}

export function validateEmail(value) {
  const trimmed = value.trim()

  if (!trimmed) return 'Email tidak boleh kosong.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Format email tidak valid.'
  }

  return null
}

export function validatePassword(value) {
  if (!value) return 'Password tidak boleh kosong.'
  if (value.length < 8) return 'Password minimal 8 karakter.'

  return null
}
