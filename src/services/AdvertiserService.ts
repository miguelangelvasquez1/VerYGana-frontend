import apiClient from "@/lib/api/client";

// ============================================
// INTERFACES
// ============================================
export interface RegisterAdvertiserDTO {
  email: string;
  password: string;
  phoneNumber: string;
  companyName: string;
  nit: string;
}

export interface AdvertiserProfile {
  id: number;
  companyName: string;
  nit: string;
  email: string;
  phoneNumber: string;
  adBudget: number;
  totalSpent: number;
}

export interface Advertisement {
  id: number;
  title: string;
  content: string;
  budget: number;
  impressions: number;
  clicks: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

export interface CreateAdDTO {
  title: string;
  content: string;
  budget: number;
  targetAudience?: string[];
  duration: number;
}

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Registrar un nuevo anunciante
 */
export const registerAdvertiser = async (data: {
  email: string;
  password: string;
  phoneNumber: string;
  name: string;
  nit: string;
}): Promise<any> => {
  const payload: RegisterAdvertiserDTO = {
    email: data.email,
    password: data.password,
    phoneNumber: data.phoneNumber,
    companyName: data.name,
    nit: data.nit
  };

  const response = await apiClient.post('/auth/register/advertiser', payload);
  return response.data;
};

/**
 * Obtener perfil del anunciante
 */
export const getAdvertiserProfile = async (advertiserId: number): Promise<AdvertiserProfile> => {
  const response = await apiClient.get(`/advertisers/${advertiserId}`);
  return response.data;
};

/**
 * Actualizar perfil del anunciante
 */
export const updateAdvertiserProfile = async (
  advertiserId: number,
  data: Partial<RegisterAdvertiserDTO>
): Promise<AdvertiserProfile> => {
  const response = await apiClient.put(`/advertisers/${advertiserId}`, data);
  return response.data;
};

/**
 * Obtener anuncios del anunciante
 */
export const getAdvertiserAds = async (advertiserId: number): Promise<Advertisement[]> => {
  const response = await apiClient.get(`/advertisers/${advertiserId}/ads`);
  return response.data;
};

/**
 * Crear un nuevo anuncio
 */
export const createAdvertisement = async (
  advertiserId: number,
  adData: CreateAdDTO
): Promise<Advertisement> => {
  const response = await apiClient.post(`/advertisers/${advertiserId}/ads`, adData);
  return response.data;
};

/**
 * Actualizar un anuncio
 */
export const updateAdvertisement = async (
  advertiserId: number,
  adId: number,
  adData: Partial<CreateAdDTO>
): Promise<Advertisement> => {
  const response = await apiClient.put(`/advertisers/${advertiserId}/ads/${adId}`, adData);
  return response.data;
};

/**
 * Eliminar un anuncio
 */
export const deleteAdvertisement = async (advertiserId: number, adId: number): Promise<void> => {
  await apiClient.delete(`/advertisers/${advertiserId}/ads/${adId}`);
};

/**
 * Pausar/reanudar un anuncio
 */
export const toggleAdvertisement = async (
  advertiserId: number,
  adId: number,
  action: 'pause' | 'resume'
): Promise<Advertisement> => {
  const response = await apiClient.patch(`/advertisers/${advertiserId}/ads/${adId}/${action}`);
  return response.data;
};

/**
 * Obtener estadísticas de anuncios
 */
export const getAdvertiserStats = async (advertiserId: number): Promise<any> => {
  const response = await apiClient.get(`/advertisers/${advertiserId}/stats`);
  return response.data;
};

/**
 * Recargar presupuesto publicitario
 */
export const rechargeAdBudget = async (
  advertiserId: number,
  amount: number
): Promise<any> => {
  const response = await apiClient.post(`/advertisers/${advertiserId}/budget/recharge`, {
    amount
  });
  return response.data;
};

/**
 * Obtener historial de transacciones
 */
export const getAdvertiserTransactions = async (advertiserId: number): Promise<any[]> => {
  const response = await apiClient.get(`/advertisers/${advertiserId}/transactions`);
  return response.data;
};