// hooks/useCategories.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllCategories } from '@/services/CategoryService';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
};

export function useCategories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: getAllCategories,
    staleTime: 5 * 60 * 1000, // Las categorías son estables, 5 minutos
    gcTime: 10 * 60 * 1000, // Cache por 10 minutos (antes cacheTime)
    retry: 2,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
  };

  return {
    categories: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    isError: query.isError,
    refetch,
  };
}