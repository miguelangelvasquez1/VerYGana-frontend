import { ProductSummaryResponseDTO } from "./products/Product.types";
import { ProductCategoryResponseDTO } from "./products/ProductCategory.types";
import { PagedResponse } from "./Generic.types";
import { FeaturedProductResponseDTO } from "./purchases/purchaseItem.types";

export interface DashboardStats {
  totalPendingProducts: number;
  totalActiveProducts: number;
  totalRejectedProducts: number;
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

export interface SalesReportResponseDTO {
  commercialId: number;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  totalSalesAmount: number;
  totalSalesCount: number;
  totalPlatformCommissionsAmount: number;
  topSellingProducts: FeaturedProductResponseDTO[];
}

export interface DailySaleResponseDTO {
  purchaseItemId: number;
  productName: string;
  deliveredAt: string;
  subtotalCents: number;
  commissionCents: number;
  netToCommercialCents: number;
}

export interface CommercialProfileResponseDTO {
  companyName: string;
  departmentName?: string;
  municipalityName?: string;
  registeredDate: string;
  averageRate: number;
  reviewCount: number;
  totalActiveProducts: number;
  productCategories: ProductCategoryResponseDTO[];
  activeProducts: PagedResponse<ProductSummaryResponseDTO>;
}