import { digitsOnly, withThousandSeparators } from '../lib/format.js'

/**
 * Text input for rupiah amounts.
 *
 * Kept as `type="text"` with an explicit digit filter rather than
 * `type="number"`: number inputs still accept `e`, `+`, `-` and decimals in most
 * browsers, and expose a spinner that makes little sense for currency. Here the
 * displayed value is grouped for readability while the value handed to the
 * parent stays a bare digit string.
 */
export function AmountInput({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
}) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-prefix">
        <span aria-hidden="true">Rp</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={withThousandSeparators(value)}
          onChange={(event) => onChange(digitsOnly(event.target.value))}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          disabled={disabled}
          placeholder="0"
        />
      </div>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
