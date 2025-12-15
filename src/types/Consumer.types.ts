import { CategoryResponseDTO } from "@/types/Category.types";
export interface RegisterConsumerDTO {
  email: string;
  password: string;
  phoneNumber: string;
  name: string;
  lastName: string;
  department: string;
  municipality: string;
  categories?: CategoryResponseDTO[];
}

export interface ConsumerInitialDataResponseDTO {
    id : number;
    name : string;
    walletAvailableBalance : number;
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
    municipality : string;
}

export interface ConsumerUpdateProfileRequestDTO {
    email ?: string;
    phoneNumber ?: string;
    department ?: string;
    municipality ?: string;
}
