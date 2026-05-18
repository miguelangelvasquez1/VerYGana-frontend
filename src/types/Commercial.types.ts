export interface DashboardStats {
  totalPendingProducts: number;
  totalActiveProducts: number;
  totalRejectedProducts: number;
  totalSales: number;
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