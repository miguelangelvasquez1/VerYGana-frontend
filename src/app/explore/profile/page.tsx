'use client';

import Footer from "@/components/Footer";
import Navbar from "@/components/NavBar";
import { useState } from "react";

export default function Profile() {
  const [formData, setFormData] = useState({
    nombre: "Juan",
    email: "juan@example.com",
    telefono: "+1 (555) 123-4567",
    direccion: "Calle Ficticia 123, Ciudad",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Datos actualizados: ${JSON.stringify(formData)}`);
    // Aquí iría la lógica para guardar los datos en el backend
  };

  return (
    <div className="flex flex-col min-h-screen">
    <Navbar/>
    <div className="bg-gradient-to-b from-[#E6F2FF] to-[#F4F8FB] p-14">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-[#014C92] mb-6">Editar Perfil</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-[#014C92] focus:border-[#014C92]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-[#014C92] focus:border-[#014C92]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-[#014C92] focus:border-[#014C92]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-[#014C92] focus:border-[#014C92]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#004B8D] text-white p-2 rounded-md hover:bg-[#013d70] transition duration-200"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
    <Footer/>
    </div>
  );
}