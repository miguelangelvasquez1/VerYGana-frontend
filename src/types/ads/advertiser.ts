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
  mediaType: 'image' | 'video';
  targetUrl: string;
  file: File | null;
  targetAudience: {
    ageRange: [number, number];
    gender: 'all' | 'male' | 'female';
    municipalityCodes: string[];
  };
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
