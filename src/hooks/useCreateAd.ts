// hooks/useCreateAd.ts
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adService } from '@/services/adService';
import { AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export function useCreateAd() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createAd = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await adService.createAd(formData);
      
      // Éxito - redirigir o mostrar mensaje
      alert('Anuncio creado exitosamente. Está pendiente de aprobación.');
      router.push('/advertiser/ads');
      
      return response;
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      
      let errorMessage = 'Error al crear el anuncio';
      
      if (axiosError.response?.data) {
        const data = axiosError.response.data;
        
        // Manejar diferentes formatos de error del backend
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors) {
          // Errores de validación
          const firstError = Object.values(data.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        }
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createAd, loading, error };
}