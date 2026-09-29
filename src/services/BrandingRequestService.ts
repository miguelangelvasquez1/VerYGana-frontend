import apiClient from '@/lib/api/client';

export type BrandingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DESIGN_IN_PROGRESS'
  | 'PENDING_ADVERTISER_APPROVAL'
  | 'CHANGES_REQUESTED'
  | 'CAMPAIGN_CREATED'
  | 'CANCELLED';

export interface BrandingRequest {
  id: number;
  brandName: string;
  gameName: string;
  status: BrandingStatus;
  budgetCents: number;
  scoreRewardFactor: number | null;
  averageRewardPerSessionCents: number | null;
  estimatedSessions: number | null;
  adminNotes: string | null;
  assignedDesignerName: string | null;
  corporateResourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandingDto {
  gameId: number;
  brandName: string;
  brandDescription: string;
  targetUrl?: string;
  budgetCents: number;
  campaignGoal?: string;
}

export interface UploadUrlDto {
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface UploadUrlResponse {
  resourceId: number;
  temporalUrl: string;
  permission: {
    uploadUrl: string;
    expiresInSeconds: number;
  };
}

export interface BrandingConfigDto {
  categoryIds?: number[];
  municipalityCodes?: string[];
  minAge?: number;
  maxAge?: number;
  targetGender?: 'MALE' | 'FEMALE' | 'ALL';
  maxSessionsPerUserPerDay?: number;
  startDate?: string | null;
}

export interface Department {
  code: string;
  name: string;
}

// ─── Game catalog ────────────────────────────────────────────────────────────

export interface BrandingGame {
  id: number;
  title: string;
  description: string;
  frontPageUrl: string;
  url: string;
  averageRewardPerSessionCents: number | null;
  averageDurationSeconds: number | null;
}

export interface BrandingGamesPage {
  content: BrandingGame[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export const getBrandingGames = async (page = 0, size = 12, signal?: AbortSignal): Promise<BrandingGamesPage> => {
  const { data } = await apiClient.get('/branding-requests/games', {
    params: { page, size, sort: 'title,asc' },
    signal,
  });
  return data;
};

// ─── Contenido del juego (brief del anunciante) ──────────────────────────────

/**
 * Lo que un juego le pide al anunciante, en las dos formas en que puede pedirlo.
 *
 * El texto que escribe la marca —las preguntas de la trivia, las palabras de la
 * sopa de letras— viene como esquema y se pinta con el mismo RJSF que el formulario
 * del diseñador. Las imágenes no: esas se suben como recursos corporativos, que son
 * privados y temporales a propósito, porque el diseñador audita que el contenido sea
 * apropiado y esté en calidad antes de publicarlo como asset del juego. Por eso acá
 * llegan como un mínimo de archivos, no como campos del formulario.
 */
export interface GameBriefRequirements {
  gameId: number;
  gameName: string;
  /** Nulos si el juego no pide texto: el paso del formulario no se muestra. */
  jsonSchema: Record<string, unknown> | null;
  uiSchema: Record<string, unknown> | null;
  /** Cero si el juego no exige archivos del anunciante. */
  requiredResourceCount: number;
  requiredResourceLabel: string | null;
}

export const getBriefRequirements = async (
  gameId: number,
  signal?: AbortSignal,
): Promise<GameBriefRequirements> => {
  const { data } = await apiClient.get(`/branding-requests/games/${gameId}/brief-schema`, { signal });
  return data;
};

/** Se valida contra el esquema en el backend: un contenido incompleto no se guarda. */
export const saveBrief = async (requestId: number, content: Record<string, unknown>): Promise<void> => {
  await apiClient.patch(`/branding-requests/${requestId}/brief`, { content });
};

// ─── Commercial ──────────────────────────────────────────────────────────────

export const createBrandingRequest = async (dto: CreateBrandingDto): Promise<BrandingRequest> => {
  const { data } = await apiClient.post('/branding-requests', dto);
  return data;
};

export const getUploadUrl = async (requestId: number, dto: UploadUrlDto): Promise<UploadUrlResponse> => {
  const { data } = await apiClient.post(
    `/branding-requests/${requestId}/corporate-resources/upload-url`,
    dto
  );
  return data;
};

export const uploadFileToR2 = async (uploadUrl: string, file: File): Promise<void> => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
};

export const confirmUpload = async (requestId: number, resourceId: number): Promise<void> => {
  await apiClient.post(`/branding-requests/${requestId}/corporate-resources/confirm`, { resourceId });
};

export const configureBranding = async (requestId: number, dto: BrandingConfigDto): Promise<void> => {
  await apiClient.patch(`/branding-requests/${requestId}/config`, dto);
};

export const submitBrandingRequest = async (requestId: number, notes?: string): Promise<void> => {
  await apiClient.post(`/branding-requests/${requestId}/submit`, notes ? { notes } : undefined);
};

/**
 * POST /branding-requests/:id/cancel (rol COMMERCIAL)
 * Solo funciona si la solicitud está en DRAFT (400 en cualquier otro estado).
 * Devuelve el budgetCents completo a la wallet y borra los corporate
 * resources ya subidos (CDN + BD).
 */
export const cancelBrandingRequest = async (requestId: number): Promise<void> => {
  await apiClient.post(`/branding-requests/${requestId}/cancel`);
};

export interface BrandingCategory {
  id: number;
  name: string;
}

export interface BrandingMunicipality {
  code: string;
  name: string;
  departmentCode: string;
  departmentName: string;
}

export interface BrandingCorporateResource {
  id: number;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  status: 'VALIDATED' | 'PENDING' | 'ORPHANED';
  temporalUrl?: string;
  createdAt: string;
}

export interface BrandingRequestDetail {
  id: number;
  status: BrandingStatus;
  brandName: string;
  brandDescription: string;
  targetUrl: string | null;
  gameId: number;
  gameName: string;
  gameFrontPageUrl: string;
  budgetCents: number;
  scoreRewardFactor: number | null;
  averageRewardPerSessionCents: number | null;
  estimatedSessions: number | null;
  completionRewardCents: number | null;
  maxRewardPerSessionCents: number | null;
  maxSessionsPerUserPerDay: number | null;
  startDate: string | null;
  endDate: string | null;
  categories: BrandingCategory[];
  targetMunicipalities: BrandingMunicipality[];
  minAge: number | null;
  maxAge: number | null;
  targetGender: 'ALL' | 'MALE' | 'FEMALE' | null;
  adminNotes: string | null;
  reviewedByAdminName: string | null;
  assignedDesignerName: string | null;
  assignedDesignerCode: string | null;
  corporateResources: BrandingCorporateResource[];
  campaignGoal: string | null;
  hasCompleteTargeting: boolean;
  campaignId: number | null;
  /** El contenido del juego ya guardado, para repintar el formulario sin volver a pedirlo. */
  briefData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export const getMyBrandingRequests = async (signal?: AbortSignal): Promise<BrandingRequest[]> => {
  const { data } = await apiClient.get('/branding-requests', { signal });
  return data;
};

export const getBrandingRequestDetail = async (id: number, signal?: AbortSignal): Promise<BrandingRequestDetail> => {
  const { data } = await apiClient.get(`/branding-requests/${id}`, { signal });
  return data;
};

export const getCampaignGoals = async (signal?: AbortSignal): Promise<string[]> => {
  const { data } = await apiClient.get('/branding-requests/campaign-goals', { signal });
  return data;
};

export const getCategories = async (signal?: AbortSignal): Promise<BrandingCategory[]> => {
  const { data } = await apiClient.get('/categories/all', { signal });
  return data;
};

export const getDepartments = async (signal?: AbortSignal): Promise<Department[]> => {
  const { data } = await apiClient.get('/locations/departments', { signal });
  return data;
};

export const getDepartmentMunicipalities = async (
  departmentCode: string
): Promise<BrandingMunicipality[]> => {
  const { data } = await apiClient.get(
    `/locations/departments/${departmentCode}/municipalities`
  );
  return data;
};

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminBrandingRequestSummary {
  id: number;
  brandName: string;
  gameName: string;
  commercialName: string;
  status: BrandingStatus;
  budgetCents: number;
  estimatedSessions: number | null;
  adminNotes: string | null;
  assignedDesignerName: string | null;
  corporateResourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBrandingRequestDetail {
  id: number;
  status: BrandingStatus;
  commercialName: string;
  brandName: string;
  brandDescription: string;
  targetUrl: string | null;
  gameId: number;
  gameName: string;
  gameFrontPageUrl: string;
  budgetCents: number;
  scoreRewardFactor: number | null;
  averageRewardPerSessionCents: number | null;
  estimatedSessions: number | null;
  completionRewardCents: number | null;
  maxRewardPerSessionCents: number | null;
  campaignGoal: string | null;
  maxSessionsPerUserPerDay: number | null;
  startDate: string | null;
  categories: BrandingCategory[];
  targetMunicipalities: BrandingMunicipality[];
  minAge: number | null;
  maxAge: number | null;
  targetGender: 'ALL' | 'MALE' | 'FEMALE' | null;
  adminNotes: string | null;
  reviewedByAdminName: string | null;
  assignedDesignerName: string | null;
  assignedDesignerCode: string | null;
  corporateResources: BrandingCorporateResource[];
  hasCompleteTargeting: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Designer {
  id: number;
  userId: number;
  name: string;
  lastName: string;
  designerCode: string;
  campaignsDesigned: number;
}

export const adminGetBrandingRequests = async (): Promise<AdminBrandingRequestSummary[]> => {
  const { data } = await apiClient.get('/api/admin/branding-requests');
  return data;
};

export const adminGetBrandingRequestDetail = async (
  id: number,
  signal?: AbortSignal
): Promise<AdminBrandingRequestDetail> => {
  const { data } = await apiClient.get(`/api/admin/branding-requests/${id}`, { signal });
  return data;
};

export const adminGetDesigners = async (): Promise<Designer[]> => {
  const { data } = await apiClient.get('/api/admin/branding-requests/designers');
  return data;
};

export const adminApproveBranding = async (
  id: number,
  designerUserId: number,
  adminNotes?: string
): Promise<void> => {
  await apiClient.patch(`/api/admin/branding-requests/${id}/approve`, {
    designerUserId,
    adminNotes: adminNotes || undefined,
  });
};

export const adminRejectBranding = async (id: number, adminNotes: string): Promise<void> => {
  await apiClient.patch(`/api/admin/branding-requests/${id}/reject`, { adminNotes });
};

export const adminAssignDesigner = async (id: number, designerUserId: number): Promise<void> => {
  await apiClient.patch(`/api/admin/branding-requests/${id}/assign-designer`, { designerUserId });
};

export const approveDesign = async (requestId: number): Promise<void> => {
  await apiClient.post(`/branding-requests/${requestId}/approve-design`);
};

export const requestDesignChanges = async (requestId: number): Promise<void> => {
  await apiClient.post(`/branding-requests/${requestId}/request-design-changes`);
};

export const getCommercialPreviewUrl = async (id: number): Promise<string> => {
  const { data } = await apiClient.get(`/branding-requests/${id}/preview-url`);
  return data.url;
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface BrandingComment {
  id: number;
  content: string;
  authorName: string;
  authorRole: 'COMMERCIAL' | 'DESIGNER';
  relatedStatus: string;
  createdAt: string;
}

export const getCommercialComments = async (id: number, signal?: AbortSignal): Promise<BrandingComment[]> => {
  const { data } = await apiClient.get(`/branding-requests/${id}/comments`, { signal });
  return data;
};

export const postCommercialComment = async (id: number, content: string): Promise<BrandingComment> => {
  const { data } = await apiClient.post(`/branding-requests/${id}/comments`, { content });
  return data;
};
