'use client'

import AdCard from "@/components/AdCard";
import NavBarNoAuth from "@/components/bars/NavBarNoAuth";
import Carousel from "@/components/Carousel";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductsPage/ProductCard"; // Asegúrate de tenerlo
import { useState } from "react";

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

const products = [
  {
    id: "1",
    name: "Camiseta de manga corta de cuello redondo para hombre",
    imageUrl: "/products/camiseta.png",
    image: "/products/camiseta.png",
    date: '2024-06-02',
    price: 40000,
    stock: 1000,
    isActive: true,
  },
  {
    id: "2",
    name: "Casco Edge Integral Shanghai Quartz Dot Y Ece 2206",
    imageUrl: "/products/casco.png",
    image: "/products/casco.png",
    date: '2024-06-02',
    price: 327000,
    stock: 0,
    isActive: false,
  },
  {
    id: "3",
    name: "Anillos Pareja Plata 925 Mujer Hombre Elegantes Compromiso",
    imageUrl: "/products/anillos.png",
    image: "/products/anillos.png",
    date: '2024-06-02',
    price: 26400,
    stock: 57,
    isActive: true,
  },
]

const ads = [
  {
    title: "Ad 1",
    description: "prueba",
    advertiser: "Hijueputa",
    minimumViewTime: 30,
    creditReward: 5,
    url: "/ads/ad1.mp4",
  },
]

export default function Home() {
  const [showAd, setShowAd] = useState(false);

  return (
    <>
      <NavBarNoAuth />

      <main className="primary-bg py-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Sección: Gana Créditos */} 
          <section className="bg-white w-full max-w-6xl mx-auto rounded-xl shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">🎥 Gana Créditos viendo anuncios</h1>
            <p className="text-gray-600 mb-4">Ve anuncios y acumula créditos para participar por increíbles premios.</p>
            <button
              className="bg-blue-950 text-white py-2 px-4 rounded-md hover:bg-blue-900 transition"
              onClick={() => setShowAd(true)}
            >
              Empezar
            </button>

            {showAd && (
              <div className="mt-8">
                <AdCard ad={ads[0]} />
              </div>
            )}
          </section>

          {/* Carrusel de Rifas */}
          <section id="rifas" className="scroll-mt-[80px] mt-12">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              📆 Celulares en Rifa Hoy
            </h2>
            <Carousel phones={phones} />
          </section>

          {/* Cómo funciona */}
          <section id="comoganar" className="scroll-mt-[80px] bg-white w-full max-w-6xl mx-auto rounded-xl shadow-md p-8 mt-16">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              🤑 ¿Cómo puedes ganar en VerYGana?
            </h2>
            <ul className="list-disc list-inside text-gray-700 text-lg space-y-2 text-center sm:text-left">
              <li>✅ Crea una cuenta</li>
              <li>💳 Deposita dinero</li>
              <li>🎟️ Compra tu boleto favorito</li>
              <li>⏳ Espera el resultado de la lotería asociada</li>
              <li>🎉 Si tu número coincide: ¡Ganaste!</li>
            </ul>
          </section>

          {/* Tienda */}
          <section id="tienda" className="scroll-mt-[80px] mb-20">
            <h2 className="text-2xl font-bold text-gray-800 mt-5 mb-6">🛒 Tienda</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

