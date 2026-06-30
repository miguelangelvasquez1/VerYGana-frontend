'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, KeyRound, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle size={48} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Enlace inválido</h1>
        <p className="text-sm text-gray-500">
          Enlace inválido. Por favor contacta al administrador.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-violet-600 hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">¡Cuenta activada!</h1>
        <p className="text-sm text-gray-500">
          Tu contraseña ha sido configurada exitosamente. Ya puedes iniciar sesión.
        </p>
        <Link
          href="/login"
          className="inline-block w-full px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  const validate = () => {
    const errs: { password?: string; confirm?: string } = {};
    if (password.length < 8) errs.password = 'La contraseña debe tener al menos 8 caracteres';
    if (password !== confirmPassword) errs.confirm = 'Las contraseñas no coinciden';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setSuccess(true);
        return;
      }

      let body: { message?: string } = {};
      try {
        body = await response.json();
      } catch {
        // non-JSON body
      }

      const message = body?.message ?? '';

      if (response.status === 401) {
        if (message.includes('already been used')) {
          setError('Este enlace ya fue utilizado. Si necesitas acceso, contacta al administrador.');
        } else if (message.includes('expired')) {
          setError('Este enlace ha expirado. Por favor solicita un nuevo enlace al administrador.');
        } else {
          setError('El enlace no es válido. Por favor contacta al administrador.');
        }
      } else if (response.status === 400) {
        setError(message || 'La contraseña no cumple los requisitos mínimos.');
      } else {
        setError('Error de conexión. Intenta de nuevo.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldCls = (hasError?: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10 ${
      hasError ? 'border-red-400' : 'border-gray-300'
    }`;

  return (
    <>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <KeyRound size={22} className="text-violet-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Activar mi cuenta</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crea tu contraseña para comenzar a usar la plataforma.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nueva contraseña <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
              }}
              placeholder="Mínimo 8 caracteres"
              className={fieldCls(fieldErrors.password)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar contraseña <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirm) setFieldErrors(prev => ({ ...prev, confirm: undefined }));
              }}
              placeholder="Repite tu contraseña"
              className={fieldCls(fieldErrors.confirm)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.confirm && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading && <Loader2 size={15} className="animate-spin" />}
          Activar mi cuenta
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        ¿Ya tienes contraseña?{' '}
        <Link href="/login" className="text-violet-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <Suspense fallback={
          <div className="flex justify-center py-8">
            <Loader2 size={32} className="animate-spin text-violet-500" />
          </div>
        }>
          <SetupPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
