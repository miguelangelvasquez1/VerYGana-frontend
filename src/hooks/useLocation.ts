// hooks/useLocation.ts
'use client';

import { useState, useEffect } from 'react';
import { locationService, Department, Municipality } from '@/services/LocationService';
import { AxiosError } from 'axios';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const data = await locationService.getDepartments();
        setDepartments(data);
        setError(null);
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError.message || 'Error al cargar departamentos');
        console.error('Error fetching departments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await locationService.getDepartments();
      setDepartments(data);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError.message || 'Error al cargar departamentos');
    } finally {
      setLoading(false);
    }
  };

  return { departments, loading, error, refetch };
}

export function useMunicipalities(departmentCode: string | null) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!departmentCode) {
      setMunicipalities([]);
      setError(null);
      return;
    }

    const fetchMunicipalities = async () => {
      try {
        setLoading(true);
        const data = await locationService.getMunicipalities(departmentCode);
        setMunicipalities(data);
        setError(null);
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError.message || 'Error al cargar municipios');
        console.error('Error fetching municipalities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipalities();
  }, [departmentCode]);

  const refetch = async () => {
    if (!departmentCode) return;
    
    setLoading(true);
    try {
      const data = await locationService.getMunicipalities(departmentCode);
      setMunicipalities(data);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError.message || 'Error al cargar municipios');
    } finally {
      setLoading(false);
    }
  };

  return { municipalities, loading, error, refetch };
}

// Hook adicional para buscar municipios
export function useSearchMunicipalities() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMunicipalities = async (query: string) => {
    if (!query || query.length < 2) {
      setMunicipalities([]);
      return;
    }

    try {
      setLoading(true);
      const data = await locationService.searchMunicipalities(query);
      setMunicipalities(data);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError.message || 'Error al buscar municipios');
      console.error('Error searching municipalities:', err);
    } finally {
      setLoading(false);
    }
  };

  return { municipalities, loading, error, searchMunicipalities };
}