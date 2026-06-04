import apiClient from '@/lib/api/client';
import { FeatureStatus, SystemFeature } from '@/types/system/SystemFeature.types';

export const getSystemFeatures = async (): Promise<SystemFeature[]> => {
  const res = await apiClient.get<SystemFeature[]>('/system-features');
  return res.data;
};

export const updateFeatureStatus = async (id: number, status: FeatureStatus): Promise<void> => {
  await apiClient.patch(`/system-features/${id}/status`, null, { params: { status } });
};
