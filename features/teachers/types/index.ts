export interface TeacherDto {
  id: string
  userId: string | null
  personId: number
  staffId: number

  // Personal
  lastName: string
  firstName: string
  middleName: string | null
  birthday: string | null
  countryName: string | null
  personSexName: string | null

  // Position
  isActive: boolean
  positionName: string | null
  positionPluralityName: string | null
  positionPlace: string | null

  // Faculty
  universityFacultyId: number | null
  universityFacultyFullName: string | null
  universityFacultyShortName: string | null

  // Chair
  universityFacultyChairId: number | null
  universityFacultyChairFullName: string | null
  universityFacultyChairShortName: string | null

  // Qualification
  profession: string | null
  rang: string | null
  dignityNames: string | null
  skillName: string | null

  // Experience
  stageTypeName: string | null
  stage: number | null
  startDate: string | null

  // Work dates
  dateRecruit: string | null
  dateFire: string | null

  // Other
  coursesInfo: string | null
  createdAt: string
  modifyDate: string | null
}

export interface QualificationUpgradeDto {
  id: string
  source: 'EDEBO_PARSED' | 'MANUAL'
  rawText: string | null
  courseName: string
  organizationName: string | null
  startDate: string
  endDate: string
  hours: number
  certificateNumber: string | null
  createdAt: string
}

// ─── Attestation (атестація педпрацівників) ───────────────────────────────────

export type AttestationType = 'REGULAR' | 'EXTRAORDINARY'
export type AttestationStatus = 'NEVER' | 'OVERDUE' | 'DUE' | 'OK'

export interface TeacherAttestationDto {
  id: string
  teacherId: string
  attestationDate: string
  type: AttestationType
  resultCategory: string
  resultTitle: string | null
  correspondsToPosition: boolean
  orderNumber: string | null
  orderDate: string | null
  nextAttestationDate: string
  notes: string | null
  createdAt: string
}

export interface AttestationDueRowDto {
  teacher: {
    id: string
    fullName: string
    positionName: string | null
    skillName: string | null
    dignityNames: string | null
  }
  lastAttestationDate: string | null
  nextAttestationDate: string | null
  status: AttestationStatus
}

export interface CreateAttestationPayload {
  attestationDate: string
  type: AttestationType
  resultCategory: string
  resultTitle?: string
  correspondsToPosition?: boolean
  orderNumber?: string
  orderDate?: string
  nextAttestationDate?: string
  notes?: string
}

export const ATTESTATION_TYPE_LABELS: Record<AttestationType, string> = {
  REGULAR: 'Чергова',
  EXTRAORDINARY: 'Позачергова',
}

export const ATTESTATION_STATUS_LABELS: Record<AttestationStatus, string> = {
  NEVER: 'Не атестований',
  OVERDUE: 'Прострочено',
  DUE: 'Цього року',
  OK: 'Актуально',
}

/** Довідники для випадайок (можна ввести «Інше»). */
export const STANDARD_CATEGORIES: readonly string[] = [
  'Спеціаліст',
  'Спеціаліст другої категорії',
  'Спеціаліст першої категорії',
  'Спеціаліст вищої категорії',
]

export const STANDARD_TITLES: readonly string[] = [
  'Старший викладач',
  'Викладач-методист',
]

export interface TeacherFilters {
  search: string
  facultyId: number | null
  chairId: number | null
  isActive: boolean | null
}

export const DEFAULT_FILTERS: TeacherFilters = {
  search: '',
  facultyId: null,
  chairId: null,
  isActive: null,
}

export function getFullName(t: TeacherDto): string {
  return `${t.lastName} ${t.firstName} ${t.middleName ?? ''}`.trim()
}

export const formatDate = (date: string | null | undefined): string =>
  date
    ? new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(date))
    : '—'

/** stage у ЄДЕБО — кількість повних років стажу. */
export function formatStage(years: number | null | undefined): string {
  if (years == null) return '—'
  return `${years} р.`
}
