import { CaretDown, Globe } from '@phosphor-icons/react'
import { useState } from 'react'
import { eventGlyph } from '../../lib/activityGlyphs.js'
import { formatDateTime } from '../../lib/format.js'
import { Avatar } from '../Avatar.jsx'
import { CategoryBadge } from './Badges.jsx'

/**
 * One entry in the audit trail.
 *
 * The event-specific `properties` are collapsed behind a toggle: they are what you
 * need when investigating one entry, and noise when scanning a hundred. Only rows
 * that actually carry properties offer the toggle.
 */
export function ActivityRow({ entry }) {
  const [open, setOpen] = useState(false)

  const { Icon, tone } = eventGlyph(entry.event)
  const properties = entry.properties ?? {}
  const hasProperties = Object.keys(properties).length > 0

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full
            ${tone}`}
          aria-hidden
        >
          <Icon size={16} weight="bold" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className={`text-sm font-semibold ${
                entry.alarming ? 'text-negative' : ''
              }`}
            >
              {entry.event_label}
            </p>
            <CategoryBadge
              category={entry.category}
              label={entry.category_label}
            />
          </div>

          <p className="text-ink-soft mt-0.5 text-sm">{entry.description}</p>

          <div className="text-ink-faint mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem]">
            <span>{formatDateTime(entry.created_at)}</span>

            {entry.ip_address && (
              <span className="inline-flex items-center gap-1">
                <Globe size={11} aria-hidden />
                {entry.ip_address}
              </span>
            )}

            {/*
              The actor is only present when it differs from the subject, so its
              mere existence already means "someone acted on someone else".
            */}
            {entry.actor && (
              <span className="inline-flex items-center gap-1">
                <Avatar name={entry.actor.name} size="sm" className="!size-4 !text-[0.5rem]" />
                oleh {entry.actor.name}
              </span>
            )}

            {hasProperties && (
              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="text-lime-deep inline-flex cursor-pointer items-center
                  gap-0.5 font-semibold"
              >
                Detail
                <CaretDown
                  size={10}
                  weight="bold"
                  className={`transition ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
            )}
          </div>

          {open && hasProperties && (
            <dl className="bg-canvas mt-2 grid gap-1 rounded-xl px-3 py-2 text-xs">
              {Object.entries(properties).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="text-ink-faint min-w-28 shrink-0">
                    {key.replaceAll('_', ' ')}
                  </dt>
                  <dd className="text-ink-soft min-w-0 break-words font-medium">
                    {formatValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </li>
  )
}

/** Booleans read as words; numbers keep Indonesian grouping. */
function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (typeof value === 'number') return value.toLocaleString('id-ID')

  return String(value)
}
