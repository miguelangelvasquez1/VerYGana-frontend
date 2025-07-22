import Carousel from "@/components/Carousel";
import NavBarNoAuth from "@/components/NavBarNoAuth";
import Navbar from "@/components/NavBar";

const phones = [
  {
    id: 1,
    name: 'iPhone 14 Pro Max',
    image: '/iphone.webp',
    date: '22 de julio de 2025',
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24',
    image: '/samsung.png',
    date: '23 de julio de 2025',
  },
  {
    id: 3,
    name: 'Xiaomi Redmi Note 13',
    image: '/xiaomi.png',
    date: '24 de julio de 2025',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Navbar arriba de todo */}
      <NavBarNoAuth/>

      {/* Contenido principal */}
      <main className="py-10">
        <h1 className="text-3xl font-bold text-center mb-6">
          Celulares en Rifa Hoy
        </h1>
        <Carousel phones={phones} />
        <div>
            <h2 className="text-3xl font font-semibold text-center mt-10">🤑 ¿Como puedes ganar en Rifacel?</h2>
            <ul className="text-center mt-5">
                <li>Crea una cuenta</li>
                <li>Deposita dinero a tu cuenta</li>
                <li>Compra el boleto del celular que quieras</li>
                <li>Espera el resultado oficial de la lotería asociada</li>
                <li>Gana si tu número coincide con el resultado</li>
            </ul>
        </div>
      </main>
    </>
  )
}