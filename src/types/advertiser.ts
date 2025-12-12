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
  | 'REJECTED';

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
}