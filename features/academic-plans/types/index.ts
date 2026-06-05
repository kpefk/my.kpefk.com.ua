// ─── Enums ────────────────────────────────────────────────────────────────────

export type EducationForm = 'FULL_TIME' | 'PART_TIME' | 'DUAL'
export type AdmissionBasis = 'AFTER_9TH_GRADE' | 'AFTER_11TH_GRADE'
export type CurriculumSectionType =
  | 'SECONDARY_EDUCATION'
  | 'GENERAL_COMPETENCY'
  | 'PROFESSIONAL_COMPETENCY'
  | 'ELECTIVE'
  | 'PRACTICE'
  | 'ATTESTATION'
export type ComponentType =
  | 'DISCIPLINE'
  | 'PRACTICE'
  | 'COURSE_WORK'
  | 'COURSE_PROJECT'
  | 'DIPLOMA_PROJECT'
  | 'QUALIFICATION_WORK_DEFENSE'
  | 'QUALIFICATION_EXAM'
  | 'STATE_EXAM'
export type ControlForm =
  | 'EXAM'
  | 'TEST'
  | 'DIFFERENTIATED_TEST'
  | 'COURSE_WORK'
  | 'COURSE_PROJECT'
  | 'NONE'
export type PracticeType = 'EDUCATIONAL' | 'TECHNOLOGICAL' | 'PRE_GRADUATION'
export type CalendarWeekType =
  | 'INSTRUCTION'
  | 'EXAM_SESSION'
  | 'PRACTICE'
  | 'HOLIDAY'
  | 'NATIONAL_HOLIDAY'
  | 'STATE_ATTESTATION'
  | 'GRADUATION_WORK'
  | 'DEFENSE'

// ─── Core DTOs ────────────────────────────────────────────────────────────────

export interface SpecialtyDto {
  id: string
  code: string
  name: string
  shortName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EducationalProgramDto {
  id: string
  specialtyId: string
  specialty: { id: string; code: string; name: string }
  name: string
  qualificationName: string
  qualificationLevel: string | null
  edeboId: number | null
  approvalDate: string | null
  approvalOrderNumber: string | null
  isActive: boolean
  notes: string | null
  // EDEBO sync fields
  studyProgramNameEn: string | null
  qualificationGroupId: number | null
  universitySpecializationId: number | null
  specializationName: string | null
  syncedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CurriculumListItemDto {
  id: string
  programId: string
  program: {
    id: string
    name: string
    qualificationName: string
    specialty: { id: string; code: string; name: string }
  }
  educationForm: EducationForm
  admissionBasis: AdmissionBasis
  entryYear: number
  studyDurationMonths: number
  totalEcts: string
  isActive: boolean
  notes: string | null
  versions: CurriculumVersionSummaryDto[]
  _count: { versions: number; groupAssignments: number }
  createdAt: string
  updatedAt: string
}

// ─── Version DTOs ─────────────────────────────────────────────────────────────

export interface CurriculumVersionSummaryDto {
  id: string
  versionNumber: number
  approvalDate: string
  approvalOrderNumber: string
  approvedBy: string
  isPublished: boolean
  publishedAt: string | null
  deprecatedAt: string | null
  notes: string | null
  createdAt: string
}

export interface CurriculumVersionDetailDto {
  id: string
  curriculumId: string
  curriculum: CurriculumListItemDto
  versionNumber: number
  approvalDate: string
  approvalOrderNumber: string
  approvedBy: string
  isPublished: boolean
  publishedAt: string | null
  deprecatedAt: string | null
  notes: string | null
  sections: CurriculumSectionDto[]
  timeBudgetEntries: TimeBudgetEntryDto[]
  calendarEntries: AcademicCalendarEntryDto[]
  _count: { groupAssignments: number; workingCurricula: number }
  createdAt: string
}

// ─── Structure DTOs ───────────────────────────────────────────────────────────

export interface CurriculumSectionDto {
  id: string
  versionId: string
  code: string | null
  name: string
  orderIndex: number
  sectionType: CurriculumSectionType
  subtotalEcts: string | null
  electiveBlocks: ElectiveBlockDto[]
  components: CurriculumComponentDto[]
}

export interface ElectiveBlockDto {
  id: string
  sectionId: string
  name: string
  semesterNumber: number
  minSelections: number
  maxSelections: number
  orderIndex: number
}

export interface CurriculumComponentDto {
  id: string
  sectionId: string
  electiveBlockId: string | null
  code: string | null
  name: string
  componentType: ComponentType
  totalEcts: string
  totalHours: number
  orderIndex: number
  isMandatory: boolean
  practiceType: PracticeType | null
  courseWorkCount: number
  courseProjectCount: number
  notes: string | null
  terms: CurriculumComponentTermDto[]
}

export interface CurriculumComponentTermDto {
  id: string
  componentId: string
  semesterNumber: number
  ects: string
  hours: number
  controlForm: ControlForm
  hasCourseWork: boolean
  hasCourseProject: boolean
}

export interface TimeBudgetEntryDto {
  id: string
  versionId: string
  label: string
  totalHours: number
  totalEcts: string | null
  orderIndex: number
}

export interface AcademicCalendarEntryDto {
  id: string
  versionId: string
  courseNumber: number
  semesterNumber: number
  weekNumber: number
  weekType: CalendarWeekType
}

// ─── Group assignment DTOs ────────────────────────────────────────────────────

export interface GroupCurriculumAssignmentDto {
  id: string
  groupId: string
  group: { id: string; name: string }
  curriculumId: string
  curriculum: {
    id: string
    educationForm: EducationForm
    admissionBasis: AdmissionBasis
    entryYear: number
  }
  versionId: string
  version: {
    id: string
    versionNumber: number
    approvalDate: string
    isPublished: boolean
  }
  effectiveFrom: string
  effectiveUntil: string | null
  isActive: boolean
  assignedBy: string | null
  reason: string | null
  createdAt: string
}

// ─── Working curriculum DTOs ──────────────────────────────────────────────────

export interface WorkingCurriculumSummaryDto {
  id: string
  versionId: string
  version: {
    id: string
    versionNumber: number
    isPublished: boolean
    curriculum: {
      id: string
      educationForm: EducationForm
      admissionBasis: AdmissionBasis
      entryYear: number
      program: {
        id: string
        name: string
        specialty: { code: string; name: string }
      }
    }
  }
  academicYear: string
  semesterNumbers: number[]
  isApproved: boolean
  approvedAt: string | null
  notes: string | null
  _count: { groupAssignments: number; componentTerms: number }
  createdAt: string
  updatedAt: string
}

export interface WorkingCurriculumDetailDto extends WorkingCurriculumSummaryDto {
  componentTerms: WorkingComponentTermDto[]
  groupAssignments: { group: { id: string; name: string }; academicYear: string; isActive: boolean }[]
}

export interface WorkingComponentTermDto {
  id: string
  workingCurriculumId: string
  componentTermId: string
  componentTerm: {
    id: string
    semesterNumber: number
    ects: string
    hours: number
    controlForm: ControlForm
    component: { id: string; code: string | null; name: string; componentType: ComponentType }
  }
  lectureHours: number
  practicalHours: number
  labHours: number
  seminarHours: number
  independentHours: number
  consultationHours: number
  weeklyLectureHours: string | null
  weeklyPracticalHours: string | null
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface CurriculumFilters {
  search: string
  educationForm: EducationForm | null
  admissionBasis: AdmissionBasis | null
  isActive: boolean | null
}

export const DEFAULT_CURRICULUM_FILTERS: CurriculumFilters = {
  search: '',
  educationForm: null,
  admissionBasis: null,
  isActive: null,
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const EDUCATION_FORM_LABELS: Record<EducationForm, string> = {
  FULL_TIME: 'Денна',
  PART_TIME: 'Заочна',
  DUAL: 'Дуальна',
}

export const ADMISSION_BASIS_LABELS: Record<AdmissionBasis, string> = {
  AFTER_9TH_GRADE: 'На основі 9 класів',
  AFTER_11TH_GRADE: 'На основі 11 класів',
}

export const CONTROL_FORM_LABELS: Record<ControlForm, string> = {
  EXAM: 'Екзамен',
  TEST: 'Залік',
  DIFFERENTIATED_TEST: 'Диф. залік',
  COURSE_WORK: 'Курсова робота',
  COURSE_PROJECT: 'Курсовий проект',
  NONE: '—',
}

export const CONTROL_FORM_SHORT: Record<ControlForm, string> = {
  EXAM: 'Е',
  TEST: 'З',
  DIFFERENTIATED_TEST: 'ДЗ',
  COURSE_WORK: 'КР',
  COURSE_PROJECT: 'КП',
  NONE: '—',
}

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  DISCIPLINE: 'Дисципліна',
  PRACTICE: 'Практика',
  COURSE_WORK: 'Курсова робота',
  COURSE_PROJECT: 'Курсовий проект',
  DIPLOMA_PROJECT: 'Дипломне проектування',
  QUALIFICATION_WORK_DEFENSE: 'Захист кваліфікаційної роботи',
  QUALIFICATION_EXAM: 'Кваліфікаційний іспит',
  STATE_EXAM: 'Державний іспит',
}

export const SECTION_TYPE_LABELS: Record<CurriculumSectionType, string> = {
  SECONDARY_EDUCATION: 'Загальна середня освіта',
  GENERAL_COMPETENCY: 'Загальні компетентності',
  PROFESSIONAL_COMPETENCY: 'Фахові компетентності',
  ELECTIVE: 'Вибіркова частина',
  PRACTICE: 'Практична підготовка',
  ATTESTATION: 'Атестація',
}

export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  EDUCATIONAL: 'Навчальна',
  TECHNOLOGICAL: 'Технологічна',
  PRE_GRADUATION: 'Переддипломна',
}

export function formatDuration(months: number): string {
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} ${years === 1 ? 'рік' : 'роки'}`
  return `${years} ${years === 1 ? 'рік' : 'роки'} ${rem} міс.`
}

export const formatDate = (date: string | null | undefined): string =>
  date
    ? new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(date))
    : '—'

export function getLatestActiveVersion(
  versions: CurriculumVersionSummaryDto[],
): CurriculumVersionSummaryDto | null {
  const published = versions.filter((v) => v.isPublished && !v.deprecatedAt)
  if (published.length === 0) return null
  return published.reduce((a, b) => (a.versionNumber > b.versionNumber ? a : b))
}
