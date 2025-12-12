// hooks/useActiveAds.ts
import { useState, useEffect } from 'react';
import { adService } from '@/services/adService';
import { AdResponseDTO } from '@/types/advertiser';

export function useActiveAds(page: number = 0, size: number = 10) {
  const [ads, setAds] = useState<AdResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchActiveAds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adService.getActiveAds(currentPage, size);
      
      setAds(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los anuncios');
      console.error('Error fetching active ads:', err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAds();
  }, [currentPage, size]);

  const refetch = () => {
    fetchActiveAds();
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