import { Wallet } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

/**
 * Shared shell for the login and register screens.
 *
 * A forest header band carries the brand and title, and the form sits on a
 * rounded sheet that overlaps it — the layering pattern from the reference,
 * which also visually separates "where am I" from "what do I fill in".
 */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="bg-forest-900 min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col">
        <header className="on-forest px-6 pt-10 pb-12">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span
              className="bg-lime-zest text-forest-900 grid size-9
                place-items-center rounded-xl"
              aria-hidden
            >
              <Wallet size={18} weight="bold" />
            </span>
            <span className="font-display font-bold text-white">
              Mini Wallet
            </span>
          </Link>

          <h1 className="mt-8 text-[1.75rem] leading-tight text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-white/60">{subtitle}</p>
        </header>

        <main
          className="rounded-t-sheet bg-canvas animate-sheet flex-1 px-6 pt-7
            pb-8"
        >
          {children}

          {footer && (
            <p className="text-ink-muted mt-6 text-center text-sm">{footer}</p>
          )}
        </main>
      </div>
    </div>
  )
}
