'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth/authService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AlertCircle, Lock } from "lucide-react";
import toast from "react-hot-toast";

const UnlockAccountForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState(searchParams?.get('identifier') ?? '');
  const [code, setCode] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isUnlocking) return;

    setError(null);

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier || code.length !== 6) {
      setError('Ingresa tu correo/teléfono y el código de 6 dígitos.');
      return;
    }

    setIsUnlocking(true);
    try {
      const response = await authService.unlockAccount(trimmedIdentifier, code);
      toast.success(response.message || 'Cuenta desbloqueada. Ya puedes iniciar sesión.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'El código ingresado no es válido.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleResend = async () => {
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      setError('Ingresa tu correo o teléfono para reenviar el código.');
      return;
    }

    setIsResending(true);
    setError(null);
    try {
      const response = await authService.resendUnlockCode(trimmedIdentifier);
      toast.success(response.message || 'Si la cuenta existe, se envió un nuevo código.');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo reenviar el código. Intenta de nuevo.');
    } finally {
      setIsResending(false);
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
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Cuenta bloqueada</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Bloqueamos tu cuenta por múltiples intentos fallidos. Revisa tu correo y escribe el código de 6 dígitos para desbloquearla.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
              Correo electrónico o teléfono
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              placeholder="ej. usuario@correo.com o 3001234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm
                         focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]
                         transition-all duration-200 ease-in-out
                         hover:border-gray-400
                         text-gray-900 placeholder-gray-500
                         bg-white text-sm"
              disabled={isUnlocking}
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
              Código de 6 dígitos
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              placeholder="_ _ _ _ _ _"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm
                         focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]
                         transition-all duration-200 ease-in-out
                         hover:border-gray-400
                         text-gray-900 placeholder-gray-500
                         bg-white text-sm tracking-[0.3em] text-center font-mono"
              disabled={isUnlocking}
            />
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={isUnlocking}
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
              {isUnlocking ? <LoadingSpinner label="Desbloqueando..." /> : <span>Desbloquear</span>}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || isUnlocking}
              className="w-full text-[#03548C] hover:text-[#0b1440] font-semibold py-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-sm transition-colors cursor-pointer"
            >
              {isResending ? <LoadingSpinner label="Reenviando..." /> : <span>Reenviar código</span>}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            <a href="/login" className="text-[#03548C] hover:text-[#0b1440] font-semibold underline decoration-2 underline-offset-2">
              Volver a iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnlockAccountForm;
