import React from 'react';
import { CheckCircle } from 'lucide-react';
import { AdForAdminDTO } from '@/types/ads/commercial';

interface ApproveAdModalProps {
  ad: AdForAdminDTO;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ApproveAdModal: React.FC<ApproveAdModalProps> = ({
  ad,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Aprobar Anuncio</h3>
        </div>
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas aprobar el anuncio{' '}
          <span className="font-semibold text-gray-800">"{ad.title}"</span>?
          Esta acción habilitará el anuncio para ser activado en la plataforma.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {isSubmitting ? 'Aprobando...' : 'Aprobar'}
          </button>
        </div>
      </div>
    </div>
  );
};
