"use client";

import { useEffect, useState } from "react";
import { ReviewableProductResponseDTO } from "@/types/productReview.types";
import { getPendingReviews } from "@/services/ProductReviewService";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
  purchaseId: number;
}

export default function LeaveReviewModal({ open, onClose, purchaseId }: Props) {
  const [items, setItems] = useState<ReviewableProductResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getPendingReviews(purchaseId);
        setItems(data);
      } catch (e) {
        console.error("Error cargando productos a reseñar", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, purchaseId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow p-6">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Dejar una reseña</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {loading && <p>Cargando...</p>}

        {!loading && items.length === 0 && (
          <p className="text-gray-500 text-sm">
            Ya has dejado reseña a todos los productos de esta compra.
          </p>
        )}

        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.productId}
              className="flex items-center justify-between border rounded p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.productImageUrl}
                  alt={item.productName}
                  className="w-14 h-14 object-cover rounded"
                />
                <p className="text-sm font-medium">{item.productName}</p>
              </div>

              <button
                onClick={() =>
                  router.push(`/reviews/create?purchaseItemId=${item.purchaseItemId}`)
                }
                className="text-gray-500 hover:text-black text-xl"
              >
                ➜
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
