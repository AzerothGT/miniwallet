import { CaretRight, Plus } from '@phosphor-icons/react'
import { Avatar } from './Avatar.jsx'

/**
 * Horizontal row of people this user has already paid, mirroring "Quick Send".
 *
 * Derived from transaction history rather than a separate contacts endpoint: the
 * people you have actually paid are the best available shortcut, and it costs no
 * extra request. Each contact carries the address the transfer was sent to, so
 * tapping one fills the transfer form completely.
 */
export function QuickSend({ contacts, loading, onPick, onAdd }) {
  return (
    <section className="card" aria-labelledby="quick-send-heading">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 id="quick-send-heading" className="text-base">
          Kirim Cepat
        </h2>

        {contacts.length > 0 && (
          <button
            type="button"
            onClick={onAdd}
            className="text-lime-deep flex cursor-pointer items-center gap-0.5
              text-xs font-semibold"
          >
            Lihat semua
            <CaretRight size={13} weight="bold" aria-hidden />
          </button>
        )}
      </div>

      {loading ? (
        <ul className="flex gap-3" aria-label="Memuat kontak">
          {[0, 1, 2, 3].map((slot) => (
            <li key={slot} className="w-14 shrink-0">
              <div className="bg-canvas size-14 animate-pulse rounded-full" />
              <div className="bg-canvas mt-2 h-2.5 animate-pulse rounded-full" />
            </li>
          ))}
        </ul>
      ) : contacts.length === 0 ? (
        <p className="text-ink-muted text-sm">
          Belum ada penerima. Setelah transfer pertama, mereka muncul di sini.
        </p>
      ) : (
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {contacts.map((contact) => (
            <li key={contact.username} className="shrink-0">
              <button
                type="button"
                onClick={() => onPick(contact)}
                title={`Kirim lagi ke ${contact.name} (${contact.transfer_target})`}
                className="flex w-[4.5rem] cursor-pointer flex-col items-center
                  gap-1.5 rounded-2xl py-1.5 transition hover:bg-lime-wash"
              >
                <Avatar name={contact.name} size="lg" />
                <span
                  className="text-ink-soft w-full truncate px-1 text-center
                    text-[0.6875rem] font-semibold"
                >
                  {contact.name.split(' ')[0]}
                </span>
              </button>
            </li>
          ))}

          <li className="shrink-0">
            <button
              type="button"
              onClick={onAdd}
              className="flex w-[4.5rem] cursor-pointer flex-col items-center
                gap-1.5 rounded-2xl py-1.5 transition hover:bg-lime-wash"
              aria-label="Transfer ke penerima baru"
            >
              <span
                className="bg-lime-zest text-forest-900 grid size-14
                  place-items-center rounded-full"
                aria-hidden
              >
                <Plus size={22} weight="bold" />
              </span>
              <span className="text-ink-soft text-[0.6875rem] font-semibold">
                Baru
              </span>
            </button>
          </li>
        </ul>
      )}
    </section>
  )
}
