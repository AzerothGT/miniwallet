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
}) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
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
