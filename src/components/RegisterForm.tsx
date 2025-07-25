'use client'

import { useState, FormEvent } from "react";

interface FormData {
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccion: string;
  contrasena: string;
  confirmarContrasena: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellidos: "",
    correo: "",
    telefono: "",
    departamento: "",
    municipio: "",
    direccion: "",
    contrasena: "",
    confirmarContrasena: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Datos del formulario:", formData);
  };

  const fields = [
    { label: "Nombre", name: "nombre" },
    { label: "Apellidos", name: "apellidos" },
    { label: "Correo electrónico", name: "correo", type: "email" },
    { label: "Número de teléfono", name: "telefono", type: "tel" },
    { label: "Departamento", name: "departamento" },
    { label: "Municipio", name: "municipio" },
    { label: "Dirección", name: "direccion" },
    { label: "Contraseña", name: "contrasena", type: "password" },
    { label: "Confirmar contraseña", name: "confirmarContrasena", type: "password" },
  ];

  return (
    <div className="flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="p-6 w-full max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ label, name, type = "text" }) => (
            <div key={name}>
              <label className="block mb-1" htmlFor={name}>
                {label}
              </label>
              <input
                type={type}
                name={name}
                id={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                className="w-full p-2 rounded-md bg-gray-300 focus:outline-none"
                required
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="mt-6 w-full bg-blue-950 text-white py-2 rounded-md hover:bg-blue-900 transition"
        >
          Siguiente
        </button>
      </form>
    </div>
  );
}