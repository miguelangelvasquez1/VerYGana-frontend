import apiClient from "@/lib/api/client";
import { CategoryResponseDTO } from "@/types/Category.types";
import { RegisterConsumerDTO, ConsumerInitialDataResponseDTO, ConsumerProfileResponseDTO, ConsumerUpdateProfileRequestDTO} from "@/types/Consumer.types";
import { EntityUpdatedResponseDTO } from "@/types/GenericTypes";
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
  categories?: CategoryResponseDTO[];
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
 * Obtener datos iniciales del consumidor
 */
export const getConsumerInitialData = async (): Promise<ConsumerInitialDataResponseDTO> => {
  const response = await apiClient.get(`/consumers/initialData`);
  return response.data;
}

/**
 * Obtener perfil del consumidor
 */
export const getConsumerProfile = async (): Promise<ConsumerProfileResponseDTO> => {
  const response = await apiClient.get(`/consumers/profile`);
  return response.data;
};

/**
 * Actualizar perfil del consumidor
 */
export const updateConsumerProfile = async (
  data: ConsumerUpdateProfileRequestDTO
): Promise<EntityUpdatedResponseDTO> => {
  const response = await apiClient.put(`/consumers/profile/edit`, data);
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