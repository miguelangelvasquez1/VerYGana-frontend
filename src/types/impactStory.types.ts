// ─── Enums ───────────────────────────────────────────────────────────────────

export type StoryStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MediaType = 'IMAGE' | 'VIDEO';

/** Estado de subida de un archivo individual al CDN */
export type MediaUploadStatus =
  | 'idle'       // archivo añadido, aún no se hace nada
  | 'preparing'  // solicitando pre-signed URL al backend
  | 'uploading'  // subiendo bytes a R2
  | 'done'       // subida confirmada, mediaAssetId disponible
  | 'error';     // falló en algún paso

// ─── Media Response (desde el backend) ───────────────────────────────────────

export interface StoryMediaResponse {
  id: number;
  mediaType: MediaType;
  publicUrl: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  thumbnailUrl?: string;
  altText?: string;
  displayOrder: number;
  isCover: boolean;
  uploadedAt: string;
}

// ─── Media Request (hacia el backend al crear la historia) ───────────────────

export interface CreateStoryMediaRequest {
  /** ID del asset devuelto por /media/prepare-upload tras subir el archivo a R2 */
  mediaAssetId: string;
  mediaType: MediaType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  altText?: string;
  displayOrder: number;
  isCover: boolean;
}

// ─── Impact Story ─────────────────────────────────────────────────────────────

export interface ImpactStoryResponse {
  id: number;
  title: string;
  description: string;
  storyDate: string;
  beneficiariesCount: number;
  investedAmount: number;
  investedCurrency: string;
  location?: string;
  category?: string;
  status: StoryStatus;
  authorName?: string;
  tags?: string;
  mediaFiles: StoryMediaResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateImpactStoryRequest {
  title: string;
  description: string;
  storyDate: string;
  beneficiariesCount: number;
  investedAmount: number;
  investedCurrency: string;
  location?: string;
  category?: string;
  status: StoryStatus;
  authorName?: string;
  tags?: string;
  /** Assets ya subidos a R2, referenciados por mediaAssetId */
  mediaFiles: CreateStoryMediaRequest[];
}

export interface UpdateImpactStoryRequest extends Partial<CreateImpactStoryRequest> {
  id: number;
}

// ─── Pagination / List ───────────────────────────────────────────────────────

export interface ImpactStoryListResponse {
  content: ImpactStoryResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ImpactStoryFilters {
  page?: number;
  size?: number;
  status?: StoryStatus;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ─── Local form state (antes y durante el submit) ─────────────────────────────

export interface MediaFilePreview {
  /** ID local temporal */
  id: string;
  /** Archivo original. Undefined si viene de initialData (ya subido) */
  file?: File;
  mediaType: MediaType;
  /** Object URL para preview local, o URL pública del CDN si ya está subido */
  previewUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  altText: string;
  displayOrder: number;
  isCover: boolean;

  // ── Estado de subida ─────────────────────────────────────────────────────
  uploadStatus: MediaUploadStatus;
  uploadProgress: number;           // 0–100
  /** Disponible una vez uploadStatus === 'done' */
  mediaAssetId?: string;
  /** URL pública del CDN devuelta tras el prepare-upload */
  publicUrl?: string;
  uploadError?: string;
}

export interface ImpactStoryFormValues {
  title: string;
  description: string;
  storyDate: string;
  beneficiariesCount: number | '';
  investedAmount: number | '';
  investedCurrency: string;
  location: string;
  category: string;
  status: StoryStatus;
  authorName: string;
  tags: string;
  mediaFiles: MediaFilePreview[];
}