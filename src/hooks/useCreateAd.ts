import { useState } from 'react';
import { adService, CreateAdRequest } from '@/lib/api/adService';
import { useRouter } from 'next/navigation';

export function useCreateAd() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createAd = async (data: CreateAdRequest, file: File | null) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Crear anuncio
      const ad = await adService.createAd(data);

      // 2. Subir archivo si existe
      if (file) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        await adService.uploadMedia(ad.id, file, fileType);
      }

      // 3. Redirigir a la lista de anuncios
      router.push('/advertiser/ads');
      return ad;

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al crear anuncio';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createAd, loading, error };
}