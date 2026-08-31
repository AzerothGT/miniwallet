import { BottomNav, SideNav } from './Navigation.jsx'

/**
 * Application shell.
 *
 * Narrow screens get the phone layout from the reference: one column with a
 * floating bottom bar. From `lg` up, a persistent sidebar replaces that bar and
 * the content is allowed to widen, because a 26rem column stranded in the middle
 * of a 1400px window wastes the space rather than using it.
 *
 * `maxWidth` is per-screen rather than global: a dashboard benefits from two
 * columns, whereas a transfer form does not become easier to read at 1200px.
 */
export function AppShell({ children, nav = true, maxWidth = 'max-w-5xl' }) {
  return (
    <div className="bg-canvas min-h-dvh lg:flex">
      {nav && <SideNav />}

      <div className="flex min-h-dvh w-full flex-1 flex-col lg:min-h-dvh">
        <div
          className={`mx-auto flex w-full max-w-[26rem] flex-1 flex-col
            lg:max-w-none lg:px-8 lg:py-6 ${nav ? '' : 'lg:mx-auto'}`}
        >
          <div className={`flex flex-1 flex-col lg:mx-auto lg:w-full ${maxWidth}`}>
            {children}
          </div>
        </div>

        {nav && <BottomNav />}
      </div>
    </div>
  )
}

/**
 * Shell for focused single-task screens (top up, transfer).
 *
 * These keep a narrow measure even on desktop: a keypad and a short form do not
 * improve when stretched, and a centred column keeps the amount, the form and
 * the keypad within one eye movement of each other.
 */
export function FocusShell({ children, nav = true }) {
  return (
    <div className="bg-canvas min-h-dvh lg:flex">
      {nav && <SideNav />}

      <div className="flex min-h-dvh w-full flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col lg:py-6">
          {children}
        </div>

        {nav && <BottomNav />}
      </div>
    </div>
  )
}
