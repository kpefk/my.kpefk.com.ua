// ─── Surveys DTOs (mirror backend src/surveys/dto/*) ─────────────────────────

export type SurveyStatus = 'DRAFT' | 'OPEN' | 'CLOSED'
export type SurveyQuestionType =
  | 'RATING'
  | 'TEXT'
  | 'PARAGRAPH'
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'DROPDOWN'
  | 'SCALE'

/** Choice-типи з варіантами відповіді. */
export const CHOICE_QUESTION_TYPES: SurveyQuestionType[] = [
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'DROPDOWN',
]

export interface SurveyQuestionOptionDto {
  id: string
  order: number
  text: string
}

export interface SurveyQuestionDto {
  id: string
  order: number
  text: string
  type: SurveyQuestionType
  required: boolean
  options: SurveyQuestionOptionDto[]
  scaleMin: number | null
  scaleMax: number | null
  scaleMinLabel: string | null
  scaleMaxLabel: string | null
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

export interface SurveyOptionCountDto {
  optionId: string
  text: string
  count: number
}

export interface SurveyQuestionResultDto {
  questionId: string
  order: number
  text: string
  type: SurveyQuestionType
  answersCount: number
  ratingAverage: number | null
  /** RATING: індекс 0 → оцінка 1. SCALE: індекс 0 → scaleMin. */
  ratingDistribution: number[] | null
  /** SCALE: межі шкали (для підписів розподілу). */
  scaleMin: number | null
  scaleMax: number | null
  /** SINGLE_CHOICE/MULTI_CHOICE/DROPDOWN: лічильник по варіантах. */
  optionCounts: SurveyOptionCountDto[] | null
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
  /** Варіанти (текст) для choice-типів. */
  options?: string[]
  /** Лінійна шкала (SCALE). */
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
}

export interface SubmitAnswerInput {
  questionId: string
  ratingValue?: number
  selectedOptionIds?: string[]
  textValue?: string
}

// ─── Display constants ────────────────────────────────────────────────────────

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  DRAFT: 'Чернетка',
  OPEN: 'Відкрите',
  CLOSED: 'Закрите',
}

export const QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  RATING: 'Рейтинг (зірки 1–5)',
  TEXT: 'Коротка відповідь',
  PARAGRAPH: 'Абзац',
  SINGLE_CHOICE: 'Один варіант',
  MULTI_CHOICE: 'Кілька варіантів',
  DROPDOWN: 'Спадний список',
  SCALE: 'Лінійна шкала',
}

/** Допустимі межі для налаштовуваної лінійної шкали (дзеркало backend). */
export const SCALE_MIN_ALLOWED = 1
export const SCALE_MAX_ALLOWED = 10
export const SURVEY_MAX_OPTIONS = 20
