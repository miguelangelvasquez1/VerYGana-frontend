import apiClient from "@/lib/api/client";

// ============================================
// INTERFACES
// ============================================
export interface Category {
  id: number;
  name: string;
}

export interface RegisterConsumerDTO {
  email: string;
  password: string;
  phoneNumber: string;
  name: string;
  lastName: string;
  department: string;
  municipality: string;
  categories?: Category[];
}

export interface ConsumerProfile {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
  municipio: string;
  categories: Category[];
  wallet: {
    balance: number;
  };
}

export interface UpdateConsumerDTO {
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
  municipio?: string;
  categories?: Category[];
}


// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Registrar un nuevo consumidor
 */
export const registerConsumer = async (data: {
  email: string;
  password: string;
  phoneNumber: string;
  name: string;
  lastNames: string;
  department: string;
  municipality: string;
  categories?: Category[];
}): Promise<any> => {
  const payload: RegisterConsumerDTO = {
    email: data.email,
    password: data.password,
    phoneNumber: data.phoneNumber,
    name: data.name,
    lastName: data.lastNames,
    department: data.department,
    municipality: data.municipality,
    categories: data.categories || []
  };

  const response = await apiClient.post('/auth/register/consumer', payload);
  return response.data;
};

/**
 * Obtener perfil del consumidor
 */
export const getConsumerProfile = async (consumerId: number): Promise<ConsumerProfile> => {
  const response = await apiClient.get(`/consumers/${consumerId}`);
  return response.data;
};

/**
 * Actualizar perfil del consumidor
 */
export const updateConsumerProfile = async (
  consumerId: number, 
  data: UpdateConsumerDTO
): Promise<ConsumerProfile> => {
  const response = await apiClient.put(`/consumers/${consumerId}`, data);
  return response.data;
};

/**
 * Obtener historial de compras
 */
export const getConsumerPurchases = async (consumerId: number): Promise<any[]> => {
  const response = await apiClient.get(`/consumers/${consumerId}/purchases`);
  return response.data;
};

/**
 * Obtener monedero del consumidor
 */
export const getConsumerWallet = async (consumerId: number): Promise<any> => {
  const response = await apiClient.get(`/consumers/${consumerId}/wallet`);
  return response.data;
};

/**
 * Recargar saldo (ejemplo de método específico)
 */
export const rechargeWallet = async (
  consumerId: number, 
  amount: number
): Promise<any> => {
  const response = await apiClient.post(`/consumers/${consumerId}/wallet/recharge`, {
    amount
  });
  return response.data;
};

/**
 * Obtener productos recomendados basados en intereses
 */
export const getRecommendedProducts = async (consumerId: number): Promise<any[]> => {
  const response = await apiClient.get(`/consumers/${consumerId}/recommendations`);
  return response.data;
};

/**
 * Eliminar cuenta de consumidor
 */
export const deleteConsumerAccount = async (consumerId: number): Promise<void> => {
  await apiClient.delete(`/consumers/${consumerId}`);
};