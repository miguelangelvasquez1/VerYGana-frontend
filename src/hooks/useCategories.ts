// hooks/useCategories.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, getAllCategories } from '@/services/CategoryService';
import { AxiosError } from 'axios';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true; // evita setState después del unmount

    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllCategories();
        // Si el service devuelve null (error manejado internamente), lo tratamos:
        if (!mounted) return;
        if (data && Array.isArray(data)) {
          setCategories(data);
        } else {
          // No hay datos válidos: vaciar lista y setear mensaje
          setCategories([]);
          setError('No se encontraron categorías');
        }
      } catch (err) {
        if (!mounted) return;
        // Manejo seguro del error: intenta leer message de Axios u objeto general
        const message =
          (err instanceof AxiosError && err.message) ||
          (err && typeof (err as any).message === 'string' && (err as any).message) ||
          'Error al cargar categorías';
        setError(message);
        console.error('Error fetching categories:', err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // refetch estable con useCallback y mismo comportamiento seguro
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCategories();
      if (data && Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
        setError('No se encontraron categorías');
      }
    } catch (err) {
      const message =
        (err instanceof AxiosError && err.message) ||
        (err && typeof (err as any).message === 'string' && (err as any).message) ||
        'Error al recargar categorías';
      setError(message);
      console.error('Error refetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, error, refetch };
}
