
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