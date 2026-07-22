// ─── Academic mobility DTOs (mirror backend src/academic-mobility/dto/*) ────────

export type RecognitionStatus = 'DRAFT' | 'CONFIRMED'
export type MobilityDirection = 'OUTBOUND' | 'INBOUND'

export type NationalGrade =
  | 'EXCELLENT'
  | 'GOOD'
  | 'SATISFACTORY'
  | 'UNSATISFACTORY'
  | 'PASSED'
  | 'NOT_PASSED'

export interface AcademicMobilityItemDto {
  id: string
  curriculumComponentTermId: string
  componentName: string
  componentCode: string | null
  semesterNumber: number
  academicYear: string
  creditsEcts: number
  finalGrade: number | null
  nationalGrade: NationalGrade
  partnerComponentName: string | null
  generatedGradeId: string | null
}

export interface AcademicMobilityDto {
  id: string
  studentId: string
  studentName: string
  direction: MobilityDirection
  status: RecognitionStatus
  partnerInstitutionName: string
  partnerUniversityId: string | null
  country: string | null
  periodFrom: string
  periodTo: string
  agreementNumber: string | null
  agreementDate: string | null
  protocolNumber: string | null
  protocolDate: string | null
  notes: string | null
  totalEcts: number
  items: AcademicMobilityItemDto[]
  createdAt: string
}

// ─── Request payloads ───────────────────────────────────────────────────────

export interface MobilityItemInput {
  curriculumComponentTermId: string
  academicYear: string
  creditsEcts: number
  finalGrade?: number | null
  nationalGradeOverride?: NationalGrade
  partnerComponentName?: string
}

export interface CreateAcademicMobilityPayload {
  studentId: string
  direction: MobilityDirection
  partnerInstitutionName: string
  country?: string
  periodFrom: string
  periodTo: string
  agreementNumber?: string
  agreementDate?: string
  protocolNumber?: string
  protocolDate?: string
  notes?: string
  items: MobilityItemInput[]
}

// ─── Display constants ──────────────────────────────────────────────────────

export const MOBILITY_DIRECTION_LABELS: Record<MobilityDirection, string> = {
  OUTBOUND: 'Виїзна',
  INBOUND: 'Вхідна',
}

export const MOBILITY_STATUS_LABELS: Record<RecognitionStatus, string> = {
  DRAFT: 'Чернетка',
  CONFIRMED: 'Підтверджено',
}
