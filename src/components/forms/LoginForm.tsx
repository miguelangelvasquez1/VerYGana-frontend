'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/authService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Conservamos state solo para mostrar valores en inputs; el submit
  // leerá directamente del formulario para evitar problemas con autofill.
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Evitar re-envíos
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      // Leer valores directamente del form para asegurar el valor real (incluye autofill)
      const identifier = formData.identifier.trim();
    const password = formData.password.trim();

      // Validación cliente rápida
      if (!identifier || !password) {
        setError('Por favor completa todos los campos');
        setIsLoading(false);
        return;
      }

      // Paso 1: Llamada al servicio
      const loginResponse = await authService.login(identifier, password);

      // Paso 2: Sincronizar con NextAuth
      const result = await signIn('credentials-sync', {
        redirect: false,
        accessToken: loginResponse.accessToken,
        identifier: identifier,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      console.log('✅ NextAuth session synchronized');

      router.push('/raffles');
      // router.refresh();

    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 border border-gray-100">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Inicia sesión en tu cuenta de Ver y Gana
          </p>
        </div>

        {/* IMPORTANT: agregamos name y autoComplete */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
              Correo electrónico o teléfono
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              required
              autoComplete="username" // ayuda al browser
              placeholder="ej. usuario@correo.com o 3001234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         transition-all duration-200 ease-in-out
                         hover:border-gray-400
                         text-gray-900 placeholder-gray-500
                         bg-white text-sm"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Contraseña
                <span className="text-red-500 ml-1">*</span>
              </label>
              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="current-password"
              placeholder="Ingrese su contraseña"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         transition-all duration-200 ease-in-out
                         hover:border-gray-400
                         text-gray-900 placeholder-gray-500
                         bg-white text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 
                         hover:from-blue-700 hover:to-blue-800
                         disabled:from-gray-400 disabled:to-gray-500
                         text-white font-semibold py-3 px-6 rounded-lg
                         transition-all duration-200 ease-in-out
                         transform hover:scale-[1.02] active:scale-[0.98]
                         disabled:cursor-not-allowed disabled:transform-none
                         shadow-lg hover:shadow-xl
                         flex items-center justify-center gap-2
                         text-sm sm:text-base"
            >
              {isLoading ? <LoadingSpinner label="Procesando..." /> : <span>Iniciar Sesión</span>}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ¿No tienes una cuenta?{" "}
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-2">
              Regístrate aquí
            </a>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <a href="/terminos" className="hover:text-gray-700 underline">Términos</a>
            <span>•</span>
            <a href="/privacidad" className="hover:text-gray-700 underline">Privacidad</a>
            <span>•</span>
            <a href="/ayuda" className="hover:text-gray-700 underline">Ayuda</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
