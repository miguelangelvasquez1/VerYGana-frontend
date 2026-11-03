import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DESKTOP_NAV_ITEMS, isMobileBarItemActive, MOBILE_BAR_ITEMS } from './mobileNav'

// Marco visual de la barra del consumidor (escritorio, barra superior y barra inferior del celular). Lo comparten
// `NavBar` (con sesión, con sus acciones) y `GuestNavBar` (sin sesión, en `/`). Sin hooks ni estado: es HTML de servidor.
// Con `minimal` (barra sin sesión) solo quedan el logo, que lleva a `/`, y las acciones: sin accesos de sección y sin
// barra inferior en el celular.

interface NavBarFrameProps {
  pathname: string
  /** Solo logo (enlace a `/`) y acciones: sin accesos de sección ni barra inferior. */
  minimal?: boolean
  /** Lado derecho de la barra de escritorio (carrito, campana, llaves, perfil). */
  desktopActions?: ReactNode
  /** Lado derecho de la barra superior del celular. */
  mobileActions?: ReactNode
  /** Elemento extra al final de la barra inferior del celular (el botón "Perfil"). */
  bottomExtra?: ReactNode
}

const btnBase = 'cursor-pointer rounded-full transform transition-all duration-200 p-2 2xl:px-4 2xl:py-2'
const btnNormal = `${btnBase} bg-white/15 text-white font-medium hover:bg-white/30 hover:scale-105 backdrop-blur-sm`
const btnActive = `${btnBase} bg-white text-[#00a4ff] font-bold shadow-lg scale-105`

const getNavClass = (isActive: boolean) => (isActive ? btnActive : btnNormal)

export default function NavBarFrame({
  pathname,
  minimal = false,
  desktopActions,
  mobileActions,
  bottomExtra,
}: NavBarFrameProps) {
  // Con `minimal`, el logo es un enlace al inicio; sin él, el marcado queda igual que antes.
  const brand = (children: ReactNode) =>
    minimal ? (
      <Link href="/" className="flex min-h-11 min-w-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        {children}
      </Link>
    ) : (
      children
    )

  return (
    <>
      {/* ---------- DESKTOP NAV (top) ---------- */}
      <nav className="hidden lg:block sticky top-0 z-50 w-full bg-linear-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] text-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-2">
          {/* LOGO */}
          {brand(
            <div className="flex items-center gap-3">
              <Image src="/logos/logoDorado.png" alt="VERyGANA" width={52} height={52} className="object-contain shrink-0" />
              <div className="leading-tight">
                <p className="text-base font-extrabold text-white tracking-tight">VERyGANA</p>
                <p className="text-[10px] text-white/50 font-medium tracking-wide">La alegria de ganar</p>
              </div>
            </div>,
          )}

          {/* NAV BUTTONS */}
          {!minimal && (
            <div className="flex gap-2 2xl:gap-3">
              {DESKTOP_NAV_ITEMS.map(({ href, label, Icon }) => (
                <Link
                  href={href}
                  key={href}
                  title={label}
                  className={`${getNavClass(pathname === href)} inline-flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 2xl:hidden" />
                  <span className="hidden 2xl:inline">{label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* -------- WALLET + CART + NOTIFS + USER -------- */}
          <div className="flex items-center gap-6">
            {desktopActions}
          </div>
        </div>
      </nav>

      {/* ---------- MOBILE TOP BAR ---------- */}
      <div data-app-bar="top" className="lg:hidden immersive:hidden immersive-portrait:hidden sticky top-0 z-50 w-full bg-linear-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {brand(
            <div className="flex items-center gap-2.5">
              <Image src="/logos/logoDorado.png" alt="VERyGANA" width={42} height={42} className="object-contain shrink-0" />
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-white tracking-tight">VERyGANA</p>
                <p className="text-[9px] text-white/50 font-medium tracking-wide">La alegria de ganar</p>
              </div>
            </div>,
          )}
          <div className="flex items-center gap-3">
            {mobileActions}
          </div>
        </div>
      </div>

      {/* ---------- MOBILE BOTTOM NAVIGATION ---------- */}
      {!minimal && (
        <nav aria-label="Navegación inferior" data-app-bar="bottom" className="lg:hidden immersive:hidden immersive-portrait:hidden fixed bottom-0 left-0 right-0 z-50 bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] shadow-lg pb-safe">
          <div className="grid grid-cols-6 h-16">
            {MOBILE_BAR_ITEMS.map((item) => {
              const active = isMobileBarItemActive(pathname, item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="flex flex-col items-center justify-center active:bg-white/10 transition-colors"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={`p-1.5 rounded-full transition-all duration-200 ${active ? 'bg-white/20' : ''}`}>
                      <item.Icon className={`w-5 h-5 transition-all duration-200 ${active ? 'text-[#00a4ff]' : 'text-white/70'}`} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-all duration-200 ${active ? 'text-[#00a4ff]' : 'text-white/70'}`}>{item.label}</span>
                  </div>
                </Link>
              )
            })}

            {bottomExtra}
          </div>
        </nav>
      )}
    </>
  )
}
