import Link from "next/link";
import Image from "next/image";

export default function NavBarNoAuth() {

    return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
                <Image src="/logos/logo.png" alt="Logo" width={60} height={60} />
              {/* <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VERyGANA
              </div> */}
              <div className="hidden md:flex items-center gap-6">
                <a href="#rifas" className="text-gray-700 hover:text-blue-600 transition-colors">Rifas</a>
                <a href="#tienda" className="text-gray-700 hover:text-blue-600 transition-colors">Tienda</a>
                <a href="#como-funciona" className="text-gray-700 hover:text-blue-600 transition-colors">Cómo Funciona</a>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Enlaces con el aspecto del botón: navegar es un enlace, no un botón dentro de un enlace (RN-5) */}
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700 active:bg-blue-800 sm:px-6 md:min-h-0"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700 active:bg-blue-800 sm:px-6 md:min-h-0"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>
      </nav>
      );
}
