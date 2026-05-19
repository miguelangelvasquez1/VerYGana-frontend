// ========================================
// TIPOS DEL CARRITO
// ========================================

export interface CartItem {
  productId: number;
  name: string;
  imageUrl: string;
  price: number;
  maxKeysAllowed: number;  // llaves máximas por unidad
  minCashCents: number;    // piso de efectivo en centavos por unidad
  quantity: number;
  stock: number; // Stock disponible al momento de agregar
  categoryName: string;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number; // Total de items (suma de cantidades)
  subtotal: number;
  total: number;
}

