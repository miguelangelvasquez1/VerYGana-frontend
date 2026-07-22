'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  authService,
  AccountPendingReviewError,
  AccountLockedError,
  EmailVerificationPendingError,
  KycReviewPendingError,
  PasswordSetupRequiredError,
} from "@/lib/auth/authService";
import { getCommercialInitialDataWithToken } from "@/services/commercialService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    const identifier = formData.identifier.trim();

    try {
      const password = formData.password.trim();

      if (!identifier || !password) {
        setError('Por favor completa todos los campos');
        setIsLoading(false);
        return;
      }

      const loginResponse = await authService.login(identifier, password);

      const result = await signIn('credentials-sync', {
        redirect: false,
        accessToken: loginResponse.accessToken,
        identifier: identifier,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      const role = loginResponse.role;

      if (role === "ROLE_ADMIN") {
        router.push("/admin");
      } else if (role === "ROLE_CONSUMER") {
        router.push("/home");
      } else if (role === "ROLE_COMMERCIAL") {
        try {
          const initialData = await getCommercialInitialDataWithToken(loginResponse.accessToken);
          if (initialData.onboardingStatus === "COMPLETED") {
            router.push("/commercial");
          } else {
            router.push("/commercial-onboarding");
          }
        } catch {
          // Si falla la consulta, dejamos que /commercial decida — ese panel
          // también verifica el estado del onboarding y redirige si hace falta.
          router.push("/commercial");
        }
      } else if (role === "ROLE_GAME_DESIGNER") {
        router.push("/game-designer");
      } else if (role === "ROLE_COMPLIANCE_OFFICER") {
        router.push("/compliance");
      }

    } catch (err: any) {
      if (err instanceof AccountLockedError) {
        router.push(`/unlock-account?identifier=${encodeURIComponent(err.identifier)}`);
        return;
      } else if (err instanceof EmailVerificationPendingError) {
        router.push(`/verify?email=${encodeURIComponent(identifier)}`);
        return;
      } else if (err instanceof KycReviewPendingError) {
        setError(err.message);
      } else if (err instanceof PasswordSetupRequiredError) {
        setError(err.message);
      } else if (err instanceof AccountPendingReviewError) {
        setError('Tu cuenta está en revisión por el equipo de cumplimiento. Te notificaremos cuando sea aprobada.');
      } else if (err.message?.toLowerCase().includes('invalid credentials')) {
        setError('Correo/teléfono o contraseña incorrectos.');
        setFormData((f) => ({ ...f, password: '' }));
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/60 p-8 sm:p-10 border border-gray-100">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-linear-to-br from-[#0b1440] to-[#03548C] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Inicia sesión en tu cuenta de Ver y Gana
          </p>
        </div>

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
              autoComplete="username"
              placeholder="ej. usuario@correo.com o 3001234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm
                         focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]
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
              <a href="/forgot-password" className="text-sm text-[#03548C] hover:text-[#0b1440] underline decoration-2 underline-offset-2">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="current-password"
                placeholder="Ingrese su contraseña"
                className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg shadow-sm
                           focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]
                           transition-all duration-200 ease-in-out
                           hover:border-gray-400
                           text-gray-900 placeholder-gray-500
                           bg-white text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-[#b8860b] via-[#FFD700] to-[#c9a227]
                         hover:brightness-110
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-gray-900 font-bold py-3 px-6 rounded-xl
                         transition-all duration-200 ease-in-out
                         transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none
                         shadow-md shadow-yellow-200/60
                         flex items-center justify-center gap-2
                         text-sm sm:text-base cursor-pointer"
            >
              {isLoading ? <LoadingSpinner label="Procesando..." /> : <span>Iniciar Sesión</span>}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ¿No tienes una cuenta?{" "}
            <a href="/register" className="text-[#03548C] hover:text-[#0b1440] font-semibold underline decoration-2 underline-offset-2">
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
