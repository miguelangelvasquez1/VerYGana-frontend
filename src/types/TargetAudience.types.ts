export type TargetGender = 'ALL' | 'MALE' | 'FEMALE';

export interface OptionalTargetAudienceDTO {
    municipalityCodes?: string[] | null;
    minAge?: number | null;
    maxAge?: number | null;
    targetGender?: TargetGender | null;
}

export interface TargetAudienceResponseDTO {
    municipalityCodes: string[];
    minAge: number | null;
    maxAge: number | null;
    targetGender: TargetGender | null;
}
