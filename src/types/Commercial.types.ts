export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
}

export interface MonthlyReportResponseDTO {
  commercialId : number;
  month: number;
  totalSalesAmount : number;
  earnings: number;
  totalPlatformCommissionsAmount: number;
  year: number;
}