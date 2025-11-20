import api from '../lib/axios';

// ============================================
// INTERFACES
// ============================================
export interface RegisterSellerDTO {
  email: string;
  password: string;
  phoneNumber: string;
  shopName: string;
  nit: string;
}

export interface SellerProfile {
  id: number;
  shopName: string;
  taxId: string;
  city: string;
  email: string;
  phoneNumber: string;
  wallet: {
    balance: number;
  };
  totalSales: number;
  rating: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  // ... otros campos
}

export interface Sale {
  id: number;
  total: number;
  date: string;
  status: string;
  // ... otros campos
}

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Registrar un nuevo vendedor
 */
export const registerSeller = async (data: {
  email: string;
  password: string;
  phoneNumber: string;
  shopName: string;
  nit: string;
}): Promise<any> => {
  const payload: RegisterSellerDTO = {
    email: data.email,
    password: data.password,
    phoneNumber: data.phoneNumber,
    shopName: data.shopName,
    nit: data.nit
  };

  const response = await api.post('/auth/register/seller', payload);
  return response.data;
};

/**
 * Obtener perfil del vendedor
 */
export const getSellerProfile = async (sellerId: number): Promise<SellerProfile> => {
  const response = await api.get(`/sellers/${sellerId}`);
  return response.data;
};

/**
 * Actualizar perfil del vendedor
 */
export const updateSellerProfile = async (
  sellerId: number,
  data: Partial<RegisterSellerDTO>
): Promise<SellerProfile> => {
  const response = await api.put(`/sellers/${sellerId}`, data);
  return response.data;
};

/**
 * Obtener productos del vendedor
 */
export const getSellerProducts = async (sellerId: number): Promise<Product[]> => {
  const response = await api.get(`/sellers/${sellerId}/products`);
  return response.data;
};

/**
 * Crear un nuevo producto
 */
export const createProduct = async (sellerId: number, productData: any): Promise<Product> => {
  const response = await api.post(`/sellers/${sellerId}/products`, productData);
  return response.data;
};

/**
 * Actualizar un producto
 */
export const updateProduct = async (
  sellerId: number,
  productId: number,
  productData: any
): Promise<Product> => {
  const response = await api.put(`/sellers/${sellerId}/products/${productId}`, productData);
  return response.data;
};

/**
 * Eliminar un producto
 */
export const deleteProduct = async (sellerId: number, productId: number): Promise<void> => {
  await api.delete(`/sellers/${sellerId}/products/${productId}`);
};

/**
 * Obtener historial de ventas
 */
export const getSellerSales = async (sellerId: number): Promise<Sale[]> => {
  const response = await api.get(`/sellers/${sellerId}/sales`);
  return response.data;
};

/**
 * Solicitar retiro de saldo
 */
export const requestWithdrawal = async (
  sellerId: number,
  amount: number,
  bankInfo: any
): Promise<any> => {
  const response = await api.post(`/sellers/${sellerId}/withdrawals`, {
    amount,
    bankInfo
  });
  return response.data;
};

/**
 * Obtener estadísticas de ventas
 */
export const getSellerStats = async (sellerId: number): Promise<any> => {
  const response = await api.get(`/sellers/${sellerId}/stats`);
  return response.data;
};

/**
 * Obtener monedero del vendedor
 */
export const getSellerWallet = async (sellerId: number): Promise<any> => {
  const response = await api.get(`/sellers/${sellerId}/wallet`);
  return response.data;
};