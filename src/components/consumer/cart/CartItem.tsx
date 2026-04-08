'use client';

// ========================================
// CART ITEM - Item Individual del Carrito
// ========================================

import React, { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/cart.types';
import { useCart } from '@/context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleIncrement = async () => {
    if (item.quantity >= item.stock) {
      alert(`Solo hay ${item.stock} unidades disponibles`);
      return;
    }

    setIsUpdating(true);
    try {
      updateQuantity(item.productId, item.quantity + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async () => {
    setIsUpdating(true);
    try {
      updateQuantity(item.productId, item.quantity - 1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = () => {
    if (confirm(`¿Eliminar "${item.name}" del carrito?`)) {
      removeItem(item.productId);
    }
  };

  const subtotal = item.price * item.quantity;

  return (
    <div className="flex gap-3 py-4 border-b border-gray-200 last:border-0">
      {/* Imagen */}
      <div className="flex-shrink-0">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">
          {item.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {item.categoryName}
        </p>

        {/* Precio */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-lg font-semibold text-gray-900">
            ${item.price.toLocaleString()}
          </p>

          {/* Controles de cantidad */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
              disabled={isUpdating}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="w-8 text-center font-medium">
              {item.quantity}
            </span>

            <button
              onClick={handleIncrement}
              disabled={isUpdating || item.quantity >= item.stock}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtotal y eliminar */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-600">
            Subtotal: <span className="font-semibold">${subtotal.toLocaleString()}</span>
          </p>

          <button
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700 p-1"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Advertencia de stock */}
        {item.quantity === item.stock && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Máximo disponible
          </p>
        )}
      </div>
    </div>
  );
}