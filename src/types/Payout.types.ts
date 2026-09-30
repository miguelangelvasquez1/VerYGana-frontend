export enum PayoutStatus {
    PROCESSING = 'PROCESSING',
    SCHEDULED = 'SCHEDULED',
    PAID = 'PAID',
    FAILED = 'FAILED',
    EXHAUSTED = 'EXHAUSTED'
}

export interface PayoutSummaryResponseDTO {
    id: string;
    grossAmountCents: number;
    commissionCents: number;
    netAmountCents: number;
    status: PayoutStatus;
    scheduledAt: string;
    paidAt: string;
}

export interface PayoutReportResponseDTO {
  commercialPublicId: string;
  month: number;
  earnings: number;
  totalPlatformCommissionsAmount: number;
  year: number;
}

export interface PayoutResponseDTO {
  id : string;
  commercialPublicId: string;
  companyName: string;
  grossAmountCents: number;
  commissionAmountCents: number;
  netAmountCents: number;
  commissionPctApplied: number;
  status: PayoutStatus;
  scheduledAt: string | null;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  failureReason: string | null;
}