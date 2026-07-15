import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { surveyAdminService, surveyService } from '@/services/surveyService';
import { surveyKeys } from './surveyKeys';
import { consumerKeys } from '@/hooks/consumer/useConsumerData';
import type { SubmitSurveyRequest } from '@/types/survey.types';

// ─── Available surveys (ranked by profile match) ──────────────────────────────

/**
 * Paginated list of active surveys sorted by how many of the user's
 * profile attributes (categories, municipality, age, gender) match
 * each survey's targeting criteria.
 *
 * Uses keepPreviousData so pagination doesn't cause content flicker.
 */
export function useAvailableSurveys(page = 0, size = 10) {
  return useQuery({
    queryKey: surveyKeys.list(page, size),
    queryFn: () => surveyService.getAvailableSurveys(page, size),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ─── Survey detail ────────────────────────────────────────────────────────────

/**
 * Full survey with all questions. The server validates the user
 * hasn't already completed this survey (returns 409 if so).
 */
export function useSurveyDetail(surveyId: number, submitted = false) {
  return useQuery({
    queryKey: surveyKeys.detail(surveyId),
    queryFn: () => surveyService.getSurveyDetail(surveyId),
    // Disable entirely if id is invalid OR the survey was just submitted.
    // This prevents TanStack Query from refetching while the completion
    // screen is still visible inside the mounted SurveyPlayerModal.
    enabled: surveyId > 0 && !submitted,
    staleTime: 60_000,
    retry: (failureCount, error: unknown) => {
      if (
        error instanceof Error &&
        'status' in error &&
        (error as { status: number }).status === 409
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// ─── Start survey session ─────────────────────────────────────────────────────

/**
 * Creates (or resumes) an active session for a survey.
 * Returns sessionId, expiresAt, and the full survey with questions.
 */
export function useStartSurvey() {
  return useMutation({
    mutationFn: (surveyId: number) => surveyService.startSurvey(surveyId),
  });
}

// ─── Submit survey ────────────────────────────────────────────────────────────

/**
 * Submits all answers in one request and collects the reward.
 * surveyId is passed separately for cache invalidation only (not sent to API).
 */
export function useSubmitSurvey(surveyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitSurveyRequest) =>
      surveyService.submitSurvey(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surveyKeys.lists() });
      queryClient.removeQueries({ queryKey: surveyKeys.detail(surveyId) });
      queryClient.invalidateQueries({ queryKey: surveyKeys.rewards() });
      // La recompensa se acredita en llaves — refresca el contador del navbar.
      queryClient.invalidateQueries({ queryKey: consumerKeys.data() });
    },
  });
}

// ─── Rewards summary ──────────────────────────────────────────────────────────

/**
 * User's total rewards earned and recent reward history.
 * Shown in the RewardsBanner component at the top of the surveys page.
 */
export function useRewardsSummary() {
  return useQuery({
    queryKey: surveyKeys.rewardsSummary(),
    queryFn: surveyService.getRewardsSummary,
    staleTime: 60_000,
  }); 
}