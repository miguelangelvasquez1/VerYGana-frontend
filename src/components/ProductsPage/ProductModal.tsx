import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Share2,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { ProductResponseDTO } from "@/types/products/Product.types";
import { getProductDetail } from "@/services/ProductService";

interface ProductModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: number, quantity: number) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  productId,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [product, setProduct] = useState<ProductResponseDTO | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !productId) return;

    setLoading(true);
    getProductDetail(Number(productId))
      .then((data) => {
        setProduct(data);
        setSelectedImage(data.imageUrl);
      })
      .catch((err) => console.error("Error loading product:", err))
      .finally(() => setLoading(false));
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Vista Previa del Producto
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !product ? (
          <div className="p-10 text-center text-gray-500">
            Cargando información...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* LEFT – IMAGES */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={selectedImage ?? product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedImage(product.imageUrl)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === product.imageUrl
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  <img
                    src={product.imageUrl}
                    alt="thumbnail"
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>
            </div>

            {/* RIGHT – PRODUCT INFO */}
            <div className="space-y-6">
              {/* Category */}
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {product.categoryName}
              </span>

              {/* Name */}
              <h1 className="text-3xl font-bold text-gray-800">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < product.averageRate
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.averageRate} ({product.reviewCount} reseñas)
                </span>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-gray-900">
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                }).format(product.price)}
              </div>

              {/* Description */}
              <p className="text-gray-700">{product.description}</p>

              {/* Stock */}
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  product.stock > 10
                    ? "bg-green-100 text-green-800"
                    : product.stock > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.stock > 0
                  ? `${product.stock} disponibles`
                  : "Sin stock"}
              </span>

              {/* Quantity */}
              {product.stock > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm">Cantidad:</span>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.max(1, q - 1))
                      }
                      className="p-2"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="px-4 py-2 border-x">{quantity}</span>

                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      className="p-2"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ONLY BUTTON: Add to Cart */}
              <button
                className="w-full bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"
                onClick={() => onAddToCart(product.id, quantity)}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5" />
                Añadir al carrito
              </button>

              <button className="flex items-center gap-2 text-gray-600 mt-4">
                <Share2 className="w-4 h-4" />
                Compartir producto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
