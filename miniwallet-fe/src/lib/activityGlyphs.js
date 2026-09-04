import {
  ArrowsLeftRightIcon as ArrowsLeftRight,
  PlusIcon as Plus,
  ProhibitIcon as Prohibit,
  ShieldCheckIcon as ShieldCheck,
  SignInIcon as SignIn,
  SignOutIcon as SignOut,
  UserCheckIcon as UserCheck,
  UserPlusIcon as UserPlus,
  WarningIcon as Warning,
} from '@phosphor-icons/react'

/**
 * Glyph and tone per activity event.
 *
 * Keyed by the event value from the API rather than derived from its category, so
 * a login and a failed login look different — which is the distinction an auditor
 * scans a page for.
 *
 * Plain `.js` because it holds no JSX: the icons are component references, and
 * keeping them out of a `.jsx` module lets fast refresh work on the components
 * that consume them.
 */
const GLYPHS = {
  registered: { Icon: UserPlus, tone: 'bg-lime-wash text-lime-deep' },
  logged_in: { Icon: SignIn, tone: 'bg-positive-wash text-positive' },
  login_failed: { Icon: Warning, tone: 'bg-negative-wash text-negative' },
  logged_out: { Icon: SignOut, tone: 'bg-canvas text-ink-muted' },
  topped_up: { Icon: Plus, tone: 'bg-lime-wash text-lime-deep' },
  transfer_sent: { Icon: ArrowsLeftRight, tone: 'bg-canvas text-ink-soft' },
  user_suspended: { Icon: Prohibit, tone: 'bg-negative-wash text-negative' },
  user_reactivated: { Icon: UserCheck, tone: 'bg-positive-wash text-positive' },
  role_changed: { Icon: ShieldCheck, tone: 'bg-ink text-lime-glow' },
}

/* An event the client has not been taught yet still renders, rather than crashing. */
const FALLBACK = { Icon: Warning, tone: 'bg-canvas text-ink-muted' }

export function eventGlyph(event) {
  return GLYPHS[event] ?? FALLBACK
}
