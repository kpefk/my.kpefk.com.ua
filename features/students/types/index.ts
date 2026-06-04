export interface StudentDto {
  id: string
  userId: string | null
  universityId: number
  personId: number
  educationId: number
  personCodeU: string
  educationHistoryActualId: number
  dateBegin: string | null
  dateEnd: string | null
  historyTypeId: number

  // Персональні дані
  personFIO: string
  birthday: string | null
  personSexName: string | null

  // Навчання
  licenseYear: number | null
  educationDateBegin: string | null
  educationDateEnd: string | null
  facultyName: string | null
  qualificationGroupId: number | null
  qualificationGroupName: string | null
  educationFormId: number | null
  educationFormName: string | null
  isDualForm: boolean | null
  isSecondHigher: boolean | null
  isShortTerm: boolean | null
  fullSpecialityName: string | null
  universityStudyProgramId: number | null
  studyProgramName: string | null
  professionInfo: string | null
  courseId: number | null
  courseName: string | null
  groupName: string | null

  // Статус
  expelEducationTypeName: string | null
  academicLeaveTypeName: string | null

  // Іноземці
  foreignTypeId: number | null
  foreignTypeName: string | null

  // Переведення на бюджет
  budgetTransferCategoryId: number | null
  budgetTransferCategoryName: string | null

  isForPhdRenewal: boolean | null

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
  isActive: null,
}

/** Студент вважається активним, якщо немає причини відрахування та академвідпустки */
export function isStudentActive(s: StudentDto): boolean {
  return !s.expelEducationTypeName && !s.academicLeaveTypeName
}

export const formatDate = (date: string | null | undefined): string =>
  date
    ? new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(date))
    : '—'
