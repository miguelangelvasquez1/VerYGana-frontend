import type { CommercialDocumentType } from '../commercial/Expediente.types';

export type InformationRequestTrigger =
  | 'DOCUMENT_EXPIRED' | 'ACTIVITY_CHANGE' | 'ESTABLISHMENT_CHANGE' | 'MATERIAL_OPERATION_INCREASE'
  | 'NEW_REQUIREMENT' | 'INCONSISTENCY' | 'INCIDENT' | 'RISK' | 'MISSING_MANIFESTATION' | 'EXPRESS_REFUSAL';
export type InformationRequestStatus =
  | 'OPEN' | 'RESPONDED' | 'OBSERVED' | 'CLOSED_SATISFIED' | 'CLOSED_WITH_FINDING' | 'CANCELLED';
export type RequestItemType = 'FIELD' | 'DOCUMENT' | 'CLARIFICATION';
export type RequestReviewResult = 'SUFFICIENT' | 'INSUFFICIENT';
export type FindingClassification =
  | 'SUBSANABLE_ERROR' | 'LACK_OF_UPDATE' | 'ISOLATED_INCONSISTENCY' | 'VERIFIED_FALSE_INFO' | 'EXPRESS_REFUSAL';
export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ContractualMeasure = 'NONE' | 'WARNING' | 'PREVENTIVE_RESTRICTION' | 'SUSPENSION' | 'TERMINATION_REFERRAL';
export type AccountStatus =
  | 'REGISTRATION_STARTED' | 'PENDING_ACCEPTANCE' | 'PENDING_VERIFICATION' | 'PENDING_ACTIVATION'
  | 'ACTIVE' | 'PREVENTIVELY_RESTRICTED' | 'SUSPENDED' | 'TERMINATED';
export type AlertRuleType = 'PLATFORM_SALES_GROWTH';

export interface RequestItem {
  itemType: RequestItemType;
  documentType: CommercialDocumentType | null;
  fieldPath: string | null;
  establishmentId: number | null;
  description: string;
  acceptableResponse: string | null;
  linkedDocumentId: number | null;   // documento que ya existe en el expediente
}
export interface RequestResponse { message: string | null; documentIds: number[]; receivedAt: string }
export interface RequestReview { result: RequestReviewResult; notes: string | null; reviewedAt: string }
export interface RequestCommunication {
  channel: 'IN_APP' | 'EMAIL'; sentAt: string; deliveryStatus: 'SENT' | 'FAILED'; errorDetail: string | null;
}
export interface InformationRequest {
  publicId: string;
  commercialPublicId: string;
  companyName: string;
  trigger: InformationRequestTrigger;
  ruleCode: string | null;
  ruleVersion: number | null;
  reason: string;
  relationToOperation: string;
  status: InformationRequestStatus;
  dueDate: string | null;
  issuedBySystem: boolean;
  issuedAt: string;
  closedAt: string | null;
  closingNotes: string | null;
  items: RequestItem[];
  responses: RequestResponse[];
  reviews: RequestReview[];
  communications: RequestCommunication[]; // vacío en la vista del empresario
}

// Empresario
export interface RespondRequest { message?: string; documentIds?: number[] } // al menos uno de los dos

// Compliance
export interface ItemInput {
  itemType: RequestItemType;
  documentType?: CommercialDocumentType;   // obligatorio si DOCUMENT
  fieldPath?: string;                       // obligatorio si FIELD, máx 100
  establishmentId?: number;
  description: string;                      // obligatorio, máx 500
  acceptableResponse?: string;              // máx 500
}
export interface CreateInformationRequest {
  commercialPublicId: string;
  trigger: InformationRequestTrigger;
  reason: string;               // obligatorio, máx 1000
  relationToOperation: string;  // obligatorio, máx 1000
  dueDate?: string | null;
  items: ItemInput[];           // mínimo 1
  alertId?: number | null;
}
export interface ReviewInformationRequest { result: RequestReviewResult; notes?: string } // notes obligatorio si INSUFFICIENT
export interface CancelInformationRequest { reason: string }

export interface FindingRequest {
  commercialPublicId: string;
  requestPublicId?: string | null;
  factObserved: string;         // obligatorio, máx 2000
  evidence?: string;            // máx 2000
  classification: FindingClassification;
  severity: FindingSeverity;
  impact: string;               // obligatorio, máx 1000
  remediable: boolean;
  contractualBasis: string;     // obligatorio, máx 1000
  measure: ContractualMeasure;
  measureScope?: string;        // máx 500
}
export interface Finding {
  publicId: string; requestPublicId: string | null; factObserved: string; evidence: string | null;
  classification: FindingClassification; severity: FindingSeverity; impact: string; remediable: boolean;
  contractualBasis: string; measure: ContractualMeasure; measureScope: string | null;
  accountStatusApplied: AccountStatus | null; decidedAt: string;
}

export interface IncidentRequest {
  commercialPublicId: string; context: string; description: string; requestPublicId?: string | null;
}
export interface Incident {
  id: number; context: string; description: string; requestPublicId: string | null;
  manifestationId: number | null; reportedBySystem: boolean; occurredAt: string;
}

export interface AlertRuleRequest {
  code: string;                 // /^[A-Z0-9_]{3,50}$/
  ruleType: AlertRuleType;
  description: string;          // máx 500
  legalBasis: string;           // máx 500
  windowDays: number;           // >= 7
  minGrowthPct: number;         // >= 0.01
  minCurrentSalesCents: number; // >= 0
}
export interface AlertRule {
  id: number; code: string; version: number; ruleType: AlertRuleType; description: string;
  legalBasis: string; paramsJson: string; active: boolean; createdAt: string;
}
export interface Alert {
  id: number; ruleCode: string | null; ruleVersion: number | null; trigger: InformationRequestTrigger;
  commercialPublicId: string; companyName: string; detectedAt: string; dataUsedJson: string;
  message: string; reviewedAt: string | null; reviewNotes: string | null; requestPublicId: string | null;
}
export interface AlertReviewRequest { notes: string } // obligatorio, máx 1000
