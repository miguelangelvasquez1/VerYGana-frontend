'use client';

import React, { useEffect, useState } from 'react';
import { X, Pencil, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Role } from '@/types/User.types';
import {
  editBasicInfo,
  getConsumer,
  getAdmin,
  getCommercial,
  getGameDesigner,
  getComplianceOfficer,
} from '@/services/admin/AdminUserService';

interface Props {
  isOpen: boolean;
  role: Role;
  publicId: string;
  displayName: string;
  currentEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

const fetchPhoneByRole = async (role: Role, publicId: string): Promise<string> => {
  switch (role) {
    case Role.CONSUMER:
      return (await getConsumer(publicId)).phoneNumber;
    case Role.ADMIN:
      return (await getAdmin(publicId)).phoneNumber;
    case Role.COMMERCIAL:
      return (await getCommercial(publicId)).phoneNumber;
    case Role.GAME_DESIGNER:
      return (await getGameDesigner(publicId)).phoneNumber;
    case Role.COMPLIANCE_OFFICER:
      return (await getComplianceOfficer(publicId)).phoneNumber;
    default:
      return '';
  }
};

const EditUserModal: React.FC<Props> = ({ isOpen, role, publicId, displayName, currentEmail, onClose, onSuccess }) => {
  const [email, setEmail] = useState(currentEmail);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEmail(currentEmail);
    setPhoneNumber('');
    setError(null);
    setLoading(true);
    fetchPhoneByRole(role, publicId)
      .then((phone) => setPhoneNumber(phone || ''))
      .catch(() => setError('No se pudo cargar el teléfono actual'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, role, publicId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Ingresa un email válido');
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error('El teléfono es requerido');
      return;
    }
    setSubmitting(true);
    try {
      const response = await editBasicInfo(publicId, { email: email.trim(), phoneNumber: phoneNumber.trim() });
      toast.success(response?.message || 'Datos actualizados correctamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudieron actualizar los datos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Pencil className="text-admin-midnight" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Editar datos de {displayName}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-admin-blue" size={28} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
            {error && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue"
              />
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
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-admin-midnight rounded-lg hover:bg-admin-midnight/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditUserModal;
