import { MunicipalityDTO } from "@/services/LocationService";

export interface CommercialInitialDataResponseDTO {
    companyName : string;
    nit : string;
    email : string;
}

// types/commercial.ts
export interface Ad {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video';
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'paused';
  createdAt: Date;
  approvedAt?: Date;
  rejectedReason?: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number; // Click Through Rate
  cpc: number; // Cost Per Click
  targetAudience: {
    ageRange: [number, number];
    gender: 'all' | 'male' | 'female';
    interests: string[];
    location: string[];
  };
}

export interface Campaign {
  id: string;
  name: string;
  ads: Ad[];
  totalBudget: number;
  totalSpent: number;
  status: 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
}

export interface CommercialStats {
  totalSpent: number;
  remainingBalance: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  activeAds: number;
  pendingApproval: number;
}

export type AdStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'ACTIVE'
  | 'PAUSED' 
  | 'COMPLETED' 
  | 'REJECTED'
  | 'EXPIRED'
  | 'BLOCKED';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface AdResponseDTO {
  id: number;
  title: string;
  description: string;
  rewardPerLike: number;
  maxLikes: number;
  maxLikesPerUserPerDay?: number;
  currentLikes: number;
  status: AdStatus;
  createdAt: string;
  updatedAt: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  remainingLikes: number;
  completionPercentage: number;
  contentUrl: string;
  targetUrl: string | null;
  categories: Category[];
  minAge: number;
  maxAge: number;
  targetGender: string;
  rejectionReason: string | null;
  mediaType?: string;
  targetMunicipalities: MunicipalityDTO[];
}

export interface AdLikeDTO {
  userId: number;
  userName: string;
  likedAt: string;
}

export interface EditAdFormData {
  title: string;
  description: string;
  categoryIds: number[];
  startDate: string;
  targetUrl: string;
  targetAudience: {
    ageRange: [number, number];
    gender: 'all' | 'male' | 'female';
    municipalityCodes: string[];
  };
}

export interface AdUpdateDTO {
  title?: string;
  description?: string;
  startDate?: string | null;
  targetUrl?: string;
  categoryIds?: number[];
  targetMunicipalitiesCodes?: string[];
  minAge?: number;
  maxAge?: number;
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
}

export interface SelectedMunicipalityData {
  code: string;
  name: string;
  departmentCode: string;
  departmentName: string;
}

export enum AdMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}


export interface AdForConsumerDTO {
  id: number;
  title: string;
  description: string;
  currentLikes: number;
  contentUrl: string;
  targetUrl: string;
  commercialId: number;
  commercialName: string;
  mediaType: AdMediaType;
  durationSeconds: number;
  sessionUUID: string;
}

export type AdForAdminDTO = {
  id: number;
  title: string;
  description: string;
  rewardPerLike: number;           // BigDecimal → number
  maxLikes: number;
  currentLikes: number;
  status: AdStatus;
  createdAt: string;               // LocalDateTime → ISO string
  updatedAt: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  remainingLikes: number;
  completionPercentage: number;
  contentUrl: string;
  mediaType: MediaType;
  targetUrl: string;
  categories: Category[];
  minAge: number;
  maxAge: number;
  targetGender: string;
  rejectionReason: string | null;
  targetMunicipalities: MunicipalityResponseDTO[];
  commercialId: number;
  commercialName: string;
};

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export type MunicipalityResponseDTO = {
  code: string;
  name: string;
  departmentCode: string;
  departmentName: string;
};

// types/ads.ts

export interface AdDetails {
  title: string;
  description: string;
  pricePerLike: number;
  maxLikes: number;
  maxLikesPerUserPerDay: number;
  targetUrl: string | null;
  startDate: string | null; // ISO string or null if immediate
  categoryIds: number[];
  targetMunicipalitiesCodes: string[];
  minAge: number;
  maxAge: number;
  targetGender: 'MALE' | 'FEMALE' | 'ALL';
}

export interface FileWithProgress {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  progress?: number;
  error?: string;
  assetId?: number;
}

export interface FileUploadRequestDTO {
    originalFileName: string;
    contentType: string;
    sizeBytes: number;
    imageDurationSeconds?: number; // Solo para imágenes con duración (si aplica)
}

export interface AdUploadPermission {
  assetId: number;
  permission: {
    uploadUrl: string;
    expiresAt: string;
  };
}

export interface AssetAnalysisResult {
  /** Real duration in seconds (ceiling), resolved server-side. */
  durationSeconds: number;
  /**
   * Minimum price per like in cents.
   * Already rounded up to a multiple of 10.
   * User may choose any value >= this that is also a multiple of 10.
   */
  minPricePerLike: number;
}

export interface UploadState {
  status: 'idle' | 'preparing' | 'uploading' | 'creating' | 'success' | 'error' | 'analyzing';
  progress: number;
  currentFile?: string;
  error?: string;
  errorDetails?: Record<string, string>;
}

export interface CreateAdRequest {
  adDetails: AdDetails;
  assetId: number;
}

export interface AssetPricingInfo {
  assetId: number;
  durationSeconds: number;
  minPricePerLike: number;
}

export interface AdLikedResponse {
  liked: boolean;
  rewardAmount: number;
}