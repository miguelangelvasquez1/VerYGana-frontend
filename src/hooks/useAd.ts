// hooks/useAd.ts
import { useState, useEffect } from 'react';
import { adService } from '@/services/adService';
import { AdResponseDTO } from '@/types/advertiser';

export function useAd(adId: number | null) {
  const [ad, setAd] = useState<AdResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAd = async () => {
    if (!adId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await adService.getAdById(adId);
      setAd(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el anuncio');
      console.error('Error fetching ad:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAd();
  }, [adId]);

  const refetch = () => {
    fetchAd();
  };

  return {
    ad,
    loading,
    error,
    refetch,
  };
}