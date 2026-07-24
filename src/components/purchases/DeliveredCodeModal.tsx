"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle, Loader2, X } from "lucide-react";
import { ConsumerPurchaseItemResponseDTO } from "@/types/purchases/purchaseItem.types";
import { getDeliveredCode } from "@/services/PurchaseItemService";

interface Props {
  item: ConsumerPurchaseItemResponseDTO;
  onClose: () => void;
}

const DeliveredCodeModal = ({ item, onClose }: Props) => {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    getDeliveredCode(item.id)
      .then((res) => {
        if (active) setCode(res);
      })
      .catch(() => {
        if (active) setError("No fue posible obtener el código. Inténtalo de nuevo.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item.id]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Código entregado</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="w-14 h-14 object-cover rounded-lg"
          />
          <p className="text-sm font-medium text-gray-700">{item.productName}</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Obteniendo código...</p>
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500 text-center py-4">{error}</p>
        )}

        {!loading && !error && code && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <span className="text-lg font-bold text-[#03548C] tracking-widest font-mono break-all">
                {code}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "¡Código copiado!" : "Copiar código"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveredCodeModal;
