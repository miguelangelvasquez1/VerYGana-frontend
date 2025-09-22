import React, { useState } from 'react';
import { X, ShoppingCart, CreditCard, Heart, Star, Minus, Plus, Share2, Truck, Shield, RotateCcw } from 'lucide-react';

interface ProductModalProps {
  product: {
    id: string;
    name: string;
    imageUrl: string;
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
    description?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);

  // Imágenes de ejemplo adicionales (en tu caso real, vendrían del producto)
  const productImages = [
    product.imageUrl,
    product.imageUrl, // En tu caso real, tendrías diferentes URLs
    product.imageUrl,
  ];

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
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-4 h-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden" style={{width: '50%'}}>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  const handleQuantityChange = (increment: boolean) => {
    if (increment && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else if (!increment && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    console.log(`Añadiendo ${quantity} unidades del producto ${product.id} al carrito`);
  };

  const handleBuyNow = () => {
    console.log(`Comprando ${quantity} unidades del producto ${product.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Vista Previa del Producto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    NUEVO
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    -{product.discount}%
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    DESTACADO
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-3 overflow-x-auto">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === image ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {product.category}
            </span>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(product.rating)}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviews} reseñas)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-800">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm">
              <p className="text-gray-700 leading-relaxed">
                {product.description || `Descubre este increíble ${product.name.toLowerCase()} de alta calidad. Perfecto para uso diario, combina funcionalidad y estilo en un diseño moderno. Fabricado con materiales premium que garantizan durabilidad y comodidad excepcional.`}
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                product.stock > 10
                  ? 'bg-green-100 text-green-800'
                  : product.stock > 0
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
              </span>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Cantidad:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(false)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(true)}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Añadir al carrito
                </button>
                
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    isWishlisted
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Comprar ahora
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="w-5 h-5 text-green-600" />
                <span>Envío gratis en compras mayores a $100.000</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Garantía de 30 días</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <span>Devoluciones fáciles</span>
              </div>
            </div>

            {/* Share Button */}
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Compartir producto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;