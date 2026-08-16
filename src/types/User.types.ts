import { PlanSummaryResponseDTO } from "./finance/plans/Plan.types";
import { KeyWalletResponseDTO } from "./finance/Wallet.types";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export enum Role {
  CONSUMER = 'CONSUMER',
  COMMERCIAL = 'COMMERCIAL',
  ADMIN = 'ADMIN',
  GAME_DESIGNER = 'GAME_DESIGNER',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER'
}

export enum UserState {
  PENDING_EMAIL = 'PENDING_EMAIL',
  PENDING_KYC_REVIEW = 'PENDING_KYC_REVIEW',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}

export enum DocumentType {
  CC = 'CC',
  CE = 'CE',
  PP = 'PP'
}

export enum IncomeRange {
  LESS_THAN_1_SMMLV = 'LESS_THAN_1_SMMLV',
    FROM_1_TO_3_SMMLV = 'FROM_1_TO_3_SMMLV',
    FROM_3_TO_10_SMMLV = 'FROM_3_TO_10_SMMLV',
    MORE_THAN_10_SMMLV = 'MORE_THAN_10_SMMLV'
}

export enum AnnualRevenueRange {
  LESS_THAN_500_SMMLV = 'LESS_THAN_500_SMMLV',
  FROM_500_SMMLV_TO_5000_SMMLV = 'FROM_500_SMMLV_TO_5000_SMMLV',
  FROM_5000_TO_50000_SMMLV = 'FROM_5000_TO_50000_SMMLV',
  MORE_THAN_50000_SMMLV = 'MORE_THAN_50000_SMMLV'
}

export interface UserSummaryResponseDTO {
  publicId: string;
  role: Role;
  email: string;
  userState: UserState;
}

export enum UserLevel {
  BRONCE = 'BRONCE',
  PLATA = 'PLATA',
  ORO = 'ORO',
  RUBI = 'RUBI',
  ESMERALDA = 'ESMERALDA',
  DIAMANTE = 'DIAMANTE'
}

export interface ConsumerSummaryResponseDTO extends UserSummaryResponseDTO {
  userName: string;
  name: string;
  lastName: string;
  departmentName: string;
  municipalityName: string;
  age: number;
  gender: Gender;
  lastDailyLoginDate: string;
}

export interface ConsumerResponseDTO extends UserSummaryResponseDTO {
  phoneNumber: string;
  registeredDate: string;
  failedLoginAttempts: number;
  accountLockedAt: string;
  userName: string;
  keyWallet: KeyWalletResponseDTO;
  adsWatched: number;
  hasPet: boolean;
  referralCode: string;
  avatarUrl: string;
  name: string;
  lastName: string;
  departmentName: string;
  municipalityName: string;
  age: number;
  gender: Gender;
  lastDailyLoginDate: string;
  referredBy: number | null;
  documentType: DocumentType;
  documentNumber: string;
  occupation: string;
  monthlyIncomeRange: IncomeRange;
  pep: boolean;
}

export interface AdminSummaryResponseDTO extends UserSummaryResponseDTO {
  adminCode: string;
}

export interface AdminResponseDTO extends UserSummaryResponseDTO {
  phoneNumber: string;
  registeredDate: string;
  failedLoginAttempts: number;
  accountLockedAt: string;
  adminCode: string;
}

export interface CommercialSummaryResponseDTO extends UserSummaryResponseDTO {
  companyName: string;
  nit: string;
  departmentName: string;
  municipalityName: string;
  currentPlan: PlanSummaryResponseDTO;
}

export interface CommercialResponseDTO extends UserSummaryResponseDTO {
  phoneNumber: string;
  registeredDate: string;
  failedLoginAttempts: number;
  accountLockedAt: string;
  companyName: string;
  nit: string;
  ciiuCode: string;
  mercantileRegistration : string | null;
  legalRepDocType: DocumentType;
  legalRepDocNumber : string;
  pep: boolean;
  annualIncomeRange: AnnualRevenueRange;
  departmentName: string;
  municipalityName: string;
  currentPlan: PlanSummaryResponseDTO;
}

export interface GameDesignerSummaryResponseDTO extends UserSummaryResponseDTO {
  name: string;
  lastName: string;
}

export interface GameDesignerResponseDTO extends UserSummaryResponseDTO {
  phoneNumber: string;
  registeredDate: string;
  failedLoginAttempts: number;
  accountLockedAt: string;
  name: string;
  lastName: string;
  designerCode: string;
  bio: string;
  campaignsDesigned: number;
  joinedAt: string;
}

export interface ComplianceOfficerSummaryResponseDTO extends UserSummaryResponseDTO {
  name: string;
  lastName: string;
}

export interface ComplianceOfficerResponseDTO extends UserSummaryResponseDTO {
  phoneNumber: string;
  registeredDate: string;
  failedLoginAttempts: number;
  accountLockedAt: string;
  name: string;
  lastName: string;
  badgeNumber: string;
}

export interface EditBasicInfoRequestDTO {
  email : string;
  phoneNumber : string;
}

export interface SendNotificationRequestDTO {
  publicIds : string[];
  message : string;
}