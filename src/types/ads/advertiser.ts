import { MunicipalityDTO } from "@/services/LocationService";

// types/advertiser.ts
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

export interface AdvertiserStats {
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

export interface EditAdFormData {
  title: string;
  description: string;
  rewardPerLike: number;
  maxLikes: number;
  totalBudget: number;
  categoryIds: number[];
  startDate: string;
  endDate: string;
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
  rewardPerLike?: number;
  maxLikes?: number;
  startDate?: string | null;
  endDate?: string | null;
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
  advertiserId: number;
  advertiserName: string;
  mediaType: AdMediaType;
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
  advertiserId: number;
  advertiserName: string;
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
  rewardPerLike: number;
  maxLikes: number;
  mediaType: 'IMAGE' | 'VIDEO';
  targetUrl: string | null;
  startDate: string | null; // ISO string or null if immediate
  endDate: string | null; // ISO string or null if budget-exhausted
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

export interface CreateAdAssetRequest {
    originalFileName: string;
    contentType: string;
    sizeBytes: number;
}

export interface AdUploadPermission {
  assetId: number;
  permission: {
    uploadUrl: string;
    expiresAt: string;
  };
}

export interface PrepareAdAssetUploadResponse {
  permissions: AdUploadPermission[];
}

export interface UploadState {
  status: 'idle' | 'preparing' | 'uploading' | 'creating' | 'success' | 'error';
  progress: number;
  currentFile?: string;
  error?: string;
}

export interface CreateAdRequest {
  adDetails: AdDetails;
  assetId: number;
}