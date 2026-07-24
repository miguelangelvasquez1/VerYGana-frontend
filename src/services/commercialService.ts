import apiClient from "@/lib/api/client";
import { CommercialInitialDataResponseDTO } from "@/types/ads/commercial";
import { CommercialProfileResponseDTO, MonthlyReportResponseDTO } from "@/types/Commercial.types";

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

/**
 * Variante de getCommercialInitialData que recibe el accessToken explícito
 * en vez de depender del token en memoria que sincroniza <AuthProvider>
 * desde useSession(). Úsala justo después de login: signIn('credentials-sync')
 * ya resolvió, pero useSession() todavía no reflejó la sesión nueva (necesita
 * al menos un ciclo de render), así que el token en memoria puede seguir
 * siendo el anterior (o null) — apiClient dispararía la petición sin el
 * token correcto y el backend respondería 401.
 */
export const getCommercialInitialDataWithToken = async (
  accessToken: string
): Promise<CommercialInitialDataResponseDTO> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${API_URL}/commercials/initialData`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Error al obtener los datos iniciales del comercial');
  }
  return response.json();
};

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Obtener perfil del vendedor
 */
export const getCommercialProfile = async (commercialId: number): Promise<CommercialProfileResponseDTO> => {
  const response = await apiClient.get(`/commercials/${commercialId}/profile`);
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