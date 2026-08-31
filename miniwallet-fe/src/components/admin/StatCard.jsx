/**
 * Single figure with an icon.
 *
 * `hint` carries the secondary reading (a share, a comparison) so the number
 * itself never has to be explained in a separate line of prose.
 */
export function StatCard({ icon: Icon, label, value, hint, tone = 'lime', loading }) {
  const tones = {
    lime: 'bg-lime-wash text-lime-deep',
    positive: 'bg-positive-wash text-positive',
    negative: 'bg-negative-wash text-negative',
    ink: 'bg-canvas text-ink-soft',
  }

  return (
    <div className="card">
      <span
        className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}
        aria-hidden
      >
        <Icon size={17} weight="bold" />
      </span>

      <p className="text-ink-muted mt-3 text-xs font-semibold">{label}</p>

      {loading ? (
        <div className="bg-canvas mt-1 h-7 w-24 animate-pulse rounded-lg" />
      ) : (
        <p className="font-display mt-0.5 text-xl font-bold tabular-nums">
          {value}
        </p>
      )}

      {hint && !loading && (
        <p className="text-ink-faint mt-1 text-[0.6875rem]">{hint}</p>
      )}
    </div>
  )
}
