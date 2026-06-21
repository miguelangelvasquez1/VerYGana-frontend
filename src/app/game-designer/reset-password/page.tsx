'use client';

import React, { useState } from 'react';
import { Loader2, KeyRound, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetDesignerPassword } from '@/services/GameDesignerService';

export default function DesignerResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [designerCode, setDesignerCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const fieldCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !designerCode.trim() || !newPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      await resetDesignerPassword(email.trim(), designerCode.trim(), newPassword);
      setDone(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email o código de diseñador incorrecto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        {done ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Contraseña actualizada</h1>
            <p className="text-sm text-gray-500">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <a
              href="/login"
              className="block w-full text-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              Ir al inicio de sesión
            </a>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound size={22} className="text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Establecer contraseña</h1>
              <p className="text-sm text-gray-500 mt-1">
                Ingresa tu email y el código que te entregó el administrador.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={fieldCls}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de diseñador
                </label>
                <input
                  type="text"
                  value={designerCode}
                  onChange={e => setDesignerCode(e.target.value)}
                  placeholder="GD-XXXXXXXX"
                  className={`${fieldCls} font-mono`}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-400 mt-1">
                  El código que te entregó el administrador al registrarte.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={fieldCls}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Establecer contraseña
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              ¿Ya tienes contraseña?{' '}
              <a href="/login" className="text-violet-600 hover:underline">
                Inicia sesión
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
