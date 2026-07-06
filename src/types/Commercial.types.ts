import { ProductSummaryResponseDTO } from "./products/Product.types";
import { ProductCategoryResponseDTO } from "./products/ProductCategory.types";
import { PagedResponse } from "./Generic.types";

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