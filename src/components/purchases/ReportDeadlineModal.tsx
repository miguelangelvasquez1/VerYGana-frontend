"use client";

import { useEffect, useState } from "react";
import { Clock, ShieldAlert, X } from "lucide-react";
import { ConsumerPurchaseItemResponseDTO, PurchaseItemStatus } from "@/types/purchases/purchaseItem.types";
import { formatCountdown, getMsUntilReportDeadline } from "@/utils/reportDeadline";

interface Props {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  items: ConsumerPurchaseItemResponseDTO[];
}

const URGENT_THRESHOLD_MS = 60 * 60 * 1000; // Último tramo antes del corte: se resalta en rojo.

const ReportDeadlineModal = ({ open, onClose, onContinue, items }: Props) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  const timedItems = items.filter(
    (item): item is ConsumerPurchaseItemResponseDTO & { deliveredAt: string } =>
      item.status === PurchaseItemStatus.CLAIMED && !!item.deliveredAt
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Antes de reportar un problema</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 shrink-0 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Cada día procesamos automáticamente los pagos a los vendedores a las{" "}
          <span className="font-semibold text-gray-900">11:00 PM</span>. Por eso, un producto entregado
          solo puede reportarse{" "}
          <span className="font-semibold text-gray-900">desde el momento de la entrega hasta ese corte de las 11 PM</span>.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Si no reportas el problema dentro de ese rango de tiempo, el sistema asume que el producto fue entregado en
          perfectas condiciones y{" "}
          <span className="font-semibold text-gray-900">no será posible generar ningún reclamo</span>, ya que el pago
          al vendedor ya se habrá realizado.
        </p>

        {timedItems.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Tiempo restante para reportar cada producto
            </p>
            <div className="space-y-2">
              {timedItems.map((item) => {
                const msLeft = getMsUntilReportDeadline(item.deliveredAt, now);
                const urgent = msLeft <= URGENT_THRESHOLD_MS;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 flex-wrap border border-gray-100 bg-gray-50 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-9 h-9 object-cover rounded-lg shrink-0"
                      />
                      <p className="text-xs sm:text-sm text-gray-700 truncate">{item.productName}</p>
                    </div>
                    <span
                      className={`text-sm sm:text-base font-mono font-bold shrink-0 ${
                        urgent ? "text-red-600" : "text-[#03548C]"
                      }`}
                    >
                      {formatCountdown(msLeft)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-5">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onContinue}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-95 transition-all cursor-pointer"
          >
            Entendido, continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDeadlineModal;
