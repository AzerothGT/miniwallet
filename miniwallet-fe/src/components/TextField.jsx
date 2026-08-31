export function TextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  disabled,
  autoComplete,
  placeholder,
  icon: Icon,
}) {
  const describedBy =
    [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className="mb-4">
      <label htmlFor={id} className="field-label">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="text-ink-faint pointer-events-none absolute top-1/2
              left-3.5 -translate-y-1/2"
            aria-hidden
          />
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`field-input ${Icon ? 'pl-10' : ''} ${
            error ? 'field-input-invalid' : ''
          }`}
        />
      </div>

      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
