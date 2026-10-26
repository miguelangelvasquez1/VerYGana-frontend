// Reconocimientos de VERYGANA.
// VERYGANA compra un producto a un empresario con el Fondo de Fortalecimiento
// y se lo regala a un usuario destacado (el "beneficiario", nunca el
// "comprador"). Todos los montos van en CENTAVOS de COP y los usuarios se
// identifican siempre por publicId (UUID).

import type { PurchaseItemStatus } from '@/types/purchases/purchaseItem.types';
import type { UserLevel } from '@/types/User.types';

export type RecognitionStatus = 'PURCHASED' | 'DELIVERED' | 'EXPIRED' | 'CANCELLED';

export type RecognitionCriterion =
  | 'KEYS_EARNED'
  | 'PURCHASES_COUNT'
  | 'PURCHASES_AMOUNT'
  | 'GAMES_PLAYED'
  | 'XP'
  | 'OTHER';

// Criterios con ranking de candidatos (OTHER no es válido en /candidates).
export type RankingCriterion = Exclude<RecognitionCriterion, 'OTHER'>;

export type ComputableSaleStatus = 'PENDING' | 'RECOGNIZED' | 'REVERSED';
export type SaleComponentType = 'USER_CASH' | 'KEYS_BACKING' | 'VERYGANA_PAYMENT';
export type SaleComponentStatus = 'RECOGNIZED' | 'REVERSED';
export type SalePayerType = 'CONSUMER' | 'VERYGANA';
export type PurchaseBuyerType = 'CONSUMER' | 'VERYGANA';

export interface RecognitionCandidate {
  publicId: string;
  fullName: string;
  // Llaves (KEYS_EARNED), # compras, CENTAVOS (PURCHASES_AMOUNT), # partidas o XP.
  metricValue: number;
  level: UserLevel | null;
  lastActivityAt: string | null; // LocalDateTime sin zona
  recognitionsReceived: number;
  lastRecognitionAt: string | null;
}

export interface CandidatesParams {
  criterion: RankingCriterion;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface CreateRecognitionRequest {
  beneficiaryPublicId: string;
  productId: number;
  quantity: number; // 1 a 10
  criterion: RecognitionCriterion;
  metricValue: number | null;
  periodFrom: string | null;
  periodTo: string | null;
  reason: string; // obligatorio, máx. 500
}

export interface RecognitionSummary {
  publicId: string;
  status: RecognitionStatus;
  beneficiaryPublicId: string;
  beneficiaryName: string;
  productName: string;
  commercialName: string | null;
  quantity: number;
  totalCents: number;
  createdAt: string;
}

export interface RecognitionListParams {
  status?: RecognitionStatus;
  beneficiary?: string; // publicId
  commercial?: string; // publicId
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface RecognitionSaleComponent {
  type: SaleComponentType;
  payer: SalePayerType;
  sourceRef: string;
  amountCents: number;
  status: SaleComponentStatus;
  cause: string | null;
  createdAt: string;
}

export interface RecognitionDetailItem {
  itemId: number;
  productName: string;
  status: PurchaseItemStatus;
  computableStatus: ComputableSaleStatus;
  recognizedAt: string | null;
  subtotalCents: number;
  prosperityAbsorbedCents: number;
  commissionBaseCents: number | null;
  commissionPctApplied: number;
  commissionCents: number;
  commissionVatCents: number;
  netToCommercialCents: number;
  deliveredAt: string | null;
  claimedAt: string | null;
  claimExpiresAt: string | null;
  paidOut: boolean; // true = ya se le pagó al comercio
  components: RecognitionSaleComponent[];
}

export interface RecognitionDetail {
  publicId: string;
  status: RecognitionStatus;
  criterion: RecognitionCriterion;
  metricValue: number | null;
  periodFrom: string | null;
  periodTo: string | null;
  reason: string;
  createdByAdminPublicId: string;
  createdAt: string;
  deliveredAt: string | null;
  closedAt: string | null;
  cancelCause: string | null;
  buyer: 'VERYGANA';
  beneficiaryPublicId: string;
  beneficiaryName: string;
  commercialPublicId: string | null;
  commercialName: string | null;
  purchaseId: number;
  fundingRef: string;
  totalCents: number;
  prosperityAbsorbedCents: number;
  commissionCents: number;
  netToCommercialCents: number;
  items: RecognitionDetailItem[];
}

export interface RecognitionFund {
  fortificationBalanceCents: number;
  activeSpentCents: number;
  purchasedCount: number;
  deliveredCount: number;
  expiredCount: number;
  cancelledCount: number;
}

export interface CancelRecognitionRequest {
  cause: string;
}

// ─── Consumidor ──────────────────────────────────────────────────────────────
// El consumidor nunca ve precios ni datos del fondo.

export interface ConsumerRecognitionItem {
  itemId: number;
  status: PurchaseItemStatus;
  code: string | null;
  claimExpiresAt: string | null;
}

export interface ConsumerRecognition {
  publicId: string;
  status: RecognitionStatus;
  reason: string;
  productName: string;
  imageUrl: string | null;
  commercialName: string | null;
  createdAt: string;
  deliveredAt: string | null;
  items: ConsumerRecognitionItem[];
}
