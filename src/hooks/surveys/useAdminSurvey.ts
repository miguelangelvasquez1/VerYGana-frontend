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
    queryFn:  () => surveyAdminService.getSurveyDetail(surveyId),
    enabled:  surveyId > 0,
    staleTime: 60_000,
  });
}

// ─── useAdminUpdateStatus ─────────────────────────────────────────────────────

/**
 * Changes the survey status.
 * On success:
 *  - updates the detail cache immediately (no extra fetch)
 *  - invalidates the list so the status badge refreshes
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
      queryClient.setQueryData(adminSurveyKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: adminSurveyKeys.lists() });
    },
  });
}