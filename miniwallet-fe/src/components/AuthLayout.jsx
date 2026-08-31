import { Wallet } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

/**
 * Shared shell for the login and register screens.
 *
 * Narrow screens get a forest header band with the form on a rounded sheet
 * overlapping it. From `lg` the two stack side by side: the brand panel becomes a
 * full-height column carrying the value proposition, and the form sits on white
 * beside it. That is the conventional split for a sign-in page, and it stops the
 * form from floating in the middle of an otherwise empty window.
 */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="bg-forest-900 min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel. */}
      <aside className="on-forest relative overflow-hidden px-6 pt-10 pb-12 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 hidden size-96
            rounded-full bg-lime-zest/15 blur-3xl lg:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-0 hidden size-96
            rounded-full bg-sage-400/15 blur-3xl lg:block"
        />

        <Link to="/" className="relative inline-flex items-center gap-2.5">
          <span
            className="bg-lime-zest text-forest-900 grid size-9 place-items-center
              rounded-xl"
            aria-hidden
          >
            <Wallet size={18} weight="bold" />
          </span>
          <span className="font-display font-bold text-white">Mini Wallet</span>
        </Link>

        {/* Mobile: the page title lives here, above the form sheet. */}
        <div className="relative lg:hidden">
          <h1 className="mt-8 text-[1.75rem] leading-tight text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-white/60">{subtitle}</p>
        </div>

        {/* Desktop: room for the value proposition instead. */}
        <div className="relative hidden lg:block">
          <p className="font-display max-w-md text-[2.5rem] leading-[1.08] font-bold text-white">
            Kirim uang, secepat mengirim pesan.
          </p>
          <p className="mt-4 max-w-sm text-white/60">
            Saldo, transfer, dan mutasi dalam satu tempat. Setiap transaksi
            tercatat dan dapat dilacak.
          </p>
        </div>

        <p className="relative hidden text-xs text-white/45 lg:block">
          Dilindungi autentikasi token dan integritas transaksional.
        </p>
      </aside>

      {/* Form panel. */}
      <main
        className="rounded-t-sheet bg-canvas animate-sheet px-6 pt-7 pb-8
          lg:flex lg:animate-none lg:items-center lg:rounded-none lg:px-12
          lg:py-14"
      >
        <div className="w-full lg:max-w-md">
          <header className="mb-7 hidden lg:block">
            <h1 className="text-[1.75rem] leading-tight">{title}</h1>
            <p className="text-ink-muted mt-1.5">{subtitle}</p>
          </header>

          {children}

          {footer && (
            <p className="text-ink-muted mt-6 text-center text-sm">{footer}</p>
          )}
        </div>
      </main>
    </div>
  )
}
