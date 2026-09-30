export interface AllyPromotionResponseDTO {
    productId: number;
    productName: string;
    productImageUrl: string;
    allyCommercialPublicId: string;
    allyCommercialName: string;
    priceCents: number;
    promotedAt: string;
}

export interface AllyCommercialResponseDTO {
    commercialPublicId: string;
    companyName: string;
    planCode: string;
}

