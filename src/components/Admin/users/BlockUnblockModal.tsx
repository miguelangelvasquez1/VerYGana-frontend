'use client';

import React, { useEffect, useState } from 'react';
import { X, Ban, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { blockUser, unblockUser } from '@/services/admin/AdminUserService';

interface Props {
  isOpen: boolean;
  action: 'block' | 'unblock';
  displayName: string;
  publicId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const BlockUnblockModal: React.FC<Props> = ({ isOpen, action, displayName, publicId, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isBlock = action === 'block';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      toast.error('Escribe un motivo de al menos 5 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      if (isBlock) {
        await blockUser(publicId, reason.trim());
        toast.success(`${displayName} fue bloqueado`);
      } else {
        await unblockUser(publicId, reason.trim());
        toast.success(`${displayName} fue reactivado`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo completar la acción');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            {isBlock ? (
              <Ban className="text-red-600" size={22} />
            ) : (
              <Unlock className="text-green-600" size={22} />
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {isBlock ? 'Bloquear usuario' : 'Reactivar usuario'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {isBlock
              ? <>Vas a bloquear a <span className="font-medium text-gray-900">{displayName}</span>. No podrá iniciar sesión hasta que sea reactivado.</>
              : <>Vas a reactivar a <span className="font-medium text-gray-900">{displayName}</span>. Recuperará el acceso a su cuenta.</>}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={isBlock ? 'Ej: incumplimiento de términos de uso' : 'Ej: caso resuelto en revisión manual'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Este motivo queda registrado en la auditoría del usuario.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isBlock ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {submitting ? 'Procesando...' : isBlock ? 'Bloquear' : 'Reactivar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlockUnblockModal;
