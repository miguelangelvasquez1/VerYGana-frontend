"use client";

import NavBar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";
import PetGame from "@/components/PetGame";

export default function MascotaPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      {/* Layout principal de la mascota */}
      <section className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Tu Mascota Virtual
              </h1>
              <p className="text-sm text-gray-500">
                Cuida a tu mascota todos los días para mantenerla feliz y saludable.
              </p>
            </div>
            
            {/* Componente del juego */}
            <PetGame />
          </div>

      </section>

      <Footer />
    </div>
  );
}