import { useEffect } from 'react'

/**
 * Let a physical keyboard drive the amount entry.
 *
 * The keypad exists because a touch screen has no number row; a desktop does,
 * and making someone click twelve buttons with a mouse when they could type is a
 * step backwards. Digits and Backspace are handled here, using exactly the same
 * rules as the keypad, so the two input methods cannot drift apart.
 *
 * Events originating in a text field are ignored, otherwise typing an email
 * address in the recipient box would also pile digits into the amount.
 */
export function useAmountKeyboard({
  value,
  onChange,
  maxLength = 12,
  enabled = true,
}) {
  useEffect(() => {
    if (!enabled) return undefined

    function handleKeydown(event) {
      const target = event.target
      const tag = target?.tagName

      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return
      }

      // Leave browser shortcuts alone.
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (/^\d$/.test(event.key)) {
        event.preventDefault()

        const next = (value + event.key).replace(/^0+(?=\d)/, '')

        if (next.length <= maxLength) onChange(next)
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        onChange(value.slice(0, -1))
      }
    }

    window.addEventListener('keydown', handleKeydown)

    return () => window.removeEventListener('keydown', handleKeydown)
  }, [value, onChange, maxLength, enabled])
}
