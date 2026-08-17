export interface AllyPromotionResponseDTO {
    productId: number;
    productName: string;
    productImageUrl: string;
    allyCommercialId: number;
    allyCommercialName: string;
    priceCents: number;
    promotedAt: string;
}

export interface AllyCommercialResponseDTO {
    commercialId: number;
    companyName: string;
    planCode: string;
}

