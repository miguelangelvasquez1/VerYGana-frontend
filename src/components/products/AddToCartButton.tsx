'use client';

// ========================================
// ADD TO CART BUTTON
// Botón para agregar productos al carrito
// ========================================

import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ProductSummaryResponseDTO, ProductResponseDTO } from '@/types/products/Product.types';

interface AddToCartButtonProps {
  product: ProductSummaryResponseDTO | ProductResponseDTO;
  quantity?: number;
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  variant = 'primary',
  className = '',
}: AddToCartButtonProps) {
  const { addItem, openCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async () => {
    if (product.stock === 0) {
      alert('Producto agotado');
      return;
    }

    setIsAdding(true);
    try {
      addItem(
        {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          stock: product.stock,
          categoryName: product.categoryName,
        },
        quantity
      );

      // Mostrar feedback visual
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);

      // Abrir el carrito automáticamente
      openCart();
    } catch (error: any) {
      alert(error.message || 'Error al agregar al carrito');
    } finally {
      setIsAdding(false);
    }
  };

  // Variante de solo ícono (para cards pequeñas)
  if (variant === 'icon') {
    return (
      <button
        onClick={handleAddToCart}
        disabled={isAdding || product.stock === 0 || justAdded}
        className={`p-2 rounded-lg transition-colors ${
          justAdded
            ? 'bg-green-600 text-white'
            : product.stock === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } ${className}`}
        aria-label="Add to cart"
      >
        {justAdded ? (
          <Check className="w-5 h-5" />
        ) : (
          <ShoppingCart className="w-5 h-5" />
        )}
      </button>
    );
  }

  // Variante secundaria (botón con borde)
  if (variant === 'secondary') {
    return (
      <button
        onClick={handleAddToCart}
        disabled={isAdding || product.stock === 0 || justAdded}
        className={`flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg transition-all ${
          justAdded
            ? 'border-green-600 text-green-600 bg-green-50'
            : product.stock === 0
            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
            : 'border-blue-600 text-blue-600 hover:bg-blue-50'
        } ${className}`}
      >
        {justAdded ? (
          <>
            <Check className="w-5 h-5" />
            <span>Agregado</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>{product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}</span>
          </>
        )}
      </button>
    );
  }

  // Variante primaria (botón principal)
  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding || product.stock === 0 || justAdded}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
        justAdded
          ? 'bg-green-600 text-white'
          : product.stock === 0
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${className}`}
    >
      {isAdding ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Agregando...</span>
        </>
      ) : justAdded ? (
        <>
          <Check className="w-5 h-5" />
          <span>¡Agregado!</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          <span>{product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}</span>
        </>
      )}
    </button>
  );
}