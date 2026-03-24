import axios, { AxiosError } from 'axios';
import type {
  Page,
  SurveyResponse,
  SurveySummary,
  CreateSurveyRequest,
  SubmitSurveyRequest,
  SubmissionResult,
  UserRewardsSummary,
  SurveyStatus,
  SurveyResponseDetail,
  SurveyAnalytics,
} from '@/types/survey.types';
import { PagedResponse } from '@/types/GenericTypes';
import apiClient from '@/lib/api/client';

// ─── User endpoints ───────────────────────────────────────────────────────────

export const surveyService = {
  /** Ranked list of active surveys for the logged-in user */
  getAvailableSurveys: async (
    page = 0,
    size = 10,
  ): Promise<Page<SurveySummary>> => {
    const { data } = await apiClient.get('/surveys', {
      params: { page, size },
    });
    return data;
  },

  /** Full survey detail with questions (validates eligibility server-side) */
  getSurveyDetail: async (surveyId: number): Promise<SurveyResponse> => {
    const { data } = await apiClient.get(`/surveys/${surveyId}`);
    return data;
  },

  /** Submit answers and collect reward */
  submitSurvey: async (
    payload: SubmitSurveyRequest,
  ): Promise<SubmissionResult> => {
    const { data } = await apiClient.post('/surveys/submit', payload);
    return data;
  },

  /** User's reward history and total earned */
  getRewardsSummary: async (): Promise<UserRewardsSummary> => {
    const { data } = await apiClient.get('/surveys/rewards/summary');
    return data;
  },
};

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export const surveyAdminService = {

  getCostPerResponse: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get<{ costPerResponse: number }>(
        '/surveys/cost-per-response',
      );
      return data.costPerResponse;
    } catch (err) {
      return 0;
    }
  },

  /** Create a survey in DRAFT status */
  createSurvey: async (
    payload: CreateSurveyRequest,
  ): Promise<SurveyResponse> => {
    const { data } = await apiClient.post('/surveys', payload);
    return data;
  },

  /** Publish a DRAFT survey → ACTIVE */
  publishSurvey: async (surveyId: number): Promise<SurveyResponse> => {
    const { data } = await apiClient.patch(
      `/surveys/${surveyId}/publish`,
    );
    return data;
  },

  /** Change survey status freely */
  updateSurveyStatus: async (
    surveyId: number,
    status: SurveyStatus,
  ): Promise<SurveyResponse> => {
    const { data } = await apiClient.patch(
      `/surveys/${surveyId}/status`,
      null,
      { params: { status } },
    );
    return data;
  },

  /** Get all surveys (admin sees all statuses) */
  getAllSurveys: async (
    page = 0,
    size = 10,
    status?: SurveyStatus,
  ): Promise<PagedResponse<SurveySummary>> => {
    const { data } = await apiClient.get('/surveys/admin', {
      params: { page, size, ...(status && { status }) },
    });
    return data;
  },

  /** Get single survey full detail */
  getSurveyById: async (surveyId: number): Promise<SurveyResponse> => {
    const { data } = await apiClient.get(`/surveys/admin/${surveyId}`);
    return data;
  },

  fetchSurveyConfigs: async (): Promise<number[]> => {
    const { data } = await apiClient.get('/surveys/configs');
    return data;
  },  

  // ── Responses ─────────────────────────────────────────────────────────────
 
  /**
   * GET /api/v1/admin/surveys/:surveyId/responses?page=&size=
   * Paginated list of individual user responses.
   */
  getSurveyResponses: async (
    surveyId: number,
    page = 0,
    size = 20,
  ): Promise<PagedResponse<SurveyResponseDetail>> => {
    try {
      const { data } = await apiClient.get<PagedResponse<SurveyResponseDetail>>(
        `/surveys/admin/${surveyId}/responses`,
        { params: { page, size } },
      );
      return data;
    } catch (err) {
      handleError(err);
    }
  },
 
  // ── Analytics ─────────────────────────────────────────────────────────────
 
  /**
   * GET /api/v1/admin/surveys/:surveyId/analytics
   * Aggregated stats per question (option percentages, avg rating, text samples).
   */
  getSurveyAnalytics: async (surveyId: number): Promise<SurveyAnalytics> => {
    try {
      const { data } = await apiClient.get<SurveyAnalytics>(
        `/surveys/admin/${surveyId}/analytics`,
      );
      return data;
    } catch (err) {
      handleError(err);
    }
  },
 
  // ── Export ────────────────────────────────────────────────────────────────
 
  /**
   * GET /api/v1/admin/surveys/:surveyId/responses/export?format=csv|xlsx
   * Triggers a browser file download.
   */
  exportResponses: async (
    surveyId: number,
    surveyTitle: string,
    format: 'csv' | 'xlsx',
  ): Promise<void> => {
    try {
      const response = await apiClient.get(
        `/surveys/admin/${surveyId}/responses/export`,
        { params: { format }, responseType: 'blob' },
      );
 
      const mimeType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv;charset=utf-8;';
 
      const blob = new Blob([response.data], { type: mimeType });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const slug = surveyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
 
      link.href     = url;
      link.download = `encuesta_${surveyId}_${slug}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      handleError(err);
    }
  },
};

export class SurveyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'SurveyApiError';
  }
}
 
function handleError(err: unknown): never {
  if (err instanceof AxiosError && err.response) {
    const { status, data } = err.response;
    throw new SurveyApiError(
      data?.title ?? 'Error en la solicitud',
      status,
      data?.detail ?? data?.message,
    );
  }
  throw err;
}