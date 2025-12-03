// hooks/useCategories.ts
'use client';

import { useState, useEffect } from 'react';
import { categoryService, Category } from '@/services/CategoryService';
import { AxiosError } from 'axios';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoryService.getAllCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError.message || 'Error al cargar categorías');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, error, refetch };
}