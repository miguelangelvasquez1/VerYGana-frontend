// ========================================
// TIPOS DEL CARRITO
// ========================================

export interface CartItem {
  productId: number;
  name: string;
  imageUrl: string;
  price: number;
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

// ========================================
// TIPOS PARA LA COMPRA (Backend DTOs)
// ========================================

export interface CreatePurchaseItemRequestDTO {
  productId: number;
  quantity: number;
}

export interface CreatePurchaseRequestDTO {
  items: CreatePurchaseItemRequestDTO[];
  contactEmail?: string;
  notes?: string;
  couponCode?: string;
}

export interface EntityCreatedResponseDTO {
  id: number;
  message: string;
}
