"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getMyPqrsById } from "@/services/PqrsService";
import { PqrsResponseDTO } from "@/types/Pqrs.types";
import PqrsStatusBadge from "./PqrsStatusBadge";
import { formatPqrsDate, pqrsTypeLabel } from "./pqrsMeta";

interface Props {
  pqrsId: number;
  onClose: () => void;
}

const PqrsDetailModal = ({ pqrsId, onClose }: Props) => {
  const [pqrs, setPqrs] = useState<PqrsResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyPqrsById(pqrsId)
      .then((data) => {
        if (!cancelled) setPqrs(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el detalle de la solicitud");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pqrsId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-900">Detalle de la solicitud</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#03548C]" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && pqrs && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {pqrsTypeLabel[pqrs.type]} · #{pqrs.id}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-0.5">{pqrs.subject}</h3>
                </div>
                <PqrsStatusBadge status={pqrs.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <div>
                  <p className="text-gray-400">Creada</p>
                  <p className="text-gray-700 font-medium">{formatPqrsDate(pqrs.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Fecha límite</p>
                  <p className="text-gray-700 font-medium">{formatPqrsDate(pqrs.dueDate)}</p>
                </div>
                {pqrs.resolvedAt && (
                  <div>
                    <p className="text-gray-400">Resuelta</p>
                    <p className="text-gray-700 font-medium">{formatPqrsDate(pqrs.resolvedAt)}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{pqrs.description}</p>
              </div>

              {pqrs.response ? (
                <div className="p-3.5 bg-blue-50 border-l-4 border-[#03548C] rounded-r-lg">
                  <p className="text-xs font-semibold text-[#03548C] mb-1">Respuesta</p>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{pqrs.response}</p>
                </div>
              ) : (
                <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Tu solicitud aún no tiene respuesta. Te notificaremos cuando sea atendida.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PqrsDetailModal;
