import { CoinsIcon as Coins, WalletIcon as Wallet } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { PillButton } from '../../components/PillButton.jsx'

/**
 * Onboarding screen.
 *
 * Deep forest fills the viewport so the lime headline and the white CTA carry all
 * the contrast. The illustration is built from layered shapes rather than a
 * raster asset, which keeps it crisp at any size and adds nothing to download.
 *
 * Mobile stacks illustration over copy; desktop places them side by side, since a
 * 2.5rem headline centred under a small graphic in a wide window reads as an
 * accident rather than a composition.
 */
export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="bg-forest-900 on-forest min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col px-6 pt-8 pb-8 lg:max-w-6xl lg:px-12 lg:py-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
            className="size-9 rounded-xl"
          />
          <span className="font-display font-bold text-white">Mini Wallet</span>
        </div>

        <div className="flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Illustration. */}
          <div className="relative my-8 flex flex-1 items-center justify-center lg:order-2 lg:my-0">
            <div
              aria-hidden
              className="bg-lime-zest/20 absolute size-64 rounded-full blur-3xl
                lg:size-96"
            />

            <div
              aria-hidden
              className="animate-rise relative grid size-44 place-items-center
                rounded-[2.5rem] bg-gradient-to-br from-sage-200 to-sage-400
                shadow-lift-lg lg:size-72 lg:rounded-[4rem]"
            >
              <Coins
                size={72}
                weight="duotone"
                className="text-forest-800 lg:size-32"
              />

              <span
                className="bg-lime-zest absolute -top-4 -right-4 grid size-14
                  place-items-center rounded-2xl shadow-lime lg:-top-7 lg:-right-7
                  lg:size-24 lg:rounded-[2rem]"
              >
                <Wallet
                  size={24}
                  weight="bold"
                  className="text-forest-900 lg:size-11"
                />
              </span>
            </div>
          </div>

          {/* Copy and call to action. */}
          <div className="lg:order-1">
            <h1 className="text-[2.5rem] leading-[1.06] font-bold text-white lg:text-[3.5rem]">
              Kendalikan Uang Anda,{' '}
              <span className="text-lime-zest">Tanpa Ribet</span>
            </h1>

            <p className="mt-4 max-w-sm text-white/65 lg:mt-6 lg:text-lg">
              Saldo, transfer, dan mutasi dalam satu tempat. Setiap transaksi
              tercatat dan dapat dilacak.
            </p>

            <div className="mt-8 lg:max-w-xs">
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
    </div>
  )
}
