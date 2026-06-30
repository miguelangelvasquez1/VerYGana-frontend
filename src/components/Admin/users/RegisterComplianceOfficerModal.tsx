'use client';

import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/api/client';
import toast from 'react-hot-toast';

interface ComplianceOfficerForm {
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

const emptyForm: ComplianceOfficerForm = {
  name: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterComplianceOfficerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState<ComplianceOfficerForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<ComplianceOfficerForm>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const e: Partial<ComplianceOfficerForm> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.lastName.trim()) e.lastName = 'El apellido es requerido';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ingresa un email válido';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'El teléfono es requerido';
    if (!form.password || form.password.length < 6)
      e.password = 'La contraseña debe tener al menos 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiClient.post('/auth/register/compliance-officer', {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });
      toast.success('Oficial de cumplimiento registrado exitosamente');
      handleClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 409) {
        toast.error(msg || 'El email o teléfono ya está registrado');
      } else if (err?.response?.status === 400) {
        toast.error(msg || 'Datos inválidos, revisa el formulario');
      } else {
        toast.error(msg || 'Error al registrar el oficial de cumplimiento');
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

  const handleField = (field: keyof ComplianceOfficerForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? 'border-red-400' : 'border-gray-300'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={22} />
            <h2 className="text-lg font-semibold text-gray-900">Registrar Oficial de Cumplimiento</h2>
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
                className={inputCls(!!errors.name)}
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
                className={inputCls(!!errors.lastName)}
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
              placeholder="oficial@verygana.com"
              className={inputCls(!!errors.email)}
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
              className={inputCls(!!errors.phoneNumber)}
            />
            {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => handleField('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={inputCls(!!errors.password)}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registrando...' : 'Registrar Oficial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterComplianceOfficerModal;
