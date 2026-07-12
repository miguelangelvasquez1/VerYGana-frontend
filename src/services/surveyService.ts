import axios, { AxiosError } from 'axios';
import type {
  Page,
  SurveyResponse,
  SurveySummary,
  AvailableSurveyDTO,
  SurveyDetailDTO,
  StartSurveyResponse,
  CreateSurveyRequest,
  UpdateSurveyRequest,
  SubmitSurveyRequest,
  SubmissionResult,
  UserRewardsSummary,
  SurveyStatus,
  SurveyResponseDetail,
  SurveyAnalytics,
  AdminSurveySummary,
  SurveyAdminDetailDTO,
  SurveyCommercialDetailDTO,
} from '@/types/survey.types';
import { PagedResponse } from '@/types/Generic.types';
import apiClient from '@/lib/api/client';

// ─── User endpoints ───────────────────────────────────────────────────────────

export const surveyService = {
  /** Ranked list of active surveys for the logged-in user */ 
  getAvailableSurveys: async (
    page = 0,
    size = 10,
  ): Promise<PagedResponse<AvailableSurveyDTO>> => {
    const { data } = await apiClient.get('/surveys', {
      params: { page, size },
    });
    return data;
  },

  /** Survey detail for preview (no questions) */
  getSurveyDetail: async (surveyId: number): Promise<SurveyDetailDTO> => {
    const { data } = await apiClient.get(`/surveys/${surveyId}`);
    return data;
  },

  /** Creates or resumes an active session for a survey */
  startSurvey: async (surveyId: number): Promise<StartSurveyResponse> => {
    const { data } = await apiClient.post(`/surveys/${surveyId}/start`);
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

// ─── commercial endpoints ──────────────────────────────────────────────────────────

export const surveyAdminService = {

  getCostPerQuestion: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get('/surveys/cost-per-question');
      // backend may return { costPerQuestion: n }, { cost: n }, or a plain number
      if (typeof data === 'number') return data;
      return data?.costPerQuestion ?? data?.cost ?? 0;
    } catch {
      return 0;
    }
  },

  /** Full detail for a survey owned by the current commercial user */
  getCommercialSurveyDetail: async (
    surveyId: number,
  ): Promise<SurveyCommercialDetailDTO> => {
    const { data } = await apiClient.get(`/surveys/commercial/${surveyId}`);
    return data;
  },

  /** Create a survey in DRAFT status */
  createSurvey: async (
    payload: CreateSurveyRequest,
  ): Promise<SurveyResponse> => {
    try {
      const { data } = await apiClient.post('/surveys', payload);
      return data;
    } catch (err) {
      handleError(err);
    }
  },

  /** Partial update — only sent fields are changed */
  updateSurvey: async (
    surveyId: number,
    payload: UpdateSurveyRequest,
  ): Promise<SurveyCommercialDetailDTO> => {
    try {
      const { data } = await apiClient.put(`/surveys/${surveyId}`, payload);
      return data;
    } catch (err) {
      handleError(err);
    }
  },

  /**
   * PATCH /surveys/:id/commercial-status?status=
   * Lets the owning commercial change their own survey's status
   * (ACTIVE ⇄ PAUSED, or → CLOSED). Rejects status=DRAFT and surveys
   * that are already CLOSED (400), or surveys owned by someone else (403).
   */
  updateSurveyStatus: async (
    surveyId: number,
    status: SurveyStatus,
  ): Promise<SurveyResponse> => {
    try {
      const { data } = await apiClient.patch(
        `/surveys/${surveyId}/commercial-status`,
        null,
        { params: { status } },
      );
      return data;
    } catch (err) {
      handleError(err);
    }
  },

  /** Get all surveys (admin sees all statuses) */
  getAllSurveys: async (
    page = 0,
    size = 10,
    status?: SurveyStatus,
  ): Promise<PagedResponse<SurveySummary>> => {
    const { data } = await apiClient.get('/surveys/commercial', {
      params: { page, size, ...(status && { status }) },
    });
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
        `/surveys/${surveyId}/responses`,
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
        `/surveys/${surveyId}/analytics`,
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
        `/surveys/${surveyId}/responses/export`,
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

// ----------------Admin----------------------

/**
   * GET /api/v1/admin/surveys?page=&size=&status=
   * Paginated list of all surveys, optionally filtered by status.
   */
  getSurveys: async (
    page = 0,
    size = 15,
    status?: SurveyStatus,
  ): Promise<PagedResponse<AdminSurveySummary>> => {
    try {
      const { data } = await apiClient.get<PagedResponse<AdminSurveySummary>>(
        '/surveys/admin',
        { params: { page, size, ...(status && { status }) } },
      );
      return data;
    } catch (err) {
      handleError(err);
    }
  },
 
  /**
   * GET /api/v1/admin/surveys/:id
   * Full survey detail (metadata + targeting + questions).
   */
  getSurveyAdminDetail: async (surveyId: number): Promise<SurveyAdminDetailDTO> => {
    try {
      const { data } = await apiClient.get<SurveyAdminDetailDTO>(
        `/surveys/admin/${surveyId}`,
      );
      return data;
    } catch (err) {
      handleError(err);
    }
  },
 
  /**
   * PATCH /api/v1/admin/surveys/:id/publish
   * DRAFT → ACTIVE shortcut.
   */
  publishSurvey: async (surveyId: number): Promise<SurveyResponse> => {
    try {
      const { data } = await apiClient.patch<SurveyResponse>(
        `/surveys/${surveyId}/publish`,
      );
      return data;
    } catch (err) {
      handleError(err);
    }
  },
 
  /**
   * PATCH /api/v1/admin/surveys/:id/status?status=
   * Change status freely (ACTIVE → PAUSED → CLOSED, etc.).
   */
  updateStatus: async (
    surveyId: number,
    status: SurveyStatus,
  ): Promise<SurveyResponse> => {
    try {
      const { data } = await apiClient.patch<SurveyResponse>(
        `/surveys/${surveyId}/status`,
        null,
        { params: { status } },
      );
      return data;
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
    // Some endpoints return RFC7807-style { title, detail }, others plain
    // Spring Boot error bodies { error, message } — prefer whichever has
    // the actual human-readable text over the generic axios message.
    throw new SurveyApiError(
      data?.title ?? data?.message ?? data?.error ?? 'Error en la solicitud',
      status,
      data?.detail,
    );
  }
  throw err;
}