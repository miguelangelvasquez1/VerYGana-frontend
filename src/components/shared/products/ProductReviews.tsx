import React from "react";
import { Star } from "lucide-react";
import { ProductReviewResponseDTO } from "@/types/products/ProductReview.types";

interface Props {
  reviews: ProductReviewResponseDTO[];
}

const ProductReviews: React.FC<Props> = ({ reviews }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #014C92, #1EA5BD)" }}
      >
        <span className="text-lg">⭐</span>
        <h2 className="text-lg font-bold text-white">Reseñas del producto</h2>
        {reviews.length > 0 && (
          <span className="ml-auto text-sm text-white/80 font-medium">
            {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-6">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-500 font-medium">
              Este producto aún no tiene reseñas.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              ¡Sé el primero en opinar!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border-l-4 rounded-xl bg-gray-50 hover:bg-blue-50/40 transition"
                style={{ borderLeftColor: "#014C92" }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800">
                    {review.consumerName}
                  </h3>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {review.comment}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
