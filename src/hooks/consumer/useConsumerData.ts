import { useQuery } from '@tanstack/react-query';
import { getConsumerInitialData } from '@/services/ConsumerService';

export const consumerKeys = {
  data: () => ['consumer', 'initialData'] as const,
};

export function useConsumerData() {
  return useQuery({
    queryKey: consumerKeys.data(),
    queryFn: getConsumerInitialData,
  });
}
