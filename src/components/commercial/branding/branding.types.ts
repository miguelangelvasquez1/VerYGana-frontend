export type FileStatus = 'uploading' | 'confirmed' | 'error';

export interface FileEntry {
  localId: string;
  file: File;
  status: FileStatus;
  resourceId?: number;
  error?: string;
}

export interface Step1Form {
  brandName: string;
  brandDescription: string;
  targetUrl: string;
  budgetPesos: string;
}

export interface Step3Form {
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
  minAge: string;
  maxAge: string;
  maxSessionsPerUserPerDay: string;
  startDate: string;
  campaignGoal: string;
  categoryIds: number[];
  municipalityCodes: string[];
}
