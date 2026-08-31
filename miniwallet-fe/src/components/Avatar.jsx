import { colorFor, initialsFor } from '../lib/avatar.js'

const SIZES = {
  sm: 'size-8 text-[0.6875rem]',
  md: 'size-[2.625rem] text-[0.8125rem]',
  lg: 'size-14 text-[1.0625rem]',
}

/**
 * Initials avatar in a deterministic colour.
 *
 * Hidden from assistive tech by default: the person's name is almost always
 * rendered as text right beside it, so announcing the initials too would just be
 * noise. Pass `label` when the avatar stands alone.
 */
export function Avatar({ name, size = 'md', label, className = '' }) {
  return (
    <span
      className={`text-ink inline-flex shrink-0 items-center justify-center
        rounded-full font-display font-semibold tracking-tight select-none
        ring-2 ring-white/55 ${SIZES[size]} ${className}`}
      style={{ backgroundColor: colorFor(name) }}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      title={label}
    >
      {initialsFor(name)}
    </span>
  )
}
