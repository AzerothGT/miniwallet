import { formatRupiah } from '../../lib/format.js'

/**
 * Daily transaction volume for the last seven days.
 *
 * Bars rather than a line: seven discrete daily totals are values to compare, and
 * a spline between them would imply amounts on the hours in between that do not
 * exist. The same numbers are repeated as a screen-reader table, so the figures
 * are available without reading the shapes.
 */
export function VolumeChart({ daily, loading }) {
  if (loading) {
    return (
      <section className="card" aria-labelledby="volume-heading">
        <h2 id="volume-heading" className="mb-4 text-base">
          Volume 7 Hari
        </h2>
        <div className="bg-canvas h-40 animate-pulse rounded-2xl lg:h-56" />
      </section>
    )
  }

  const series = daily ?? []
  const peak = Math.max(...series.map((day) => day.total), 1)

  const label = (iso) =>
    new Date(iso).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
    })

  return (
    <section className="card" aria-labelledby="volume-heading">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="volume-heading" className="text-base">
          Volume 7 Hari
        </h2>
        <p className="text-ink-faint text-xs">
          Puncak {formatRupiah(peak)}
        </p>
      </div>

      {series.length === 0 ? (
        <p className="text-ink-muted py-12 text-center text-sm">
          Belum ada transaksi dalam tujuh hari terakhir.
        </p>
      ) : (
        <>
          <ul className="flex h-40 items-end gap-2 lg:h-56" aria-hidden>
            {series.map((day) => (
              <li
                key={day.day}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="bg-lime-zest w-full rounded-t-lg"
                    style={{
                      height: `${Math.max((day.total / peak) * 100, 3)}%`,
                    }}
                    title={`${label(day.day)}: ${formatRupiah(day.total)}`}
                  />
                </div>
                <span className="text-ink-faint text-[0.625rem] font-semibold">
                  {label(day.day)}
                </span>
              </li>
            ))}
          </ul>

          <table className="sr-only">
            <caption>Volume transaksi harian</caption>
            <thead>
              <tr>
                <th scope="col">Tanggal</th>
                <th scope="col">Jumlah transaksi</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {series.map((day) => (
                <tr key={day.day}>
                  <th scope="row">{label(day.day)}</th>
                  <td>{day.count}</td>
                  <td>{formatRupiah(day.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
