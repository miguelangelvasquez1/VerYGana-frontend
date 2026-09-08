'use client';

import React, { useEffect, useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmCertificateUpload, create, getBanks, prepareCertificateUpload } from '@/services/commercial/PayoutMethodService';
import { fileUploadService } from '@/services/FileUploadService';
import {
  BankAccountType,
  CreatePayoutMethodRequestDTO,
  DocType,
  PayoutBankResponseDTO,
  PayoutMethodType,
} from '@/types/PayoutMethod.types';
import { bankAccountTypeLabel, docTypeLabel, payoutMethodTypeLabel } from '@/utils/bankDetailsMeta';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ACCEPTED_CERTIFICATE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] as const;
const MAX_CERTIFICATE_BYTES = 10 * 1024 * 1024;
const CERTIFICATE_ACCEPT_ATTR = ACCEPTED_CERTIFICATE_TYPES.join(',');

function validateCertificate(file: File): string | null {
  if (!ACCEPTED_CERTIFICATE_TYPES.includes(file.type as (typeof ACCEPTED_CERTIFICATE_TYPES)[number])) {
    return 'Formato no admitido. Sube una imagen (PNG, JPEG, WEBP) o un PDF.';
  }
  if (file.size > MAX_CERTIFICATE_BYTES) {
    return 'El archivo pesa más de 10 MB.';
  }
  return null;
}

const initialForm: CreatePayoutMethodRequestDTO = {
  type: PayoutMethodType.BANK_ACCOUNT,
  alias: '',
  bankCode: '',
  accountNumber: '',
  bankAccountType: BankAccountType.SAVINGS,
  phoneNumber: '',
  accountHolderName: '',
  accountHolderDocType: DocType.CC,
  accountHolderDoc: '',
};

export function CreatePayoutMethodModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreatePayoutMethodRequestDTO>(initialForm);
  const [banks, setBanks] = useState<PayoutBankResponseDTO[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateError, setCertificateError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<'idle' | 'creating' | 'uploading-certificate'>('idle');

  const isBankAccount = form.type === PayoutMethodType.BANK_ACCOUNT;

  useEffect(() => {
    if (!isBankAccount || banks.length > 0) return;
    setBanksLoading(true);
    setBanksError(false);
    getBanks()
      .then(setBanks)
      .catch(() => setBanksError(true))
      .finally(() => setBanksLoading(false));
  }, [isBankAccount, banks.length]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setCertificateFile(null);
      setCertificateError('');
      return;
    }
    const invalid = validateCertificate(file);
    if (invalid) {
      setCertificateFile(null);
      setCertificateError(invalid);
      return;
    }
    setCertificateFile(file);
    setCertificateError('');
  };

  const isValid =
    form.alias.trim() &&
    form.accountHolderName.trim() &&
    form.accountHolderDoc.trim() &&
    (isBankAccount
      ? form.bankCode.trim() && form.accountNumber.trim() && !!certificateFile
      : form.phoneNumber.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setSubmitStage('creating');
    try {
      const created = await create(form);

      if (isBankAccount && certificateFile) {
        setSubmitStage('uploading-certificate');
        try {
          const permission = await prepareCertificateUpload(created.id, {
            originalFileName: certificateFile.name,
            contentType: certificateFile.type,
            sizeBytes: certificateFile.size,
          });
          await fileUploadService.uploadToR2(permission.imagePermission.uploadUrl, certificateFile);
          await confirmCertificateUpload(created.id, { certificateAssetId: permission.assetId });
        } catch {
          toast.error('El método de pago se creó, pero no se pudo subir la certificación bancaria. Inténtalo de nuevo desde el detalle del método.');
          onCreated();
          return;
        }
      }

      toast.success('Método de pago creado correctamente');
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear el método de pago');
    } finally {
      setSubmitting(false);
      setSubmitStage('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={submitting ? undefined : onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nuevo método de pago</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de método *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
            >
              {Object.values(PayoutMethodType).map((t) => (
                <option key={t} value={t}>{payoutMethodTypeLabel[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alias *</label>
            <input
              name="alias"
              value={form.alias}
              onChange={handleChange}
              required
              disabled={submitting}
              placeholder="Ej. Mi cuenta principal"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
            />
          </div>

          {isBankAccount ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Banco *</label>
                <select
                  name="bankCode"
                  value={form.bankCode}
                  onChange={handleChange}
                  disabled={submitting || banksLoading}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                >
                  <option value="">
                    {banksLoading ? 'Cargando bancos...' : 'Selecciona un banco'}
                  </option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {banksError && (
                  <p className="mt-1 text-xs text-red-500">
                    Error al cargar bancos.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setBanksError(false);
                        setBanksLoading(true);
                        getBanks().then(setBanks).catch(() => setBanksError(true)).finally(() => setBanksLoading(false));
                      }}
                      className="underline cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de cuenta *</label>
                <select
                  name="bankAccountType"
                  value={form.bankAccountType}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                >
                  {Object.values(BankAccountType).map((t) => (
                    <option key={t} value={t}>{bankAccountTypeLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">N.º de cuenta *</label>
                <input
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Certificación bancaria *</label>
                <label className="flex items-center gap-2 w-full border border-dashed border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {certificateFile ? certificateFile.name : 'Sube una imagen o PDF de la certificación bancaria'}
                  </span>
                  <input
                    type="file"
                    accept={CERTIFICATE_ACCEPT_ATTR}
                    onChange={handleCertificateChange}
                    disabled={submitting}
                    className="hidden"
                  />
                </label>
                {certificateFile && !certificateError && (
                  <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {(certificateFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
                {certificateError && (
                  <p className="mt-1 text-xs text-red-500">{certificateError}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">Formatos admitidos: PNG, JPEG, WEBP o PDF. Máximo 10 MB.</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Número de celular *</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="Ej. 3001234567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del titular *</label>
              <input
                name="accountHolderName"
                value={form.accountHolderName}
                onChange={handleChange}
                required
                disabled={submitting}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo doc. *</label>
                <select
                  name="accountHolderDocType"
                  value={form.accountHolderDocType}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                >
                  {Object.values(DocType).map((t) => (
                    <option key={t} value={t}>{docTypeLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Documento *</label>
                <input
                  name="accountHolderDoc"
                  value={form.accountHolderDoc}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                />
              </div>
            </div>
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
              disabled={!isValid || submitting}
              className="px-4 py-2 rounded-lg text-white bg-[#03548C] hover:bg-[#024270] transition disabled:opacity-50 cursor-pointer"
            >
              {submitStage === 'uploading-certificate'
                ? 'Subiendo certificación...'
                : submitting
                ? 'Creando...'
                : 'Crear método de pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
