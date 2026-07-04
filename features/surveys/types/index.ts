// ─── Surveys DTOs (mirror backend src/surveys/dto/*) ─────────────────────────

export type SurveyStatus = 'DRAFT' | 'OPEN' | 'CLOSED'
export type SurveyQuestionType = 'RATING' | 'YES_NO' | 'TEXT'

export interface SurveyQuestionDto {
  id: string
  order: number
  text: string
  type: SurveyQuestionType
  required: boolean
}

export interface SurveyTargetGroupDto {
  groupId: string
  groupName: string
}

export interface SurveyAdminDto {
  id: string
  title: string
  description: string | null
  status: SurveyStatus
  isAnonymous: boolean
  opensAt: string | null
  closesAt: string | null
  questionCount: number
  completionCount: number
  targetGroups: SurveyTargetGroupDto[]
  questions: SurveyQuestionDto[]
  createdAt: string
}

export interface StudentSurveyDto {
  id: string
  title: string
  description: string | null
  isAnonymous: boolean
  closesAt: string | null
  completed: boolean
  questions: SurveyQuestionDto[]
}

export interface SurveyGroupRateDto {
  groupId: string
  groupName: string
  targets: number
  completions: number
}

export interface SurveyQuestionResultDto {
  questionId: string
  order: number
  text: string
  type: SurveyQuestionType
  answersCount: number
  ratingAverage: number | null
  /** Індекс 0 → оцінка 1, ..., індекс 4 → оцінка 5. */
  ratingDistribution: number[] | null
  yesCount: number | null
  noCount: number | null
  textAnswers: string[] | null
}

export interface SurveyResultsDto {
  surveyId: string
  title: string
  isAnonymous: boolean
  status: SurveyStatus
  totalTargets: number
  totalCompletions: number
  responseRatePercent: number
  byGroup: SurveyGroupRateDto[]
  questions: SurveyQuestionResultDto[]
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateSurveyPayload {
  title: string
  description?: string
  isAnonymous?: boolean
  opensAt?: string
  closesAt?: string
  groupIds?: string[]
}

export interface UpdateSurveyPayload {
  title?: string
  description?: string
  isAnonymous?: boolean
  opensAt?: string | null
  closesAt?: string | null
  groupIds?: string[]
}

export interface SurveyQuestionInput {
  text: string
  type: SurveyQuestionType
  required?: boolean
}

export interface SubmitAnswerInput {
  questionId: string
  ratingValue?: number
  boolValue?: boolean
  textValue?: string
}

// ─── Display constants ────────────────────────────────────────────────────────

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  DRAFT: 'Чернетка',
  OPEN: 'Відкрите',
  CLOSED: 'Закрите',
}

export const QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  RATING: 'Шкала 1–5',
  YES_NO: 'Так / Ні',
  TEXT: 'Текстова відповідь',
}
