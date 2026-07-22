// ─── Credit recognition DTOs (mirror backend src/credit-recognition/dto/*) ──────

export type RecognitionStatus = 'DRAFT' | 'CONFIRMED'
export type CreditRecognitionType = 'PRIOR_EDUCATION' | 'NON_FORMAL'

export type NationalGrade =
  | 'EXCELLENT'
  | 'GOOD'
  | 'SATISFACTORY'
  | 'UNSATISFACTORY'
  | 'PASSED'
  | 'NOT_PASSED'

export interface CreditRecognitionItemDto {
  id: string
  curriculumComponentTermId: string
  componentName: string
  componentCode: string | null
  semesterNumber: number
  academicYear: string
  creditsEcts: number
  finalGrade: number | null
  nationalGrade: NationalGrade
  generatedGradeId: string | null
}

export interface CreditRecognitionDto {
  id: string
  studentId: string
  studentName: string
  type: CreditRecognitionType
  status: RecognitionStatus
  sourceInstitutionName: string
  sourceUniversityId: string | null
  sourceDocument: string | null
  sourceDocumentDate: string | null
  protocolNumber: string | null
  protocolDate: string | null
  notes: string | null
  totalEcts: number
  items: CreditRecognitionItemDto[]
  createdAt: string
}

// ─── Request payloads ───────────────────────────────────────────────────────

export interface RecognitionItemInput {
  curriculumComponentTermId: string
  academicYear: string
  creditsEcts: number
  finalGrade?: number | null
  nationalGradeOverride?: NationalGrade
}

export interface CreateCreditRecognitionPayload {
  studentId: string
  type: CreditRecognitionType
  sourceInstitutionName: string
  sourceDocument?: string
  sourceDocumentDate?: string
  protocolNumber?: string
  protocolDate?: string
  notes?: string
  items: RecognitionItemInput[]
}

// ─── Display constants ──────────────────────────────────────────────────────

export const RECOGNITION_TYPE_LABELS: Record<CreditRecognitionType, string> = {
  PRIOR_EDUCATION: 'Раніше здобута освіта',
  NON_FORMAL: 'Неформальна освіта',
}

export const RECOGNITION_STATUS_LABELS: Record<RecognitionStatus, string> = {
  DRAFT: 'Чернетка',
  CONFIRMED: 'Підтверджено',
}
