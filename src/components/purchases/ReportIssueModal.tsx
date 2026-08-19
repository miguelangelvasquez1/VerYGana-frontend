"use client";

import { useState } from "react";
import { ConsumerPurchaseItemResponseDTO, PurchaseItemStatus } from "@/types/purchases/purchaseItem.types";
import { MarketPlaceIssueReason } from "@/types/Pqrs.types";
import { reportIssue } from "@/services/PurchaseItemService";
import { marketPlaceIssueReasonLabel } from "@/components/pqrs/pqrsMeta";
import PqrsEvidenceUploader from "@/components/pqrs/PqrsEvidenceUploader";
import { usePqrsEvidenceUpload } from "@/hooks/pqrs/usePqrsEvidenceUpload";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  items: ConsumerPurchaseItemResponseDTO[];
}

// Un item ya resuelto (reembolsado o cancelado) ya no puede reportarse: el
// inconveniente ya fue atendido por esa vía. Uno en IN_REVIEW tampoco: ya
// tiene un reporte abierto y hay que esperar la retroalimentación del admin
// antes de dejar reportar otro.
export const canReportPurchaseItem = (item: ConsumerPurchaseItemResponseDTO) =>
  item.status !== PurchaseItemStatus.REFUNDED &&
  item.status !== PurchaseItemStatus.CANCELLED &&
  item.status !== PurchaseItemStatus.IN_REVIEW;

export default function ReportIssueModal({ open, onClose, items }: Props) {
  const [selected, setSelected] = useState<ConsumerPurchaseItemResponseDTO | null>(null);
  const [reason, setReason] = useState<MarketPlaceIssueReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState<Set<number>>(new Set());
  const evidence = usePqrsEvidenceUpload();

  if (!open) return null;

  const handleClose = () => {
    setSelected(null);
    setReason("");
    setDescription("");
    evidence.clear();
    onClose();
  };

  const handleBack = () => {
    setSelected(null);
    setReason("");
    setDescription("");
    evidence.clear();
  };

  const handleSubmit = async () => {
    if (!selected || !reason || !description.trim() || evidence.busy) return;
    setSubmitting(true);
    try {
      await reportIssue(selected.id, {
        reason,
        description: description.trim(),
        assetIds: evidence.assetIds,
      });
      toast.success("Hemos recibido tu reporte. Un administrador lo revisará pronto.");
      setReported((prev) => new Set(prev).add(selected.id));
      handleBack();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al enviar el reporte");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingItems = items.filter((i) => canReportPurchaseItem(i) && !reported.has(i.id));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {selected && (
              <button onClick={handleBack} className="text-gray-400 hover:text-gray-700 text-lg leading-none cursor-pointer">
                ←
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {selected ? selected.productName : "Reportar un problema"}
            </h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none cursor-pointer">
            ✕
          </button>
        </div>

        {/* Lista de productos */}
        {!selected && (
          <>
            {pendingItems.length === 0 && (
              <p className="text-gray-500 text-sm">
                No hay productos disponibles para reportar en esta compra.
              </p>
            )}
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center justify-between border rounded-xl p-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                    <p className="text-sm font-medium">{item.productName}</p>
                  </div>
                  <span className="text-gray-400 text-lg">›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Formulario de reporte */}
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={selected.imageUrl}
                alt={selected.productName}
                className="w-14 h-14 object-cover rounded-lg"
              />
              <p className="text-sm text-gray-500">¿Qué problema tuviste con este producto?</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Motivo *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as MarketPlaceIssueReason)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="">Selecciona un motivo</option>
                {Object.values(MarketPlaceIssueReason).map((r) => (
                  <option key={r} value={r}>
                    {marketPlaceIssueReasonLabel[r]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cuéntanos qué sucedió con más detalle"
                rows={3}
                className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <PqrsEvidenceUploader evidence={evidence} />

            <p className="text-xs text-gray-400">
              Al enviar este reporte se creará una solicitud PQRS que será revisada por un administrador.
            </p>

            <button
              onClick={handleSubmit}
              disabled={!reason || !description.trim() || submitting || evidence.busy}
              className="w-full bg-gray-900 text-white rounded-full py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {submitting ? "Enviando..." : "Enviar reporte"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
