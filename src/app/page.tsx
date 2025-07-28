import Image from "next/image";
import Login from "./login/page";
import NavBarNoAuth from "@/components/NavBarNoAuth";
import Carousel from "@/components/Carousel";

const phones = [
  {
    id: 1,
    name: 'iPhone 14 Pro Max',
    image: '/phones/iphone.webp',
    date: '22 de julio de 2025',
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24',
    image: '/phones/samsung.png',
    date: '23 de julio de 2025',
  },
  {
    id: 3,
    name: 'Xiaomi Redmi Note 13',
    image: '/phones/xiaomi.png',
    date: '24 de julio de 2025',
  },
]

export default function Home() {
  return (
    <>
      {/* Navbar */}
      <NavBarNoAuth />

      {/* Contenido principal */}
      <main className="bg-gradient-to-b from-[#E6F2FF] to-[#F4F8FB] py-10">
        {/* Contenedor central */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Título principal */}
          <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-10">
            Celulares en Rifa Hoy
          </h1>

          {/* Carrusel */}
          <Carousel phones={phones} />

          {/* Sección: ¿Cómo funciona Rifacel? */}
          <section className="mt-16 bg-white rounded-xl shadow p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">🤑 ¿Cómo puedes ganar en Rifacel?</h2>
            <ul className="list-disc list-inside text-gray-700 text-lg space-y-2 text-center sm:text-left">
              <li>Crea una cuenta</li>
              <li>Deposita dinero a tu cuenta</li>
              <li>Compra el boleto del celular que quieras</li>
              <li>Espera el resultado oficial de la lotería asociada</li>
              <li>Gana si tu número coincide con el resultado</li>
            </ul>
          </section>

          {/* Sección: Participa */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📱 Participa por alguno de estos teléfonos</h2>
            {/* Puedes agregar aquí otro carrusel o cards de productos */}
            <p className="text-gray-600">Muy pronto agregaremos más celulares para que participes.</p>
          </section>

          {/* Sección: Loterías asociadas */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🎲 Loterías asociadas a Rifacel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
              <Image
                className="rounded-xl shadow-md"
                src="/lotteries/loteria-boyaca.avif"
                alt="Lotería de Boyacá"
                width={250}
                height={150}
              />
              <Image
                className="rounded-xl shadow-md"
                src="/lotteries/loteria-manizales.png"
                alt="Lotería de Manizales"
                width={250}
                height={150}
              />
              <Image
                className="rounded-xl shadow-md"
                src="/lotteries/loteria-quindio.png"
                alt="Lotería del Quindío"
                width={250}
                height={150}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
