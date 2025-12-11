import React, { useState } from "react";
import { Heart, ShoppingCart, Star, Eye, Share2 } from "lucide-react";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";

export type ProductCardProps = {
  product: ProductSummaryResponseDTO;
  viewMode?: string;
  onProductClick?: (product: ProductSummaryResponseDTO) => void;
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode = "grid",
  onProductClick,
}) => {

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-3 h-3 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-3 h-3 text-gray-300" />);
      }
    }

    return stars;
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group hover:scale-[1.01]"
      onClick={() => onProductClick?.(product)}
    >

      {/* IMAGE */}
      <div className="relative aspect-square overflow-hidden">

        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full" />
          </div>
        )}

        {imageError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Eye className="w-12 h-12 text-gray-400" />
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* QUICK ACTIONS */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </button>

          <button className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
            <Eye className="w-4 h-4 text-gray-600" />
          </button>

          <button className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-3">

        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-1">
          {product.name}
        </h3>

        {/* RATING */}
        <div className="flex items-center gap-1 mb-1">
          {renderStars(product.averageRate)}
          <span className="text-xs text-gray-600">
            {product.averageRate?.toFixed(1) ?? "0.0"}
          </span>
        </div>

        {/* PRICE */}
        <span className="text-base font-bold text-gray-800">
          {formatPrice(product.price)}
        </span>

        {/* STOCK */}
        <div className="mt-2">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              product.stock > 10
                ? "bg-green-100 text-green-700"
                : product.stock > 0
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {product.stock > 0 ? `Stock: ${product.stock}` : "Sin stock"}
          </span>
        </div>

        {/* CART BUTTON */}
        <button
          disabled={product.stock === 0}
          className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
        >
          <div className="flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? "Sin stock" : "Añadir"}
          </div>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
