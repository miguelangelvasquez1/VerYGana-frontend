"use client";

import { useState } from "react";
import { createProductReview } from "@/services/ProductReviewService";

interface Props {
  purchaseItemId: number;
  onSuccess: () => void;
}

export default function CreateReviewForm({ purchaseItemId, onSuccess }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!comment.trim()) {
      setError("El comentario no puede estar vacío");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createProductReview({
        purchaseItemId,
        rating,
        comment,
      });

      onSuccess();
    } catch (e) {
      console.error(e);
      setError("No se pudo enviar la reseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Dejar una reseña
      </h1>

      {/* Rating */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">
          Calificación
        </label>

        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              onClick={() => setRating(value)}
              className={`text-2xl ${
                value <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">
          Comentario
        </label>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={1000}
          rows={5}
          className="w-full border rounded p-3 resize-none"
          placeholder="Cuéntanos tu experiencia con el producto..."
        />

        <div className="text-xs text-gray-400 text-right">
          {comment.length}/1000
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar reseña"}
      </button>
    </div>
  );
}
