import apiClient from "@/lib/api/client";

// ============================================
// TIPOS
// ============================================

export interface ReferralInfoDTO {
  referralCode: string;
  referralLink: string;
  qrCodeBase64: string;
  totalReferrals: number;
  consumerName: string;
  consumerEmail: string;
}

export interface ReferralItemDTO {
  name: string;
  lastName: string;
  userName: string;
  email: string;
  department: string;
  municipality: string;
  userState: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING';
  registeredDate: string;
}

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

export const getReferralInfo = async (): Promise<ReferralInfoDTO> => {
  const response = await apiClient.get("/referrals/my-code");
  return response.data;
};

export const getMyReferrals = async (): Promise<ReferralItemDTO[]> => {
  const response = await apiClient.get("/referrals/my-referrals");
  return response.data;
};