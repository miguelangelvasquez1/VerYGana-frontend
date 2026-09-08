import apiClient from '@/lib/api/client';
import type { DateRangeFilter } from '@/components/commercial/analytics/analytics.types';

// ─────────────────────────────────────────────────────────────────────────────
// Reportes del panel de analíticas del comercial.
//
// Query params (opcionales): ?from=YYYY-MM-DD&to=YYYY-MM-DD — por defecto el
// backend usa los últimos 30 días, zona America/Bogota, `to` inclusivo.
//
// Convenciones del contrato:
//   · Los montos vienen en centavos de COP (campos *Cents) → dividir por 100.
//   · Los porcentajes (*Pct) son 0-100 y PUEDEN VENIR AUSENTES (el back omite
//     nulls cuando el denominador es 0) → en el tipo van como opcionales y la
//     UI los muestra como "—".
//   · Las series *ByDay siempre cubren todo el rango (días sin datos = 0).
//   · Los `status` llegan como enum string en inglés.
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportPeriod {
  from: string;
  to: string;
}

/** Un punto de una serie diaria. Los días sin datos vienen en 0, no se omiten. */
export interface DayCount {
  date: string;
  count: number;
}

const toParams = (range?: DateRangeFilter) =>
  range ? { from: range.startDate, to: range.endDate } : undefined;

// ─── Anuncios ────────────────────────────────────────────────────────────────

export interface AdsReportSummary {
  totalAds: number;
  activeAds: number;
  pausedAds: number;
  completedAds: number;
  pendingAds: number;
  rejectedAds: number;
  /** likes recibidos en el rango */
  interactions: number;
  /** likes acumulados de por vida */
  lifetimeInteractions: number;
  /** recompensas pagadas a usuarios en el rango */
  rewardPaidCents: number;
  totalBudgetCents: number;
  spentBudgetCents: number;
  remainingBudgetCents: number;
  /** % avance promedio de los anuncios */
  avgCompletionRatePct?: number;
  /** visitas a la página oficial atribuidas a anuncios (rango) */
  pageVisits: number;
  /** pageVisits / interactions * 100 */
  clickThroughRatePct?: number;
}

export interface AdReportRow {
  adId: number;
  title: string;
  status: string;
  interactions: number;
  lifetimeLikes: number;
  maxLikes: number;
  completionRatePct?: number;
  rewardPerLikeCents: number;
  totalBudgetCents: number;
  spentBudgetCents: number;
  pageVisits: number;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
}

export interface AdsReport {
  period: ReportPeriod;
  summary: AdsReportSummary;
  /** ya viene ordenado por interactions desc */
  perAd: AdReportRow[];
  interactionsByDay: DayCount[];
}

export const getAdsReport = async (
  range?: DateRangeFilter,
  signal?: AbortSignal,
): Promise<AdsReport> => {
  const { data } = await apiClient.get('/commercials/report/ads', {
    params: toParams(range),
    signal,
  });
  return data;
};

// ─── Encuestas ───────────────────────────────────────────────────────────────

export interface SurveysReportSummary {
  totalSurveys: number;
  draftSurveys: number;
  pendingReviewSurveys: number;
  approvedSurveys: number;
  activeSurveys: number;
  pausedSurveys: number;
  completedSurveys: number;
  rejectedSurveys: number;
  /** respuestas acumuladas (de por vida) */
  totalResponses: number;
  /** en el rango */
  startedSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  expiredSessions: number;
  /** completedSessions / startedSessions * 100 */
  completionRatePct?: number;
  /** respuestas completadas cuya fecha cae en el rango */
  responsesInPeriod: number;
  avgResponsesPerActiveSurvey?: number;
  rewardPaidCents: number;
}

export interface SurveyReportRow {
  surveyId: number;
  title: string;
  status: string;
  responseCount: number;
  maxResponses: number;
  fillRatePct?: number;
  startedSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  completionRatePct?: number;
  questionCount: number;
  createdAt: string;
  startsAt: string | null;
  endsAt: string | null;
}

export interface SurveysReport {
  period: ReportPeriod;
  summary: SurveysReportSummary;
  perSurvey: SurveyReportRow[];
  responsesByDay: DayCount[];
}

export const getSurveysReport = async (
  range?: DateRangeFilter,
  signal?: AbortSignal,
): Promise<SurveysReport> => {
  const { data } = await apiClient.get('/commercials/report/surveys', {
    params: toParams(range),
    signal,
  });
  return data;
};

// ─── Juegos ──────────────────────────────────────────────────────────────────

export interface GamesReportSummary {
  totalCampaigns: number;
  draftCampaigns: number;
  publishedCampaigns: number;
  pausedCampaigns: number;
  completedCampaigns: number;
  cancelledCampaigns: number;
  sessionsPlayed: number;
  completedSessions: number;
  uniquePlayers: number;
  completionRatePct?: number;
  totalPlayTimeSeconds: number;
  avgSessionDurationSeconds: number;
  totalBudgetCents: number;
  spentBudgetCents: number;
  rewardsPaidCents: number;
  lifetimeSessionsPlayed: number;
  lifetimeCompletedSessions: number;
}

export interface GameCampaignReportRow {
  campaignId: number;
  gameTitle: string;
  status: string;
  sessionsPlayed: number;
  completedSessions: number;
  uniquePlayers: number;
  completionRatePct?: number;
  totalPlayTimeSeconds: number;
  budgetCents: number;
  spentCents: number;
  startDate: string | null;
  endDate: string | null;
}

export interface GamesReport {
  period: ReportPeriod;
  summary: GamesReportSummary;
  perCampaign: GameCampaignReportRow[];
  playsByDay: DayCount[];
}

export const getGamesReport = async (
  range?: DateRangeFilter,
  signal?: AbortSignal,
): Promise<GamesReport> => {
  const { data } = await apiClient.get('/commercials/report/games', {
    params: toParams(range),
    signal,
  });
  return data;
};

// ─── Remisión / visitas a la página oficial (solo Premium) ────────────────────

export interface PageVisitsReportSummary {
  totalVisits: number;
  uniqueVisitors: number;
  lifetimeVisits: number;
  /** mismo nº de días, inmediatamente anterior */
  previousPeriodVisits: number;
  /** variación % vs período anterior (puede faltar) */
  deltaPct?: number;
  /** totalVisits / interacciones-con-anuncios * 100 (puede faltar) */
  conversionRatePct?: number;
}

export interface PageVisitsByAdRow {
  adId: number;
  adTitle: string;
  visits: number;
  uniqueVisitors: number;
}

export interface RecentPageVisit {
  adId: number;
  adTitle: string;
  visitedAt: string;
}

export interface PageVisitsReport {
  period: ReportPeriod;
  summary: PageVisitsReportSummary;
  visitsByDay: DayCount[];
  /** ordenado por visits desc */
  visitsByAd: PageVisitsByAdRow[];
  /** últimas 20 */
  recentVisits: RecentPageVisit[];
}

export const getPageVisitsReport = async (
  range?: DateRangeFilter,
  signal?: AbortSignal,
): Promise<PageVisitsReport> => {
  const { data } = await apiClient.get('/commercials/report/page-visits', {
    params: toParams(range),
    signal,
  });
  return data;
};
