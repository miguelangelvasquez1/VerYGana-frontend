'use client';

import React, { useState } from 'react';
import { X, Gamepad2 } from 'lucide-react';
import apiClient from '@/lib/api/client';
import toast from 'react-hot-toast';

interface GameDesignerForm {
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bio: string;
}

const emptyForm: GameDesignerForm = {
  name: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  bio: '',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterGameDesignerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState<GameDesignerForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<GameDesignerForm>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const e: Partial<GameDesignerForm> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.lastName.trim()) e.lastName = 'El apellido es requerido';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ingresa un email válido';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'El teléfono es requerido';
    if (form.bio && form.bio.length > 500)
      e.bio = 'La bio no puede superar los 500 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const response = await apiClient.post('/api/admin/game-designers', {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        bio: form.bio.trim() || undefined,
      });
      const backendMsg = typeof response.data === 'string' ? response.data : '';
      toast.success(backendMsg || `Se envió el enlace de activación a ${form.email.trim()}`);
      handleClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 409) {
        toast.error(msg || 'El email o teléfono ya está registrado');
      } else if (err?.response?.status === 400) {
        toast.error(msg || 'Datos inválidos, revisa el formulario');
      } else {
        toast.error(msg || 'Error al registrar el game designer');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setErrors({});
    onClose();
  };

  const handleField = (field: keyof GameDesignerForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-violet-600" size={22} />
            <h2 className="text-lg font-semibold text-gray-900">Registrar Game Designer</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleField('name', e.target.value)}
                placeholder="Juan"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  errors.name ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => handleField('lastName', e.target.value)}
                placeholder="Pérez"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  errors.lastName ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleField('email', e.target.value)}
              placeholder="juan.perez@verygana.com"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                errors.email ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={e => handleField('phoneNumber', e.target.value)}
              placeholder="3001234567"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                errors.phoneNumber ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.bio}
              onChange={e => handleField('bio', e.target.value)}
              rows={3}
              placeholder="Descripción breve del diseñador..."
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none ${
                errors.bio ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.bio ? <p className="text-xs text-red-500">{errors.bio}</p> : <span />}
              <span className={`text-xs ${form.bio.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {form.bio.length}/500
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registrando...' : 'Registrar Designer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterGameDesignerModal;
