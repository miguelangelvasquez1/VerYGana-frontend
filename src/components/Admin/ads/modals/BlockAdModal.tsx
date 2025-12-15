import React from 'react';
import { AdForAdminDTO } from '@/types/ads/advertiser';

interface BlockAdModalProps {
  ad: AdForAdminDTO;
  reason: string;
  isSubmitting: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BlockAdModal: React.FC<BlockAdModalProps> = ({
  ad,
  reason,
  isSubmitting,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Bloquear Anuncio
        </h3>
        <p className="text-gray-600 mb-4">
          Proporciona una razón clara para bloquear "{ad.title}"
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          rows={4}
          placeholder="Ej: Violación de términos..."
          required
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim() || isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Bloqueando...' : 'Bloquear'}
          </button>
        </div>
      </div>
    </div>
  );
};
