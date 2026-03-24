// ─── Enums ────────────────────────────────────────────────────────────────────

export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export type RewardStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TEXT'
  | 'RATING'
  | 'YES_NO';

export type TargetGender = 'MALE' | 'FEMALE' | 'ALL';

export type ResponseStatus = 'IN_PROGRESS' | 'COMPLETED' | 'REWARDED';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface OptionResponse {
  id: number;
  text: string;
  orderIndex: number;
}

export interface QuestionResponse {
  id: number;
  text: string;
  type: QuestionType;
  required: boolean;
  orderIndex: number;
  options: OptionResponse[];
}

export interface SurveyResponse {
  id: number;
  title: string;
  description: string | null;
  rewardAmount: number;
  responseCount: number;
  maxResponses: number | null;
  status: SurveyStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  categoryNames: string[];
  municipalityNames: string[];
  minAge: number | null;
  maxAge: number | null;
  targetGender: TargetGender | null;
  questions: QuestionResponse[];
}

export interface SurveySummary {
  id: number;
  title: string;
  description: string | null;
  rewardAmount: number;
  status: SurveyStatus;
  alreadyCompleted: boolean;
  totalResponses: number;
  createdAt: string;
}

// ─── Reward ───────────────────────────────────────────────────────────────────

export interface RewardInfo {
  rewardId: number;
  amount: number;
  status: RewardStatus;
  grantedAt: string;
}

export interface UserRewardsSummary {
  completedSurveys: number;
  totalRewardsEarned: number;
  recentRewards: RewardInfo[];
}

export interface SubmissionResult {
  responseId: number;
  status: ResponseStatus;
  reward: RewardInfo;
  message: string;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface AnswerRequest {
  questionId: number;
  textAnswer?: string;
  selectedOptionId?: number;
  selectedOptionIds?: number[];
}

export interface SubmitSurveyRequest {
  surveyId: number;
  answers: AnswerRequest[];
}

export interface CreateQuestionRequest {
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

export interface CreateSurveyRequest {
  title: string;
  description?: string;
  /** ID of the SurveyConfig that defines the fixed cost per response */
  surveyConfigId: number;
  rewardAmount: number;
  maxResponses?: number;
  startsAt?: string;
  endsAt?: string;
  categoryIds: number[];
  municipalityCodes?: string[];
  minAge?: number;
  maxAge?: number;
  targetGender?: TargetGender;
  questions: CreateQuestionRequest[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

// ─── Survey Responses (Admin) ─────────────────────────────────────────────────
 
export interface SurveyAnswerDetail {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  textAnswer: string | null;
  selectedOptionText: string | null;
  selectedOptionTexts: string[];
}
 
export interface SurveyResponseDetail {
  id: number;
  userId: number;
  userName: string | null;
  status: ResponseStatus;
  startedAt: string;
  completedAt: string | null;
  answers: SurveyAnswerDetail[];
}
 
// ─── Survey Analytics ─────────────────────────────────────────────────────────
 
export interface OptionStat {
  optionText: string;
  count: number;
  percentage: number;
}
 
export interface QuestionStat {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  totalAnswers: number;
  optionStats: OptionStat[];        // for SINGLE_CHOICE, MULTIPLE_CHOICE, YES_NO
  averageRating: number | null;     // for RATING
  textAnswers: string[];            // for TEXT (sample)
}
 
export interface SurveyAnalytics {
  surveyId: number;
  surveyTitle: string;
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  averageCompletionMinutes: number | null;
  questionStats: QuestionStat[];
}
 
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ─── Form State ───────────────────────────────────────────────────────────────

export interface QuestionFormState {
  id: string; // local uuid for list keys
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[];
}

export interface SurveyFormState {
  title: string;
  description: string;
  rewardAmount: string;
  maxResponses: string;
  startsAt: string;
  endsAt: string;
  categoryIds: number[];
  municipalityCodes: string[];
  minAge: string;
  maxAge: string;
  targetGender: TargetGender | '';
  /** ID of the selected SurveyConfig (fixed cost per response) */
  surveyConfigId: number | null;
  questions: QuestionFormState[];
}