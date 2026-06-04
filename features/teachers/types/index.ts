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
