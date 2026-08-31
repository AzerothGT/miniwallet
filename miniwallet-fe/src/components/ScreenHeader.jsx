import { ArrowLeft } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

/**
 * Centred screen title with a back affordance.
 *
 * On desktop the title moves left-aligned beside the back button: a centred
 * heading works on a 26rem column, but stranded in the middle of a wide page it
 * reads as a stray label rather than a page title.
 */
export function ScreenHeader({ title, to, action, tone = 'canvas' }) {
  const navigate = useNavigate()
  const onForest = tone === 'forest'

  return (
    <header className="flex items-center gap-3 px-5 pt-5 pb-3 lg:px-0 lg:pt-0">
      <button
        type="button"
        onClick={() => (to ? navigate(to) : navigate(-1))}
        aria-label="Kembali"
        className={`grid size-10 shrink-0 cursor-pointer place-items-center
          rounded-full transition ${
            onForest
              ? 'text-lime-glow bg-white/10 hover:bg-white/20'
              : 'text-ink bg-paper shadow-lift hover:bg-lime-wash'
          }`}
      >
        <ArrowLeft size={18} weight="bold" aria-hidden />
      </button>

      <h1
        className={`flex-1 text-center text-base lg:text-left lg:text-xl ${
          onForest ? 'text-lime-glow' : 'text-ink'
        }`}
      >
        {title}
      </h1>

      <div className="flex size-10 shrink-0 items-center justify-center">
        {action}
      </div>
    </header>
  )
}
