import React, { useState } from 'react';
import { Heart, ShoppingCart, Star, Eye, Share2, Zap } from 'lucide-react';

export type ProductCardProps = {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    image: string;
    date: string;
    price: number;
    originalPrice: number;
    stock: number;
    isActive: boolean;
    rating: number;
    reviews: number;
    category: string;
    discount: number;
    isNew: boolean;
    isFeatured: boolean;
  };
  viewMode?: string;
  onProductClick?: (product: any) => void;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = "grid", onProductClick }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-300" />
        );
      }
    }
    return stars;
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group hover:scale-[1.01] transform cursor-pointer">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="relative w-full sm:w-48 md:w-64 h-48 sm:h-40 flex-shrink-0">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              </div>
            )}

            {imageError ? (
              <div className="w-full h-full bg-gray-100 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Eye className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm">Sin imagen</span>
                </div>
              </div>
            ) : (
              <img
                src={product.imageUrl}
                alt={product.name}
                className={`w-full h-full object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isNew && (
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  NUEVO
                </span>
              )}
              {product.discount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  -{product.discount}%
                </span>
              )}
              {product.isFeatured && (
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  TOP
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 group/heart"
            >
              <Heart
                className={`w-4 h-4 transition-all duration-200 ${isWishlisted
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600 group-hover/heart:text-red-500'
                  }`}
              />
            </button>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs sm:text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                <button className="text-gray-400 hover:text-blue-600 transition-colors duration-200">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                {product.name}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {renderStars(product.rating)}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews} reseñas)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-800">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${product.stock > 10
                      ? 'bg-green-100 text-green-700'
                      : product.stock > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                disabled={!product.isActive || product.stock === 0}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stock === 0 ? 'Sin stock' : 'Añadir al carrito'}
              </button>
              <button className="px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-200">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group hover:scale-[1.01] transform"
      onClick={() => onProductClick?.(product)}
    >

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          </div>
        )}

        {imageError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Eye className="w-12 h-12 mx-auto mb-2" />
              <span className="text-sm">Sin imagen</span>
            </div>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="bg-green-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
              NUEVO
            </span>
          )}
          {product.discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
              -{product.discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-yellow-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg flex items-center gap-0.5 sm:gap-1">
              <Zap className="w-2 h-2 sm:w-3 sm:h-3" />
              TOP
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="w-6 h-6 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200 group/heart"
          >
            <Heart
              className={`w-3 h-3 sm:w-4 sm:h-4 transition-all duration-200 ${isWishlisted
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-600 group-hover/heart:text-red-500'
                }`}
            />
          </button>
          <button className="w-6 h-6 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200  sm:flex">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 hover:text-blue-600" />
          </button>
          <button className="w-6 h-6 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200  sm:flex">
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 hover:text-blue-600" />
          </button>
        </div>

        {/* Stock Overlay */}
        {(!product.isActive || product.stock === 0) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full font-semibold text-xs sm:text-sm">
              {!product.isActive ? 'No disponible' : 'Sin stock'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3">
        {/* Category */}
        <span className="text-[10px] sm:text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
          {product.category}
        </span>

        {/* Title */}
        <h3 className="text-xs sm:text-sm font-bold text-gray-800 mt-1.5 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex items-center">
            {renderStars(product.rating)}
          </div>
          <span className="text-[10px] sm:text-xs text-gray-600">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-0.5 mb-2">
          <span className="text-sm sm:text-base font-bold text-gray-800">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-2">
          <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium ${product.stock > 10
              ? 'bg-green-100 text-green-700'
              : product.stock > 0
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
            {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-1 sm:gap-2">
          <button
            disabled={!product.isActive || product.stock === 0}
            className="flex-1 bg-blue-600 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1 text-xs sm:text-sm"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {product.stock === 0 ? 'Sin stock' : 'Añadir'}
            </span>
            <span className="sm:hidden">+</span>
          </button>
          <button className="px-2 sm:px-3 py-1.5 sm:py-2 border border-blue-600 sm:border-2 text-blue-600 rounded-md sm:rounded-lg hover:bg-blue-50 transition-colors duration-200">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;