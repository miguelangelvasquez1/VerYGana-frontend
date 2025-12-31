// types/campaigns.ts

import { MunicipalityDTO } from "@/services/LocationService";
import { Category } from "./Category.types";

// ==================== Enums ====================

export const MIME_TYPE_MAP: Record<string, string> = {
  IMAGE_PNG: 'image/png',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_WEBP: 'image/webp',
  AUDIO_MP3: 'audio/mpeg',
  AUDIO_OGG: 'audio/ogg',
  VIDEO_MP4: 'video/mp4',
};

export type SupportedMimeType =
  | 'IMAGE_PNG'
  | 'IMAGE_JPEG'
  | 'IMAGE_WEBP'
  | 'AUDIO_MP3'
  | 'AUDIO_OGG'
  | 'VIDEO_MP4';

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
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
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
  allowedMimeTypes: SupportedMimeType[];
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
  id: number;
  gameId: number;
  gameTitle: string;
  budget: number;
  spent: number;
  sessionsPlayed: number;
  completedSessions: number;
  totalPlayTimeSeconds: number;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  // 🔽 Edit modal
  targetUrl: string | null;
  categories: Category[];
  minAge: number;
  maxAge: number;
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
  targetMunicipalities: MunicipalityDTO[];
}

// ==================== DTOs de Request ====================

export interface CreateCampaignRequest {
  gameId: number;
  assets: CreateAssetRequest[];
}

export interface CreateAssetRequest {
  assetDefinitionId: number;
  fileMetadata: FileUploadRequest;
}

export interface FileUploadRequest {
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface CampaignDetails {
  budget: number;
  targetUrl: string | null;
  categoryIds: number[];
  targetAudience: {
    minAge: number;
    maxAge: number;
    gender: 'ALL' | 'MALE' | 'FEMALE';
    municipalityCodes: string[];
  };
}

// ==================== DTOs de Response ====================

export interface AssetUploadPermission {
  assetId: number;
  permission: FileUploadPermission;
}

export interface FileUploadPermission {
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export type PrepareCampaignResponse = Record<number, FileUploadPermission>;


/**
 * DTO que retorna el backend después de preparar un asset
 * Contiene el ID del asset creado y las URLs para subir
 */
export interface FileUploadPermissionDTO {
  assetId: number;           // ID del asset creado en BD
  uploadUrl: string;         // URL pre-firmada para PUT
  publicUrl: string;         // URL pública final del asset
  expiresInSeconds: number;  // Tiempo de expiración de uploadUrl
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
  assetId?: number;  // ID del asset una vez creado
}

export interface UploadState {
  status: 'idle' | 'preparing' | 'uploading' | 'creating' | 'success' | 'error';
  progress: number;
  currentFile?: string;
  error?: string;
}

// ==================== Validación ====================

export const ACCEPTED_FILE_TYPES: Record<MediaType, readonly string[]> = {
  [MediaType.IMAGE]: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  [MediaType.VIDEO]: ['video/mp4', 'video/webm', 'video/quicktime'],
  [MediaType.AUDIO]: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
};

export const MAX_FILE_SIZES: Record<MediaType, number> = {
  [MediaType.IMAGE]: 10 * 1024 * 1024,  // 10 MB
  [MediaType.VIDEO]: 100 * 1024 * 1024, // 100 MB
  [MediaType.AUDIO]: 20 * 1024 * 1024   // 20 MB
};

// ==================== Helpers ====================

export function getAcceptedTypes(mediaType: MediaType): string {
  return ACCEPTED_FILE_TYPES[mediaType].join(',');
}

export function isValidFileType(file: File, allowedMimeTypes: string[]): boolean {
  return allowedMimeTypes.map((t) => MIME_TYPE_MAP[t]).includes(file.type);
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