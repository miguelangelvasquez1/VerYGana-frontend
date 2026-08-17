import apiClient from "@/lib/api/client";
import { CommercialInitialDataResponseDTO } from "@/types/ads/commercial";
import { CommercialProfileResponseDTO, DailySaleResponseDTO, MonthlyReportResponseDTO, SalesReportResponseDTO } from "@/types/Commercial.types";
import { PagedResponse } from "@/types/Generic.types";
import { PayoutReportResponseDTO } from "@/types/Payout.types";

// ============================================
// INTERFACES
// ============================================
export interface RegisterCommercialDTO {
  email: string;
  password: string;
  phoneNumber: string;
  shopName: string;
  nit: string;
}

export interface CommercialProfile {
  id: number;
  shopName: string;
  taxId: string;
  city: string;
  email: string;
  phoneNumber: string;
  wallet: {
    balance: number;
  };
  totalSales: number;
  rating: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  // ... otros campos
}

export interface Sale {
  id: number;
  total: number;
  date: string;
  status: string;
  // ... otros campos
}

/**
 * Obtener datos iniciales del consumidor
 */
export const getCommercialInitialData = async (): Promise<CommercialInitialDataResponseDTO> => {
  const response = await apiClient.get(`/commercials/initialData`);
  return response.data;
}

/**
 * Variante de getCommercialInitialData que recibe el accessToken explícito
 * en vez de depender del token en memoria que sincroniza <AuthProvider>
 * desde useSession(). Úsala justo después de login: signIn('credentials-sync')
 * ya resolvió, pero useSession() todavía no reflejó la sesión nueva (necesita
 * al menos un ciclo de render), así que el token en memoria puede seguir
 * siendo el anterior (o null) — apiClient dispararía la petición sin el
 * token correcto y el backend respondería 401.
 */
export const getCommercialInitialDataWithToken = async (
  accessToken: string
): Promise<CommercialInitialDataResponseDTO> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${API_URL}/commercials/initialData`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Error al obtener los datos iniciales del comercial');
  }
  return response.json();
};

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Obtener perfil del vendedor
 */
export const getCommercialProfile = async (commercialId: number): Promise<CommercialProfileResponseDTO> => {
  const response = await apiClient.get(`/commercials/${commercialId}/profile`);
  return response.data;
};

/**
 * Actualizar perfil del vendedor
 */
export const updateCommercialProfile = async (
  commercialId: number,
  data: Partial<RegisterCommercialDTO>
): Promise<CommercialProfile> => {
  const response = await apiClient.put(`/commercials/${commercialId}`, data);
  return response.data;
};

/**
 * Obtener productos del vendedor
 */
export const getCommercialProducts = async (commercialId: number): Promise<Product[]> => {
  const response = await apiClient.get(`/commercials/${commercialId}/products`);
  return response.data;
};



/**
 * Obtener historial de ventas
 */
export const getCommercialSales = async (commercialId: number): Promise<Sale[]> => {
  const response = await apiClient.get(`/commercials/${commercialId}/sales`);
  return response.data;
};

export const getPayoutReport = async (commercialId: number, year: number, month: number): Promise<PayoutReportResponseDTO> => {
  const response = await apiClient.get(`/commercials/${commercialId}/report/payout`, {
    params: {
      year,
      month
    }
  });
  return response.data;
};

export const getPayoutReports = async (year: number): Promise<PayoutReportResponseDTO[]> => {
  const response = await apiClient.get(`/commercials/report/payouts`, {
    params: {
      year
    }
  });
  return response.data;
};

export const getAnuallySalesReport = async (year: number): Promise<SalesReportResponseDTO[]> => {
  const response = await apiClient.get(`/commercials/report/sales/anually`, {
    params: {
      year
    }
  });
  return response.data;
};

export const getSalesCountByDateRange = async (startDate: string, endDate: string): Promise<number> => {
  const response = await apiClient.get(`/commercials/report/sales/count`, {
    params: {
      startDate,
      endDate
    }
  });
  return response.data;
};

export const getDailySales = async (startDate: string, endDate: string, page: number, size: number): Promise<PagedResponse<DailySaleResponseDTO>> => {
  const response = await apiClient.get(`/commercials/report/sales/daily`, {
    params: {
      startDate,
      endDate,
      page,
      size
    }
  });
  return response.data;
};

/**
 * Reporte mensual del vendedor
 */
export const getMonthlyReport = async (year: number, month: number): Promise<MonthlyReportResponseDTO> => {
  const response = await apiClient.get("/commercials/report", {
    params: {
    year,
    month
  },
});
return response.data;
}