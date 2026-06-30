"use client";

import { useState } from "react";
import { ConsumerPurchaseItemResponseDTO } from "@/types/purchases/purchaseItem.types";
import { createProductReview } from "@/services/ProductReviewService";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  items: ConsumerPurchaseItemResponseDTO[];
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${star <= value ? "text-yellow-400" : "text-gray-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function LeaveReviewModal({ open, onClose, items }: Props) {
  const reviewable = items.filter((i) => i.canBeReviewed);

  const [selected, setSelected] = useState<ConsumerPurchaseItemResponseDTO | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  if (!open) return null;

  const handleClose = () => {
    setSelected(null);
    setRating(0);
    setComment("");
    onClose();
  };

  const handleBack = () => {
    setSelected(null);
    setRating(0);
    setComment("");
  };

  const handleSubmit = async () => {
    if (!selected || rating === 0) return;
    setSubmitting(true);
    try {
      await createProductReview({
        purchaseItemId: selected.id,
        rating,
        comment,
      });
      setReviewed((prev) => new Set(prev).add(selected.id));
      handleBack();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al enviar la reseña");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingItems = reviewable.filter((i) => !reviewed.has(i.id));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {selected && (
              <button onClick={handleBack} className="text-gray-400 hover:text-gray-700 text-lg leading-none">
                ←
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {selected ? selected.productName : "Dejar una reseña"}
            </h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">
            ✕
          </button>
        </div>

        {/* Lista de productos */}
        {!selected && (
          <>
            {pendingItems.length === 0 && (
              <p className="text-gray-500 text-sm">
                Ya has dejado reseña a todos los productos de esta compra.
              </p>
            )}
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center justify-between border rounded-xl p-3 hover:bg-gray-50 transition-colors text-left"
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

        {/* Formulario de reseña */}
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={selected.imageUrl}
                alt={selected.productName}
                className="w-14 h-14 object-cover rounded-lg"
              />
              <p className="text-sm text-gray-500">¿Cómo calificarías este producto?</p>
            </div>

            <StarRating value={rating} onChange={setRating} />

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe tu reseña (opcional)"
              rows={3}
              className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
            />

            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="w-full bg-gray-900 text-white rounded-full py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Enviando..." : "Enviar reseña"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
