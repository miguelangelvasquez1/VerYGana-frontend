import type { SurveyStatus } from '@/types/survey.types';

/**
 * Centralized TanStack Query key factory for the surveys module.
 *
 * All hooks import keys from here — never hardcode query keys inline.
 * This makes targeted cache invalidation reliable and refactor-safe.
 *
 * Hierarchy:
 *   ['surveys']
 *     ['surveys', 'list', { page, size }]
 *     ['surveys', 'detail', id]
 *     ['surveys', 'rewards', 'summary']
 *     ['surveys', 'admin']
 *       ['surveys', 'admin', 'list', { page, size, status }]
 *       ['surveys', 'admin', 'detail', id]
 */
export const surveyKeys = {
  /** Root — invalidates everything in the surveys module */
  all: ['surveys'] as const,

  // ── User ──────────────────────────────────────────────────────────────────

  lists: () => [...surveyKeys.all, 'list'] as const,

  list: (page: number, size: number) =>
    [...surveyKeys.lists(), { page, size }] as const,

  details: () => [...surveyKeys.all, 'detail'] as const,

  detail: (id: number) => [...surveyKeys.details(), id] as const,

  rewards: () => [...surveyKeys.all, 'rewards'] as const,

  rewardsSummary: () => [...surveyKeys.rewards(), 'summary'] as const,

  // ── Admin ──────────────────────────────────────────────────────────────────

  admin: () => [...surveyKeys.all, 'admin'] as const,

  adminLists: () => [...surveyKeys.admin(), 'list'] as const,

  adminList: (page: number, size: number, status?: SurveyStatus) =>
    [...surveyKeys.adminLists(), { page, size, status }] as const,

  adminDetails: () => [...surveyKeys.admin(), 'detail'] as const,

  adminDetail: (id: number) => [...surveyKeys.adminDetails(), id] as const,

  /** Key for GET /api/v1/admin/:id — the dedicated admin detail endpoint */
  adminDetailFull: (id: number) =>
    [...surveyKeys.admin(), 'detail-full', id] as const,

  costPerResponse: () => [...surveyKeys.admin(), 'cost-per-response'] as const,

  adminResponses: (surveyId: number, page: number, size: number) =>
    [...surveyKeys.admin(), 'responses', surveyId, { page, size }] as const,

  adminResponsesOverview: (surveyId: number) =>
    [...surveyKeys.admin(), 'responses-overview', surveyId] as const,

  /** Aggregated analytics (charts) for a survey */
  adminAnalytics: (surveyId: number) =>
    [...surveyKeys.admin(), 'analytics', surveyId] as const,
} as const;