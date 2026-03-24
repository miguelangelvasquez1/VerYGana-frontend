import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { surveyAdminService } from '@/services/surveyService';
import { surveyKeys } from './surveyKeys';
import type { CreateSurveyRequest, SurveyStatus } from '@/types/survey.types';

// ─── List all surveys (admin) ─────────────────────────────────────────────────

/**
 * Paginated list of all surveys for the admin panel.
 * Optionally filtered by status. Uses keepPreviousData so the
 * table doesn't flash blank while the next page loads.
 */
export function useAdminSurveys(
  page = 0,
  size = 10,
  status?: SurveyStatus,
) {
  return useQuery({
    queryKey: surveyKeys.adminList(page, size, status),
    queryFn: () => surveyAdminService.getAllSurveys(page, size, status),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

// ─── Single survey detail (admin) ─────────────────────────────────────────────

/**
 * Full survey detail including all questions, targeting config, and response stats.
 * Only fetches when surveyId is a positive number.
 */
export function useAdminSurveyDetail(surveyId: number) {
  return useQuery({
    queryKey: surveyKeys.adminDetail(surveyId),
    queryFn: () => surveyAdminService.getSurveyById(surveyId),
    enabled: surveyId > 0,
    staleTime: 30_000,
  });
}

// ─── Create survey ────────────────────────────────────────────────────────────

/**
 * Creates a survey in DRAFT status. On success invalidates the admin list
 * so the new draft appears immediately.
 */
export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSurveyRequest) =>
      surveyAdminService.createSurvey(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surveyKeys.adminLists() });
    },
  });
}

// ─── Publish survey ───────────────────────────────────────────────────────────

/**
 * Transitions a DRAFT survey to ACTIVE.
 *
 * Cache strategy:
 *  - Immediately writes the updated survey into the detail cache (no extra fetch).
 *  - Invalidates the admin list so status badges update.
 */
export function usePublishSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: number) =>
      surveyAdminService.publishSurvey(surveyId),

    onSuccess: (updatedSurvey) => {
      queryClient.setQueryData(
        surveyKeys.adminDetail(updatedSurvey.id),
        updatedSurvey,
      );
      queryClient.invalidateQueries({ queryKey: surveyKeys.adminLists() });
    },
  });
}

// ─── Update survey status ─────────────────────────────────────────────────────

/**
 * Freely changes a survey's status:
 *   ACTIVE  → PAUSED
 *   PAUSED  → ACTIVE
 *   any     → CLOSED
 *
 * Cache strategy identical to usePublishSurvey.
 */
export function useUpdateSurveyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      surveyId,
      status,
    }: {
      surveyId: number;
      status: SurveyStatus;
    }) => surveyAdminService.updateSurveyStatus(surveyId, status),

    onSuccess: (updatedSurvey) => {
      queryClient.setQueryData(
        surveyKeys.adminDetail(updatedSurvey.id),
        updatedSurvey,
      );
      queryClient.invalidateQueries({ queryKey: surveyKeys.adminLists() });
    },
  });
}

export function useSurveyConfigs() {
  return useQuery({
    queryKey: ['survey-configs'],
    queryFn: surveyAdminService.getCostPerResponse,
    staleTime: 10 * 60_000,
  });
}

// ─── Survey responses (paginated) ─────────────────────────────────────────────
 
/**
 * Paginated list of individual user responses for a survey.
 * Each item contains the user info and all their answers.
 */
export function useSurveyResponses(surveyId: number, page = 0, size = 20) {
  return useQuery({
    queryKey: surveyKeys.adminResponses(surveyId, page, size),
    queryFn:  () => surveyAdminService.getSurveyResponses(surveyId, page, size),
    enabled:  surveyId > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
 
// ─── Survey analytics (charts) ────────────────────────────────────────────────
 
/**
 * Aggregated per-question statistics used to render charts.
 * Includes option percentages, average ratings, and text answer samples.
 */
export function useSurveyAnalytics(surveyId: number) {
  return useQuery({
    queryKey: surveyKeys.adminAnalytics(surveyId),
    queryFn:  () => surveyAdminService.getSurveyAnalytics(surveyId),
    enabled:  surveyId > 0,
    staleTime: 60_000,
  });
}
 
// ─── Export responses ─────────────────────────────────────────────────────────
 
/**
 * Triggers a file download (CSV or XLSX) of all responses for a survey.
 * Uses a mutation so the loading state can be shown on the export buttons.
 */
export function useExportResponses() {
  return useMutation({
    mutationFn: ({
      surveyId,
      surveyTitle,
      format,
    }: {
      surveyId: number;
      surveyTitle: string;
      format: 'csv' | 'xlsx';
    }) => surveyAdminService.exportResponses(surveyId, surveyTitle, format),
  });
}