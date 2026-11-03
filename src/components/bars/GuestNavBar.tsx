import Link from 'next/link'
import NavBarFrame from './NavBarFrame'

// Barra para quien no tiene sesión (`/`): solo el logo (enlace a `/`) y "Iniciar sesión" y "Registrarse" a la vista, en
// todos los tamaños y sin barra inferior. Los accesos a las secciones están en las tarjetas del home. De servidor.
// Ninguno de los dos enlaces lleva `from`: el registro no vuelve a la sección y el login sin `from` va al inicio del rol.

const BASE =
  'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:min-h-0 lg:py-2 lg:hover:scale-105'
const LOGIN = `${BASE} bg-white/15 text-white hover:bg-white/30`
const REGISTER = `${BASE} bg-linear-to-r from-[#b8860b] via-[#FFD700] to-[#c9a227] text-gray-900 hover:brightness-110`

function EntryLinks() {
  return (
    <>
      <Link href="/login" className={LOGIN}>
        Iniciar sesión
      </Link>
      <Link href="/register" className={REGISTER}>
        Registrarse
      </Link>
    </>
  )
}

export default function GuestNavBar() {
  return (
    <NavBarFrame
      pathname="/"
      minimal
      desktopActions={<EntryLinks />}
      mobileActions={<EntryLinks />}
    />
  )
}
