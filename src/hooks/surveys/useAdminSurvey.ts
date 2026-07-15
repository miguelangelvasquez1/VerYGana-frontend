import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  surveyAdminService,
  SurveyApiError,
} from '@/services/surveyService';
import type { SurveyStatus } from '@/types/survey.types';

export { SurveyApiError }

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminSurveyKeys = {
  all:     ['admin', 'surveys'] as const,
  lists:   () => [...adminSurveyKeys.all, 'list'] as const,
  list:    (page: number, size: number, status?: SurveyStatus) =>
             [...adminSurveyKeys.lists(), { page, size, status }] as const,
  details: () => [...adminSurveyKeys.all, 'detail'] as const,
  detail:  (id: number) => [...adminSurveyKeys.details(), id] as const,
} as const;

// ─── useAdminSurveyList ───────────────────────────────────────────────────────

/**
 * Paginated survey list for the system-admin panel.
 * Keeps previous data while fetching to avoid flicker on filter/page change.
 */
export function useAdminSurveyList(
  page = 0,
  size = 15,
  status?: SurveyStatus,
) {
  return useQuery({
    queryKey:        adminSurveyKeys.list(page, size, status),
    queryFn:         () => surveyAdminService.getSurveys(page, size, status),
    placeholderData: keepPreviousData,
    staleTime:       20_000,
  });
}

// ─── useAdminSurveyDetail ─────────────────────────────────────────────────────

/**
 * Full survey detail: metadata, targeting, and all questions with options.
 * Only fetches when surveyId > 0.
 */
export function useAdminSurveyDetail(surveyId: number) {
  return useQuery({
    queryKey: adminSurveyKeys.detail(surveyId),
    queryFn:  () => surveyAdminService.getSurveyAdminDetail(surveyId),
    enabled:  surveyId > 0,
    staleTime: 60_000,
  });
}

// ─── useAdminUpdateStatus ─────────────────────────────────────────────────────

/**
 * Changes the survey status.
 * On success invalidates both the detail and the list so they refetch.
 *
 * Note: `publishSurvey`/`updateStatus` return the lighter `SurveyResponse`
 * shape, not the full `SurveyAdminDetailDTO` that the detail page uses
 * (which has `totalQuestions`, `totalBudgetCents`, etc.). Writing that
 * response straight into the detail cache via `setQueryData` used to
 * corrupt it — the detail page would render `undefined`/`NaN` for the
 * fields the mutation response doesn't have until a full page reload
 * bypassed the stale cache. Invalidating instead forces a real refetch
 * with the correct shape.
 */
export function useAdminUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      surveyId,
      status,
    }: {
      surveyId: number;
      status: SurveyStatus;
    }) =>
      status === 'ACTIVE'
        ? surveyAdminService.publishSurvey(surveyId)
        : surveyAdminService.updateStatus(surveyId, status),

    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: adminSurveyKeys.detail(updated.id) });
      queryClient.invalidateQueries({ queryKey: adminSurveyKeys.lists() });
    },
  });
}