'use client';

import React, { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendNotification, sendNotications } from '@/services/admin/AdminUserService';

interface Props {
  isOpen: boolean;
  publicIds: string[];
  recipientsLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_LENGTH = 500;

const NotifyUserModal: React.FC<Props> = ({ isOpen, publicIds, recipientsLabel, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setMessage('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isBulk = publicIds.length > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Escribe un mensaje para enviar');
      return;
    }
    setSubmitting(true);
    try {
      if (isBulk) {
        await sendNotications({ publicIds, message: message.trim() });
      } else {
        await sendNotification(publicIds[0], message.trim());
      }
      toast.success(isBulk ? `Notificación enviada a ${publicIds.length} usuarios` : 'Notificación enviada');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo enviar la notificación');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Send className="text-admin-blue" size={22} />
            <h2 className="text-lg font-semibold text-gray-900">Enviar notificación</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Para: <span className="font-medium text-gray-900">{recipientsLabel}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
              rows={4}
              placeholder="Escribe el mensaje que verá el usuario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${message.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                {message.length}/{MAX_LENGTH}
              </span>
            </div>
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-admin-blue rounded-lg hover:bg-admin-blue-dark transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotifyUserModal;
