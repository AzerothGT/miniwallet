/**
 * Phone-shaped shell.
 *
 * The reference is a mobile product, so the app is laid out for a narrow column
 * and simply centred on wider screens. This keeps one set of styles instead of
 * maintaining a separate desktop composition that the design never specified.
 */
export function AppShell({ children, tone = 'canvas', nav }) {
  const surface = tone === 'forest' ? 'bg-forest-900 on-forest' : 'bg-canvas'

  return (
    <div className={`min-h-dvh ${surface}`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        {nav}
      </div>
    </div>
  )
}
