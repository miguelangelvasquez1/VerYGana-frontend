// ========================================
// SERVICIO DEL CARRITO
// Maneja la lógica de negocio y persistencia
// ========================================

import { CartItem, CartSummary, CreatePurchaseRequestDTO, CreatePurchaseItemRequestDTO } from '@/types/cart.types';

const CART_STORAGE_KEY = 'shopping_cart';

export class CartService {
  // ====================================
  // PERSISTENCIA - LocalStorage
  // ====================================

  static getCart(): CartItem[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const cartData = localStorage.getItem(CART_STORAGE_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  static saveCart(items: CartItem[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  static clearCart(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  // ====================================
  // OPERACIONES DEL CARRITO
  // ====================================

  static addItem(
    currentCart: CartItem[],
    product: {
      id: number;
      name: string;
      imageUrl: string;
      price: number;
      stock: number;
      categoryName: string;
    },
    quantity: number = 1
  ): CartItem[] {
    const existingItemIndex = currentCart.findIndex(
      item => item.productId === product.id
    );

    let newCart: CartItem[];

    if (existingItemIndex >= 0) {
      // El producto ya existe, actualizar cantidad
      newCart = [...currentCart];
      const newQuantity = newCart[existingItemIndex].quantity + quantity;
      
      // Validar que no exceda el stock
      if (newQuantity > product.stock) {
        throw new Error(`Solo hay ${product.stock} unidades disponibles`);
      }

      newCart[existingItemIndex] = {
        ...newCart[existingItemIndex],
        quantity: newQuantity,
        stock: product.stock, // Actualizar stock disponible
      };
    } else {
      // Producto nuevo
      if (quantity > product.stock) {
        throw new Error(`Solo hay ${product.stock} unidades disponibles`);
      }

      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        quantity,
        stock: product.stock,
        categoryName: product.categoryName,
      };

      newCart = [...currentCart, newItem];
    }

    this.saveCart(newCart);
    return newCart;
  }

  static removeItem(currentCart: CartItem[], productId: number): CartItem[] {
    const newCart = currentCart.filter(item => item.productId !== productId);
    this.saveCart(newCart);
    return newCart;
  }

  static updateQuantity(
    currentCart: CartItem[],
    productId: number,
    quantity: number
  ): CartItem[] {
    if (quantity < 1) {
      return this.removeItem(currentCart, productId);
    }

    const newCart = currentCart.map(item => {
      if (item.productId === productId) {
        // Validar que no exceda el stock
        if (quantity > item.stock) {
          throw new Error(`Solo hay ${item.stock} unidades disponibles`);
        }
        return { ...item, quantity };
      }
      return item;
    });

    this.saveCart(newCart);
    return newCart;
  }

  // ====================================
  // CÁLCULOS Y RESUMEN
  // ====================================

  static getCartSummary(items: CartItem[]): CartSummary {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      items,
      itemCount,
      subtotal,
      total: subtotal, // Aquí puedes agregar lógica de descuentos después
    };
  }

  // ====================================
  // VALIDACIONES
  // ====================================

  static validateStock(items: CartItem[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    items.forEach(item => {
      if (item.quantity > item.stock) {
        errors.push(
          `${item.name}: solo hay ${item.stock} unidades disponibles (tienes ${item.quantity} en el carrito)`
        );
      }
      if (item.stock === 0) {
        errors.push(`${item.name}: producto agotado`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ====================================
  // CONVERSIÓN A DTO DE COMPRA
  // ====================================

  static convertToCreatePurchaseDTO(items: CartItem[]) {
    return items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
  }

}