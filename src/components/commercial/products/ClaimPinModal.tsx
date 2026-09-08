'use client';

import React, { useState } from 'react';
import { X, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { claimPhysicalItem } from '@/services/PurchaseItemService';
import { CommercialPendingClaimResponseDTO } from '@/types/purchases/purchaseItem.types';

interface Props {
  item: CommercialPendingClaimResponseDTO;
  onClose: () => void;
  onClaimed: () => void;
}

export default function ClaimPinModal({ item, onClose, onClaimed }: Props) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setSubmitting(true);
    try {
      await claimPhysicalItem(item.id, { pin: pin.trim() });
      toast.success('Producto entregado correctamente');
      onClaimed();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'PIN incorrecto o expirado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={submitting ? undefined : onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#03548C]" />
            Entregar producto
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
          Ingresa el PIN que el comprador te muestra en tienda para confirmar la entrega de{' '}
          <span className="font-semibold text-gray-900">{item.productName}</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">PIN *</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              disabled={submitting}
              autoFocus
              inputMode="numeric"
              placeholder="Ej. 123456"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
            />
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
              disabled={!pin.trim() || submitting}
              className="px-4 py-2 rounded-lg text-white bg-[#03548C] hover:bg-[#024270] transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Confirmando...' : 'Confirmar entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
