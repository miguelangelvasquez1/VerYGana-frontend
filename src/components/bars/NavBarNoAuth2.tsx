import Link from "next/link";
import Image from "next/image";

export default function NavBarNoAuth2() {

    return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
                <Image src="/logos/logo3.png" alt="Logo" width={70} height={70} />
              {/* <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VerYGana
              </div> */}
              <div className="hidden md:flex items-center gap-6">
                <a href="#rifas" className="text-gray-700 hover:text-blue-600 transition-colors">Rifas</a>
                <a href="#tienda" className="text-gray-700 hover:text-blue-600 transition-colors">Tienda</a>
                <a href="#como-funciona" className="text-gray-700 hover:text-blue-600 transition-colors">Cómo Funciona</a>
                <a href="/raffles" className="text-gray-700 hover:text-blue-600 transition-colors">Borrar: Ir a Auth</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden md:block">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                Iniciar Sesión
              </button>
              </Link>
              <Link href="/register" >
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                Crear Cuenta
              </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      );
}