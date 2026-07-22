export interface GroupCurator {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  positionName: string | null
}

export interface GroupDto {
  id: string
  name: string
  course: number | null
  courseId: number | null
  facultyName: string | null
  educationFormName: string | null
  educationFormId: number | null
  qualificationGroupName: string | null
  fullSpecialityName: string | null
  studyProgramName: string | null
  studentsCount: number | null

  curatorId: string | null
  curator: GroupCurator | null

  /** Дата архівації (усі студенти завершили навчання / відраховані). null = активна. */
  archivedAt: string | null

  createdAt: string
  modifyDate: string | null
}

export interface GroupFilters {
  search: string
  course: number | null
  facultyName: string | null
  educationFormName: string | null
  hasCurator: boolean | null
  /** null = лише активні (за замовчуванням), true = лише архів, false = всі */
  archived: boolean | null
}

export const DEFAULT_GROUP_FILTERS: GroupFilters = {
  search: '',
  course: null,
  facultyName: null,
  educationFormName: null,
  hasCurator: null,
  archived: null,
}

export function isGroupArchived(group: GroupDto): boolean {
  // Boolean(), а не `!== null`: якщо бекенд ще не віддає поле (undefined) — група вважається активною.
  return Boolean(group.archivedAt)
}

export interface CuratorOption {
  id: string
  fullName: string
  positionName: string | null
}

export function getGroupCuratorName(curator: GroupCurator): string {
  return `${curator.lastName} ${curator.firstName} ${curator.middleName ?? ''}`.trim()
}

export const formatDate = (date: string | null | undefined): string =>
  date
    ? new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(date))
    : '—'
