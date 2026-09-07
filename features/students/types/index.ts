/**
 * Рядок списку студентів. Дзеркалить серверну проекцію `STUDENT_LIST_SELECT`
 * — без ПДн (РНОКПП, паспорт, студквиток): вони доступні лише в профілі особи.
 */
export interface StudentDto {
  id: string
  userId: string | null
  personId: number
  educationId: number

  // Персональні дані
  personFIO: string
  birthday: string | null
  personSexName: string | null

  // Навчання
  licenseYear: number | null
  educationDateBegin: string | null
  educationDateEnd: string | null
  facultyName: string | null
  qualificationGroupName: string | null
  educationFormId: number | null
  educationFormName: string | null
  isDualForm: boolean | null
  isSecondHigher: boolean | null
  isShortTerm: boolean | null
  fullSpecialityName: string | null
  studyProgramName: string | null
  professionInfo: string | null
  courseId: number | null
  courseName: string | null
  groupName: string | null

  // Статус
  expelEducationTypeName: string | null
  academicLeaveTypeName: string | null

  // Іноземці
  foreignTypeName: string | null

  // Переведення на бюджет
  budgetTransferCategoryName: string | null

  // Службові
  createdAt: string
  modifyDate: string | null
}

export interface StudentFilters {
  search: string
  courseId: number | null
  groupName: string | null
  educationFormId: number | null
  /** null = всі, true = навчається, false = відраховано/академвідпустка */
  isActive: boolean | null
}

export const DEFAULT_STUDENT_FILTERS: StudentFilters = {
  search: '',
  courseId: null,
  groupName: null,
  educationFormId: null,
  // Типово показуємо лише тих, хто навчається — випускники/відраховані за потреби через фільтр.
  isActive: true,
}

export type StudentStatus = 'ACADEMIC_LEAVE' | 'EXPELLED' | 'COMPLETED' | 'STUDYING'

/** Навчання завершено, якщо планова дата закінчення (educationDateEnd) вже минула. */
export function isStudentCompleted(s: StudentDto): boolean {
  if (!s.educationDateEnd) return false
  return new Date(s.educationDateEnd).getTime() < Date.now()
}

/** Єдина точка визначення статусу навчання студента (пріоритет: академ → відраховано → завершено). */
export function studentStatus(s: StudentDto): StudentStatus {
  if (s.academicLeaveTypeName) return 'ACADEMIC_LEAVE'
  if (s.expelEducationTypeName) return 'EXPELLED'
  if (isStudentCompleted(s)) return 'COMPLETED'
  return 'STUDYING'
}

/** Студент вважається активним (навчається), лише якщо статус — STUDYING. */
export function isStudentActive(s: StudentDto): boolean {
  return studentStatus(s) === 'STUDYING'
}

export const formatDate = (date: string | null | undefined): string =>
  date
    ? new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(date))
    : '—'
