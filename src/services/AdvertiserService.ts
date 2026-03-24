import apiClient from "@/lib/api/client";

// ============================================
// INTERFACES
// ============================================
export interface RegisterCommercialDTO {
  email: string;
  password: string;
  phoneNumber: string;
  companyName: string;
  nit: string;
}

export interface CommercialProfile {
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
 * Registrar un nuevo comerciante
 */
export const registerCommercial = async (data: {
  email: string;
  password: string;
  phoneNumber: string;
  name: string;
  nit: string;
}): Promise<any> => {
  const payload: RegisterCommercialDTO = {
    email: data.email,
    password: data.password,
    phoneNumber: data.phoneNumber,
    companyName: data.name,
    nit: data.nit
  };

  const response = await apiClient.post('/auth/register/commercial', payload);
  return response.data;
};

/**
 * Obtener perfil del comerciante
 */
export const getCommercialProfile = async (commercialId: number): Promise<CommercialProfile> => {
  const response = await apiClient.get(`/commercials/${commercialId}`);
  return response.data;
};

/**
 * Actualizar perfil del comerciante
 */
export const updateCommercialProfile = async (
  commercialId: number,
  data: Partial<RegisterCommercialDTO>
): Promise<CommercialProfile> => {
  const response = await apiClient.put(`/commercials/${commercialId}`, data);
  return response.data;
};

/**
 * Obtener anuncios del comerciante
 */
export const getCommercialAds = async (commercialId: number): Promise<Advertisement[]> => {
  const response = await apiClient.get(`/commercials/${commercialId}/ads`);
  return response.data;
};

/**
 * Crear un nuevo anuncio
 */
export const createAdvertisement = async (
  commercialId: number,
  adData: CreateAdDTO
): Promise<Advertisement> => {
  const response = await apiClient.post(`/commercials/${commercialId}/ads`, adData);
  return response.data;
};

/**
 * Actualizar un anuncio
 */
export const updateAdvertisement = async (
  commercialId: number,
  adId: number,
  adData: Partial<CreateAdDTO>
): Promise<Advertisement> => {
  const response = await apiClient.put(`/commercials/${commercialId}/ads/${adId}`, adData);
  return response.data;
};

/**
 * Eliminar un anuncio
 */
export const deleteAdvertisement = async (commercialId: number, adId: number): Promise<void> => {
  await apiClient.delete(`/commercials/${commercialId}/ads/${adId}`);
};

/**
 * Pausar/reanudar un anuncio
 */
export const toggleAdvertisement = async (
commercialId: number,
  adId: number,
  action: 'pause' | 'resume'
): Promise<Advertisement> => {
  const response = await apiClient.patch(`/commercials/${commercialId}/ads/${adId}/${action}`);
  return response.data;
};

/**
 * Obtener estadísticas de anuncios
 */
export const getCommercialStats = async (commercialId: number): Promise<any> => {
  const response = await apiClient.get(`/commercials/${commercialId}/stats`);
  return response.data;
};

/**
 * Recargar presupuesto publicitario
 */
export const rechargeAdBudget = async (
  commercialId: number,
  amount: number
): Promise<any> => {
  const response = await apiClient.post(`/commercials/${commercialId}/budget/recharge`, {
    amount
  });
  return response.data;
};

/**
 * Obtener historial de transacciones
 */
export const getCommercialTransactions = async (commercialId: number): Promise<any[]> => {
  const response = await apiClient.get(`/commercials/${commercialId}/transactions`);
  return response.data;
};