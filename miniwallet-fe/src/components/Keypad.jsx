import { Backspace } from '@phosphor-icons/react'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del']

/**
 * Numeric keypad for amount entry, as in the reference's Send Money screen.
 *
 * A keypad instead of a text input means non-digits are unreachable rather than
 * merely filtered: "abc" and "50.000!" simply cannot be produced. The API
 * validation still runs, but at this layer the invalid input never exists.
 *
 * `000` is included because rupiah amounts are habitually thousands — it saves
 * three taps on almost every transaction.
 */
export function Keypad({ value, onChange, disabled, maxLength = 12 }) {
  function press(key) {
    if (disabled) return

    if (key === 'del') {
      onChange(value.slice(0, -1))
      return
    }

    const next = (value + key).replace(/^0+(?=\d)/, '')

    if (next.length > maxLength) return

    onChange(next)
  }

  return (
    <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Papan angka">
      {KEYS.map((key) => {
        const isDelete = key === 'del'

        return (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            disabled={disabled}
            aria-label={isDelete ? 'Hapus satu angka' : key}
            className={`font-display grid h-14 cursor-pointer place-items-center
              rounded-2xl text-xl font-semibold transition
              disabled:cursor-not-allowed disabled:opacity-45 ${
                isDelete
                  ? 'bg-canvas text-ink-soft enabled:hover:bg-negative-wash enabled:hover:text-negative'
                  : 'bg-paper shadow-lift text-ink enabled:hover:bg-lime-wash'
              }`}
          >
            {isDelete ? (
              <Backspace size={22} weight="bold" aria-hidden />
            ) : (
              key
            )}
          </button>
        )
      })}
    </div>
  )
}
