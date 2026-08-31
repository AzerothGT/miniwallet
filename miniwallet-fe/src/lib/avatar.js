/*
 * Deterministic avatar identity.
 *
 * The API returns no profile images, so identity is derived from the name: the
 * same person always gets the same initials and the same colour, in every
 * session and on every device, without storing anything.
 */

const PALETTE = [
  '#f6d365',
  '#a8d8b9',
  '#f4a896',
  '#b8c6f0',
  '#e6b3d9',
  '#9fd4d1',
]

export function initialsFor(name) {
  if (!name) return '?'

  const words = name.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function colorFor(name) {
  if (!name) return PALETTE[0]

  // Small stable string hash. Collisions only affect colour, never identity.
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997
  }

  return PALETTE[hash % PALETTE.length]
}
