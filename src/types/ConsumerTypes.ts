
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

export interface EntityUpdatedResponse {
    id: number;
    message: string;
    timestamp: string;
}