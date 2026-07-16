import { CategoryResponseDTO } from "@/types/Category.types";

export type DocumentType = "CC" | "CE" | "PP";

export type IncomeRange =
  | "LESS_THAN_1_SMMLV"
  | "FROM_1_TO_3_SMMLV"
  | "FROM_3_TO_10_SMMLV"
  | "MORE_THAN_10_SMMLV";

export interface RegisterConsumerDTO {
  email: string;
  password: string;
  phoneNumber: string;
  name: string;
  lastName: string;
  department: string;
  municipalityCode: string;
  categories?: CategoryResponseDTO[];
  avatarId: number;
  referredByCode?: string;
  birthDate: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  userName: string;
  documentType: DocumentType;
  documentNumber: string;
  occupation?: string;
  incomeRange?: IncomeRange;
  isPEP: boolean;
}

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface ConsumerInitialDataResponseDTO {
    id : number;
    name : string;
    totalAvailableKeys : number;
    purchaseKeys : number;
    connectivityKeys : number;
    blockedPurchaseKeys : number;
    blockedConnectivityKeys : number;
    avatarUrl: string | null
}

export interface ConsumerProfileResponseDTO {
    id : number;
    name : string;
    lastName : string;
    email : string;
    phoneNumber : string;
    role : string;
    userState : string;
    department : string;
    municipalityName : string;
}

export interface ConsumerUpdateProfileRequestDTO {
    email ?: string;
    phoneNumber ?: string;
    department ?: string;
    municipalityName ?: string;
}
