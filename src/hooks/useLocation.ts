// hooks/useLocation.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { locationService, Department, Municipality } from '@/services/LocationService';

// Query keys
export const locationKeys = {
  all: ['locations'] as const,
  departments: () => [...locationKeys.all, 'departments'] as const,
  municipalities: (departmentCode: string) => 
    [...locationKeys.all, 'municipalities', departmentCode] as const,
  municipalitiesSearch: (query: string) => 
    [...locationKeys.all, 'municipalities', 'search', query] as const,
};

// Hook para departamentos
export function useDepartments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: locationKeys.departments(),
    queryFn: () => locationService.getDepartments(),
    staleTime: 10 * 60 * 1000, // Los departamentos casi nunca cambian, 10 minutos
    gcTime: 30 * 60 * 1000, // Cache por 30 minutos
    retry: 2,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: locationKeys.departments() });
  };

  return {
    data: query.data,
    departments: query.data || [],
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isError: query.isError,
    refetch,
  };
}

// Hook para municipios por departamento
export function useMunicipalities(departmentCode: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: locationKeys.municipalities(departmentCode || ''),
    queryFn: () => locationService.getMunicipalities(departmentCode!),
    enabled: !!departmentCode, // Solo ejecuta si hay departmentCode
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // Cache por 30 minutos
    retry: 2,
  });

  const refetch = () => {
    if (departmentCode) {
      queryClient.invalidateQueries({ 
        queryKey: locationKeys.municipalities(departmentCode) 
      });
    }
  };

  return {
    data: query.data,
    municipalities: query.data || [],
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isError: query.isError,
    refetch,
  };
}

// Hook para buscar municipios
export function useSearchMunicipalities(searchQuery: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: locationKeys.municipalitiesSearch(searchQuery),
    queryFn: () => locationService.searchMunicipalities(searchQuery),
    enabled: (options?.enabled ?? true) && searchQuery.length >= 2, // Mínimo 2 caracteres
    staleTime: 2 * 60 * 1000, // Búsquedas se refrescan más seguido, 2 minutos
    gcTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 1,
  });

  return {
    municipalities: query.data || [],
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isError: query.isError,
  };
}

// Hook imperativo para búsqueda (si prefieres control manual)
export function useSearchMunicipalitiesManual() {
  const queryClient = useQueryClient();

  const searchMunicipalities = async (query: string) => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const data = await queryClient.fetchQuery({
        queryKey: locationKeys.municipalitiesSearch(query),
        queryFn: () => locationService.searchMunicipalities(query),
        staleTime: 2 * 60 * 1000,
      });
      return data;
    } catch (error) {
      console.error('Error searching municipalities:', error);
      throw error;
    }
  };

  return { searchMunicipalities };
}