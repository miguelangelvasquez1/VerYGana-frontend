'use client';

import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { resendOtp, verifyOtp } from '@/services/commercial/PayoutMethodService';
import { PayoutMethodResponseDTO } from '@/types/PayoutMethod.types';

interface Props {
  method: PayoutMethodResponseDTO;
  onClose: () => void;
  onVerified: () => void;
}

export function VerifyOtpModal({ method, onClose, onVerified }: Props) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      await verifyOtp(method.id, { code: code.trim() });
      toast.success('Método de pago verificado correctamente');
      onVerified();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Código incorrecto o expirado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(method.id);
      toast.success('Código reenviado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al reenviar el código');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={submitting ? undefined : onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#03548C]" />
            Verificar código OTP
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Ingresa el código que enviamos al número asociado a{' '}
          <span className="font-semibold text-gray-900">{method.alias}</span>
          {method.phoneNumber ? ` (${method.phoneNumber})` : ''}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Código OTP *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={submitting}
              autoFocus
              inputMode="numeric"
              placeholder="Ej. 123456"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || submitting}
              className="text-sm text-[#03548C] hover:underline disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!code.trim() || submitting}
              className="px-4 py-2 rounded-lg text-white bg-[#03548C] hover:bg-[#024270] transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
