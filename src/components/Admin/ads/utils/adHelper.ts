import { AdForAdminDTO } from '@/types/ads/commercial';

/**
 * Formatea un monto de anuncio. Recibe PESOS (rewardPerLike, totalBudget, spentBudget y
 * remainingBudget de AdForAdminDTO ya vienen convertidos por el backend).
 */
export const formatCurrency = (pesos: number): string => {
  return `$${Number(pesos).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const calculateStats = (ads: AdForAdminDTO[]) => ({
  total: ads.length,
  pending: ads.filter(ad => ad.status === 'PENDING').length,
  approved: ads.filter(ad => ad.status === 'APPROVED').length,
  active: ads.filter(ad => ad.status === 'ACTIVE').length,
  paused: ads.filter(ad => ad.status === 'PAUSED').length,
  blocked: ads.filter(ad => ad.status === 'BLOCKED').length,
  rejected: ads.filter(ad => ad.status === 'REJECTED').length,
  completed: ads.filter(ad => ad.status === 'COMPLETED').length,
});

export const filterAds = (
  ads: AdForAdminDTO[], 
  searchTerm: string, 
  statusFilter: string
): AdForAdminDTO[] => {
  return ads.filter(ad => {
    const matchesSearch = 
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });
};