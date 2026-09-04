import { CaretLeftIcon as CaretLeft, CaretRightIcon as CaretRight } from '@phosphor-icons/react'

/**
 * Build a compact page window: 1 … 4 5 6 … 12
 *
 * The first and last page are always reachable, plus one neighbour either side of
 * the current page. Ellipses are rendered as inert text, never as buttons, so
 * there is nothing misleading to click or tab onto.
 */
function pageWindow(current, last) {
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1)
  }

  const pages = new Set([1, last, current])

  if (current - 1 > 1) pages.add(current - 1)
  if (current + 1 < last) pages.add(current + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const withGaps = []

  for (const [index, page] of sorted.entries()) {
    if (index > 0 && page - sorted[index - 1] > 1) {
      withGaps.push({ gap: true, key: `gap-${page}` })
    }
    withGaps.push(page)
  }

  return withGaps
}

/**
 * Page navigation for a Laravel paginator payload.
 *
 * Expects `meta` in the shape `{ current_page, last_page, total }`; renders
 * nothing when there is only one page, so callers need no guard.
 */
export function Pagination({ meta, onPageChange, label = 'Navigasi halaman' }) {
  if (!meta || meta.last_page <= 1) return null

  const { current_page: current, last_page: last } = meta

  return (
    <nav
      aria-label={label}
      className="border-hairline mt-3 flex items-center justify-between gap-2
        border-t pt-3"
    >
      <button
        type="button"
        onClick={() => onPageChange(current - 1)}
        disabled={current <= 1}
        aria-label="Halaman sebelumnya"
        className="text-ink-soft bg-canvas grid size-9 shrink-0 cursor-pointer
          place-items-center rounded-full transition
          enabled:hover:bg-lime-wash enabled:hover:text-lime-deep
          disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CaretLeft size={15} weight="bold" aria-hidden />
      </button>

      <ul className="flex items-center gap-1">
        {pageWindow(current, last).map((entry) =>
          typeof entry === 'object' ? (
            <li
              key={entry.key}
              className="text-ink-faint px-0.5 text-xs"
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                onClick={() => onPageChange(entry)}
                aria-label={`Halaman ${entry}`}
                aria-current={entry === current ? 'page' : undefined}
                className={`grid size-9 cursor-pointer place-items-center
                  rounded-full text-xs font-semibold transition ${
                    entry === current
                      ? 'bg-lime-zest text-forest-900'
                      : 'text-ink-soft hover:bg-lime-wash hover:text-lime-deep'
                  }`}
              >
                {entry}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(current + 1)}
        disabled={current >= last}
        aria-label="Halaman berikutnya"
        className="text-ink-soft bg-canvas grid size-9 shrink-0 cursor-pointer
          place-items-center rounded-full transition
          enabled:hover:bg-lime-wash enabled:hover:text-lime-deep
          disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CaretRight size={15} weight="bold" aria-hidden />
      </button>
    </nav>
  )
}
