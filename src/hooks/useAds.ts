// hooks/useAds.ts
import { useState, useEffect } from 'react';
import { adService } from '@/services/adService';
import { AdResponseDTO } from '@/types/advertiser';

export function useAds(page: number = 0, size: number = 10) {
  const [ads, setAds] = useState<AdResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchAds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adService.getMyAds(currentPage, size);
      
      console.log('✅ Ads cargados:', response.content.length);
      
      setAds(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      console.error('❌ Error fetching ads:', err);
      setError(err.response?.data?.message || 'Error al cargar los anuncios');
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [currentPage, size]);

  const refetch = () => {
    fetchAds();
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return {
    ads,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    refetch,
    goToPage,
  };
}