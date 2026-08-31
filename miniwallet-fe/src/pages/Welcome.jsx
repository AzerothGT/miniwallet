import { Coins, Wallet } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { PillButton } from '../components/PillButton.jsx'

/**
 * Onboarding screen, matching the reference's first frame.
 *
 * Deep forest fills the viewport so the lime headline and the white CTA carry
 * all the contrast; the illustration is built from layered shapes rather than a
 * raster asset, which keeps it crisp at any size and adds nothing to download.
 */
export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="bg-forest-900 on-forest min-h-dvh">
      <div
        className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col
          px-6 pt-8 pb-8"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="bg-lime-zest text-forest-900 grid size-9 place-items-center
              rounded-xl"
            aria-hidden
          >
            <Wallet size={18} weight="bold" />
          </span>
          <span className="font-display font-bold text-white">Mini Wallet</span>
        </div>

        {/* Illustration. */}
        <div className="relative my-8 flex flex-1 items-center justify-center">
          <div
            aria-hidden
            className="bg-lime-zest/20 absolute size-64 rounded-full blur-3xl"
          />

          <div
            aria-hidden
            className="animate-rise relative grid size-44 place-items-center
              rounded-[2.5rem] bg-gradient-to-br from-sage-200 to-sage-400
              shadow-lift-lg"
          >
            <Coins size={72} weight="duotone" className="text-forest-800" />

            <span
              className="bg-lime-zest absolute -top-4 -right-4 grid size-14
                place-items-center rounded-2xl shadow-lime"
            >
              <Wallet size={24} weight="bold" className="text-forest-900" />
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-[2.5rem] leading-[1.06] font-bold text-white">
            Kendalikan Uang Anda,{' '}
            <span className="text-lime-zest">Tanpa Ribet</span>
          </h1>

          <p className="mt-4 max-w-sm text-white/65">
            Saldo, transfer, dan mutasi dalam satu tempat. Setiap transaksi
            tercatat dan dapat dilacak.
          </p>

          <div className="mt-8">
            <PillButton type="button" onClick={() => navigate('/register')}>
              Mulai Sekarang
            </PillButton>

            <p className="mt-4 text-center text-sm text-white/60">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-lime-zest font-semibold">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
