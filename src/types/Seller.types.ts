export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
}

export interface MonthlyReportResponseDTO {
  sellerId : number;
  month: number;
  totalSalesAmount : number;
  earnings: number;
  totalPlatformCommissionsAmount: number;
  year: number;
}