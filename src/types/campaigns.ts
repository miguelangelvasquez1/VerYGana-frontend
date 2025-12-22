// types/campaigns.ts

// ==================== Enums ====================

export enum AssetType {
  BANNER_IMAGE = 'BANNER_IMAGE',
  LOGO = 'LOGO',
  VIDEO_AD = 'VIDEO_AD',
  BACKGROUND_IMAGE = 'BACKGROUND_IMAGE',
  PRODUCT_IMAGE = 'PRODUCT_IMAGE',
  ICON = 'ICON',
  THUMBNAIL = 'THUMBNAIL',
  AUDIO_AD = 'AUDIO_AD',
  ANIMATED_BANNER = 'ANIMATED_BANNER'
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO'
}

export enum CampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

// ==================== Entidades ====================

export interface Game {
  id: number;
  title: string;
  description: string;
  frontPageUrl?: string;
  categoryId?: number;
}

export interface GameAssetDefinition {
  id: number;
  assetType: string;
  mediaType: MediaType;
  required: boolean;
  multiple: boolean;
  description: string;
}

export interface Asset {
  id: number;
  content: string; // URL pública
  assetType: AssetType;
  mediaType: MediaType;
  campaignId: number;
}

export interface Campaign {
  id: string | number;
  name: string;
  gameId?: number;
  advertiserId?: number;
  ads: any[];
  totalBudget: number;
  totalSpent: number;
  status: CampaignStatus;
  startDate: Date;
  endDate?: Date;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  assets?: Asset[];
  active?: boolean;
}

// ==================== DTOs de Request ====================

export interface FileUploadRequest {
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface CreateAssetRequest {
  assetDefinitionId: number;
  fileMetadata: FileUploadRequest;
}

export interface CreateCampaignRequest {
  gameId: number;
  assets: CreateAssetRequest[];
}

// ==================== DTOs de Response ====================

export interface AssetUploadPermission {
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export interface CampaignResponse {
  id: number;
  gameId: number;
  advertiserId: number;
  active: boolean;
  assets: Asset[];
  createdAt: string;
  updatedAt: string;
}

// ==================== UI State ====================

export interface FileWithPreview {
  file: File;
  preview: string;
  definitionId: number;
  uploading: boolean;
  uploaded: boolean;
  progress: number;
  error?: string;
  objectKey?: string;
}

export interface UploadState {
  status: 'idle' | 'preparing' | 'uploading' | 'creating' | 'success' | 'error';
  progress: number;
  currentFile?: string;
  error?: string;
}

// ==================== Validación ====================

export const ACCEPTED_FILE_TYPES: Record<MediaType, string[]> = {
  [MediaType.IMAGE]: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  [MediaType.VIDEO]: ['video/mp4', 'video/webm', 'video/quicktime'],
  [MediaType.AUDIO]: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
};

export const MAX_FILE_SIZES = {
  [MediaType.IMAGE]: 10 * 1024 * 1024,  // 10 MB
  [MediaType.VIDEO]: 100 * 1024 * 1024, // 100 MB
  [MediaType.AUDIO]: 20 * 1024 * 1024   // 20 MB
} as const;

// ==================== Helpers ====================

export function getAcceptedTypes(mediaType: MediaType): string {
  return ACCEPTED_FILE_TYPES[mediaType].join(',');
}

export function isValidFileType(file: File, mediaType: MediaType): boolean {
  return ACCEPTED_FILE_TYPES[mediaType].includes(file.type);
}

export function isValidFileSize(file: File, mediaType: MediaType): boolean {
  return file.size <= MAX_FILE_SIZES[mediaType];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function getMaxSizeLabel(mediaType: MediaType): string {
  const maxSize = MAX_FILE_SIZES[mediaType];
  return formatFileSize(maxSize);
}

export function getAcceptedFormatsLabel(mediaType: MediaType): string {
  switch (mediaType) {
    case MediaType.IMAGE:
      return 'PNG, JPG, GIF, WEBP';
    case MediaType.VIDEO:
      return 'MP4, WEBM';
    case MediaType.AUDIO:
      return 'MP3, WAV, OGG';
    default:
      return '';
  }
}