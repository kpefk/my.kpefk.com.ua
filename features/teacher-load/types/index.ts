// ─── Teacher load DTOs (mirror of backend teacher-load.dto.ts) ────────────────

export interface TeacherSummaryDto {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  skillName: string | null
  positionName: string | null
  departmentName: string | null
  /** Ставка (0.25–1.5). Визначає ліміт: 720 × rate год/рік. */
  rate: number
}

export interface HoursPerGroupDto {
  lecture: number
  practicalLab: number
  seminar: number
  independent: number
  examPrep: number
}

export interface TotalHoursDto {
  lecture: number
  practicalLab: number
  seminar: number
  independent: number
  examPrep: number
  subtotal: number
}

export interface LoadComponentDto {
  componentCode: string | null
  componentName: string
  semesterNumber: number
  groupCount: number
  studentCount: number
  hoursPerGroup: HoursPerGroupDto
  totalHours: TotalHoursDto
}

export interface TeacherLoadSummaryDto {
  /** Навчальне навантаження: всі типи занять (год) */
  totalTeachingHours: number
  /** Ліміт: 720 × rate год/рік (Ст. 60 №2745-VIII) */
  teachingHoursLimit: number
  /** true якщо totalTeachingHours > teachingHoursLimit */
  teachingHoursExceeded: boolean
  disciplineCount: number
  warnings: string[]
}

export interface TeacherLoadEntryDto {
  teacher: TeacherSummaryDto | null
  summary: TeacherLoadSummaryDto
  components: LoadComponentDto[]
}

export interface TeacherLoadDto {
  workingCurriculumId: string
  academicYear: string
  generatedAt: string
  teachers: TeacherLoadEntryDto[]
}

// ─── My load (teacher dashboard) ──────────────────────────────────────────────

export interface MyLoadPlanDto {
  workingCurriculumId: string
  academicYear: string
  label: string
  totalTeachingHours: number
  components: LoadComponentDto[]
}

export interface MyTeacherLoadDto {
  teacher: TeacherSummaryDto | null
  academicYear: string | null
  totalTeachingHours: number
  teachingHoursLimit: number
  teachingHoursExceeded: boolean
  disciplineCount: number
  plans: MyLoadPlanDto[]
}

// ─── All-teachers summary (manager overview) ──────────────────────────────────

export interface AllTeachersLoadRowDto {
  teacher: TeacherSummaryDto
  totalTeachingHours: number
  teachingHoursLimit: number
  teachingHoursExceeded: boolean
  disciplineCount: number
  workingCurriculumCount: number
}

export interface AllTeachersLoadDto {
  academicYear: string
  generatedAt: string
  rows: AllTeachersLoadRowDto[]
  unassignedComponents: number
}

// ─── Assignment DTOs (two-level model) ───────────────────────────────────────

export type LessonType = 'LECTURE' | 'PRACTICE' | 'LAB' | 'SEMINAR' | 'CONSULTATION' | 'SPRS'
export type LoadStatus = 'DRAFT' | 'CONFIRMED'
export type LoadDistributionMode = 'STREAM' | 'PER_GROUP'

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  LECTURE:      'Лекції',
  PRACTICE:     'Практичні',
  LAB:          'Лабораторні',
  SEMINAR:      'Семінарські',
  CONSULTATION: 'Консультації',
  SPRS:         'СПРС',
}

/** Компактна відповідь про викладача (вкладена в assignment DTO) */
export interface TeacherRefDto {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  fullName: string
  positionName: string | null
  departmentName: string | null
  /** Ставка (0.25–1.5). Визначає ліміт: 720 × rate год/рік. */
  rate: number
}

/** Один вид заняття в рамках SubjectAssignmentDto */
export interface LessonAssignmentDto {
  id: string
  lessonType: LessonType
  subgroupNumber: number | null
  hours: number
  /** Викладач-виняток для цього виду. null → веде primaryTeacher батьківського subject. */
  overrideTeacher: TeacherRefDto | null
  /** Computed: overrideTeacher ?? parent.primaryTeacher */
  effectiveTeacher: TeacherRefDto | null
  createdAt: string
  updatedAt: string
}

/** Призначення навантаження на рівні освітнього компонента */
export interface SubjectAssignmentDto {
  id: string
  workingCurriculumId: string
  curriculumComponentTermId: string
  componentId: string
  componentCode: string | null
  componentName: string
  semesterNumber: number
  /** null = потоковий (лекції); string = конкретна група */
  groupId: string | null
  groupName: string | null
  academicYear: string
  /** Основний викладач компонента */
  primaryTeacher: TeacherRefDto | null
  status: LoadStatus
  orderNumber: string | null
  orderDate: string | null
  assignedById: string
  signedByDirectorId: string | null
  /** Режим розподілу практик/лаб для ОК-семестру */
  practiceMode: LoadDistributionMode
  labMode: LoadDistributionMode
  /** Сума годин по всіх lesson rows */
  totalHours: number
  lessons: LessonAssignmentDto[]
  /** Нормативні попередження (не блокуючі) */
  warnings: string[]
  createdAt: string
  updatedAt: string
}

export interface ConfirmAssignmentsPayload {
  workingCurriculumId: string
  orderNumber: string
  orderDate: string
}

export interface ConfirmResult {
  confirmed: number
  /** Нормативні попередження по наказу (не блокуючі) */
  warnings: string[]
}

export interface RevokeAssignmentsPayload {
  workingCurriculumId: string
  reason?: string
}

export interface RevokeResult {
  reverted: number
}

export interface SetDistributionModePayload {
  workingCurriculumId: string
  curriculumComponentTermId: string
  practiceMode?: LoadDistributionMode
  labMode?: LoadDistributionMode
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function teacherShortName(t: Pick<TeacherSummaryDto, 'lastName' | 'firstName' | 'middleName'>): string {
  const i = t.firstName[0] ?? ''
  const p = t.middleName?.[0] ?? ''
  return `${t.lastName} ${i}.${p ? `${p}.` : ''}`.trim()
}

export function teacherFullName(t: Pick<TeacherSummaryDto, 'lastName' | 'firstName' | 'middleName'>): string {
  return `${t.lastName} ${t.firstName} ${t.middleName ?? ''}`.trim()
}

export function teacherRefShortName(t: Pick<TeacherRefDto, 'lastName' | 'firstName' | 'middleName'>): string {
  const i = t.firstName[0] ?? ''
  const p = t.middleName?.[0] ?? ''
  return `${t.lastName} ${i}.${p ? `${p}.` : ''}`.trim()
}
