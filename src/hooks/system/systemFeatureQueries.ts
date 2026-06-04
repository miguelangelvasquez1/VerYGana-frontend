import { useMutation, useQuery } from '@tanstack/react-query';
import { getSystemFeatures, updateFeatureStatus } from '@/services/admin/AdminSystemService';
import { FeatureStatus } from '@/types/system/SystemFeature.types';

export const systemFeatureKeys = {
  all: ['system-features'] as const,
};

export function useSystemFeatures() {
  return useQuery({
    queryKey: systemFeatureKeys.all,
    queryFn: getSystemFeatures,
    staleTime: 30 * 1000,
  });
}

export function useUpdateFeatureStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FeatureStatus }) =>
      updateFeatureStatus(id, status),
  });
}
