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
  [key: string]: string; // Add index signature
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
    { label: "Nombre", name: "nombre", placeholder: "Ingresa tu nombre" },
    { label: "Apellidos", name: "apellidos", placeholder: "Ingresa tus apellidos" },
    { label: "Correo electrónico", name: "correo", type: "email", placeholder: "ejemplo@correo.com" },
    { label: "Número de teléfono", name: "telefono", type: "tel", placeholder: "Ej: +57 300 123 4567" },
    { label: "Contraseña", name: "contrasena", type: "password", placeholder: "Mínimo 8 caracteres" },
    { label: "Confirmar contraseña", name: "confirmarContrasena", type: "password", placeholder: "Repite tu contraseña" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-3 sm:space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {fields.map(({ label, name, type = "text", placeholder }) => (
            <div key={name} className={name === "correo" || name === "telefono" ? "sm:col-span-2" : ""}>
              <label 
                className="block text-sm font-semibold text-gray-700 mb-1" 
                htmlFor={name}
              >
                {label}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type={type}
                name={name}
                id={name}
                value={(formData)[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         transition-all duration-200 ease-in-out
                         hover:border-gray-400
                         text-gray-900 placeholder-gray-500
                         bg-white text-sm"
                required
                disabled={isLoading}
              />
            </div>
          ))}
        </div>

        <div className="pt-3 sm:pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 
                     hover:from-blue-700 hover:to-blue-800
                     disabled:from-gray-400 disabled:to-gray-500
                     text-white font-semibold py-2.5 px-6 rounded-lg
                     transition-all duration-200 ease-in-out
                     transform hover:scale-[1.02] active:scale-[0.98]
                     disabled:cursor-not-allowed disabled:transform-none
                     shadow-lg hover:shadow-xl
                     flex items-center justify-center gap-2
                     text-sm sm:text-base"
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
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <span>Crear cuenta</span>
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-xs sm:text-sm text-gray-600 pt-1">
          Al registrarte, aceptas nuestros{" "}
          <a href="/terminos" className="text-blue-600 hover:text-blue-700 underline">
            términos y condiciones
          </a>{" "}
          y{" "}
          <a href="/privacidad" className="text-blue-600 hover:text-blue-700 underline">
            política de privacidad
          </a>
        </div>
      </form>
    </div>
  );
}