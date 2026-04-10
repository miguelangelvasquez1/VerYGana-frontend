import apiClient from "@/lib/api/client";
import { CommercialInitialDataResponseDTO } from "@/types/ads/commercial";
import { MonthlyReportResponseDTO } from "@/types/Commercial.types";

// ============================================
// INTERFACES
// ============================================
export interface RegisterCommercialDTO {
  email: string;
  password: string;
  phoneNumber: string;
  shopName: string;
  nit: string;
}

export interface CommercialProfile {
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

/**
 * Obtener datos iniciales del consumidor
 */
export const getCommercialInitialData = async (): Promise<CommercialInitialDataResponseDTO> => {
  const response = await apiClient.get(`/commercials/initialData`);
  return response.data;
}

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Obtener perfil del vendedor
 */
export const getCommercialProfile = async (commercialId: number): Promise<CommercialProfile> => {
  const response = await apiClient.get(`/commercials/${commercialId}`);
  return response.data;
};

/**
 * Actualizar perfil del vendedor
 */
export const updateCommercialProfile = async (
  commercialId: number,
  data: Partial<RegisterCommercialDTO>
): Promise<CommercialProfile> => {
  const response = await apiClient.put(`/commercials/${commercialId}`, data);
  return response.data;
};

/**
 * Obtener productos del vendedor
 */
export const getCommercialProducts = async (commercialId: number): Promise<Product[]> => {
  const response = await apiClient.get(`/commercials/${commercialId}/products`);
  return response.data;
};

/**
 * Crear un nuevo producto
 */
export const createProduct = async (commercialId: number, productData: any): Promise<Product> => {
  const response = await apiClient.post(`/commercials/${commercialId}/products`, productData);
  return response.data;
};

/**
 * Actualizar un producto
 */
export const updateProduct = async (
  commercialId: number,
  productId: number,
  productData: any
): Promise<Product> => {
  const response = await apiClient.put(`/commercials/${commercialId}/products/${productId}`, productData);
  return response.data;
};

/**
 * Eliminar un producto
 */
export const deleteProduct = async (commercialId: number, productId: number): Promise<void> => {
  await apiClient.delete(`/commercials/${commercialId}/products/${productId}`);
};

/**
 * Obtener historial de ventas
 */
export const getCommercialSales = async (commercialId: number): Promise<Sale[]> => {
  const response = await apiClient.get(`/commercials/${commercialId}/sales`);
  return response.data;
};

/**
 * Solicitar retiro de saldo
 */
export const requestWithdrawal = async (
  commercialId: number,
  amount: number,
  bankInfo: any
): Promise<any> => {
  const response = await apiClient.post(`/commercials/${commercialId}/withdrawals`, {
    amount,
    bankInfo
  });
  return response.data;
};

/**
 * Obtener estadísticas de ventas
 */
export const getCommercialStats = async (commercialId: number): Promise<any> => {
  const response = await apiClient.get(`/commercials/${commercialId}/stats`);
  return response.data;
};

/**
 * Obtener monedero del vendedor
 */
export const getCommercialWallet = async (commercialId: number): Promise<any> => {
  const response = await apiClient.get(`/commercials/${commercialId}/wallet`);
  return response.data;
};

/**
 * Reporte mensual del vendedor
 */
export const getMonthlyReport = async (year: number, month: number): Promise<MonthlyReportResponseDTO> => {
  const response = await apiClient.get("/commercials/report", {
    params: {
    year,
    month
  },
});
return response.data;
}