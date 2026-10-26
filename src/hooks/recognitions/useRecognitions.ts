'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as AdminRecognitions from '@/services/admin/AdminRecognitionService';
import { getMyRecognitions } from '@/services/RecognitionService';
import { useAuth } from '@/hooks/useAuth';
import type { CandidatesParams, RecognitionListParams } from '@/types/recognitions/Recognition.types';

// Reconocimientos de VERYGANA.
export const recognitionKeys = {
  admin: ['admin', 'recognitions'] as const,
  fund: ['admin', 'recognitions', 'fund'] as const,
  list: (params: RecognitionListParams) => ['admin', 'recognitions', 'list', params] as const,
  detail: (publicId: string) => ['admin', 'recognitions', 'detail', publicId] as const,
  candidates: (params: CandidatesParams) => ['admin', 'recognitions', 'candidates', params] as const,
  mine: (page: number, size: number) => ['recognitions', 'me', page, size] as const,
};

export const RECOGNITIONS_PAGE_SIZE = 20;
export const CANDIDATES_PAGE_SIZE = 10;
export const MY_RECOGNITIONS_PAGE_SIZE = 10;

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useRecognitionFund() {
  return useQuery({
    queryKey: recognitionKeys.fund,
    queryFn: AdminRecognitions.getRecognitionFund,
    staleTime: 15_000,
  });
}

export function useAdminRecognitions(params: RecognitionListParams) {
  return useQuery({
    queryKey: recognitionKeys.list(params),
    queryFn: () => AdminRecognitions.getRecognitions(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useAdminRecognition(publicId: string | null) {
  return useQuery({
    queryKey: recognitionKeys.detail(publicId ?? ''),
    queryFn: () => AdminRecognitions.getRecognition(publicId!),
    enabled: !!publicId,
    staleTime: 15_000,
  });
}

export function useRecognitionCandidates(params: CandidatesParams, enabled = true) {
  return useQuery({
    queryKey: recognitionKeys.candidates(params),
    queryFn: () => AdminRecognitions.getRecognitionCandidates(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  });
}

// ─── Consumidor ──────────────────────────────────────────────────────────────

export function useMyRecognitions(page: number, size = MY_RECOGNITIONS_PAGE_SIZE) {
  const { role } = useAuth(false);
  return useQuery({
    queryKey: recognitionKeys.mine(page, size),
    queryFn: () => getMyRecognitions(page, size),
    enabled: role === 'CONSUMER',
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
