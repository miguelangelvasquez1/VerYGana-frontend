import { LargeNumberLike } from "crypto";

export interface AssetDTO {
  id: number;
  content: string;
  assetType: 'LOGO' | 'BANNER' | 'ICON' | 'THUMBNAIL' | 'BACKGROUND' | 'SPRITE';
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT' | 'COLOR';
}

export interface GameDTO {
  id: number;
  title: string;
  description: string;
  frontPageUrl: string;
}

export interface GameCardResponseDTO {
  id: number;
  title: string;
  imageUrl: string;
  sponsored: boolean;
  rewardText?: string; // ej: "Gana hasta $500"
}

export interface GameAssetDefinitionDTO {
  id: number;
  assetType : 'LOGO' | 'BANNER' | 'ICON' | 'THUMBNAIL' | 'BACKGROUND' | 'SPRITE';
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT' | 'COLOR';
  required : boolean;
  multiple : boolean;
  description : string;
}

export interface InitGameRequestDTO {
  gameId: number;
  sponsored: boolean;
}

export interface InitGameResponseDTO {
  sessionToken: string;
  userHash: string;
  gameId: number;
  campaignId: number;
  assets: AssetDTO[];
  jsonConfig: string;
}

export interface GameEventDTO<T> {
  sessionToken: string;
  userHash: string;
  payload: T;
}

export interface GameMetricDTO {
  key: string;
  type : 'INT' | 'DECIMAL' | 'BOOLEAN' | 'STRING' | 'DOUBLE';
  value : object;
  technicalData : string;
}

export interface EndSessionDTO {
  devicePlatform : 'PC' | 'MOBILE' | 'TABLET';
  finalScore: number;
  finalMetrics: GameMetricDTO[];
}