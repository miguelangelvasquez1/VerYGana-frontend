'use client'

import { useState } from "react";
import { registerUser } from "@/services/UserService";
import toast from "react-hot-toast";

interface FormData {
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string;
  contrasena: string;
  confirmarContrasena: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellidos: "",
    correo: "",
    telefono: "",
    contrasena: "",
    confirmarContrasena: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.apellidos.trim() || !formData.correo.trim() || !formData.contrasena.trim() || !formData.confirmarContrasena.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    if (formData.contrasena !== formData.confirmarContrasena) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      const mappedData = {
        name: formData.nombre,
        lastNames: formData.apellidos,
        email: formData.correo,
        phoneNumber: formData.telefono,
        password: formData.contrasena,
      };
      const response = await registerUser(mappedData);
      console.log('user registered', response);
      toast.success("Registro exitoso 🎉");
      setFormData({
        nombre: "",
        apellidos: "",
        correo: "",
        telefono: "",
        contrasena: "",
        confirmarContrasena: "",
      });
    } catch (error) {
      console.error('Error registering user:', error);
      toast.error("Hubo un error al registrar 😓, inténtalo nuevamente")
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    { label: "Nombre", name: "nombre" },
    { label: "Apellidos", name: "apellidos" },
    { label: "Correo electrónico", name: "correo", type: "email" },
    { label: "Número de teléfono", name: "telefono", type: "tel" },
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
          disabled={isLoading}
          className="mt-6 w-full bg-blue-950 text-white py-2 rounded-md hover:bg-blue-900 transition"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Procesando...
            </>
          ) : (
            "Siguiente"
          )}
        </button>
      </form>
    </div>
  );
}