export interface ClassroomPhoto {
  url: string
  googleFileId: string
  order: number
}

export interface ClassroomTeacher {
  id: string
  lastName: string
  firstName: string
  middleName: string | null
  positionName: string | null
  universityFacultyChairShortName: string | null
}

export interface ClassroomDto {
  id: string
  number: string
  name: string
  photos: ClassroomPhoto[]
  teacherId: string | null
  teacher: ClassroomTeacher | null
  passportGoogleFileId: string | null
  passportUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateClassroomInput {
  number: string
  name: string
  teacherId?: string | null
}

export interface UpdateClassroomInput {
  number?: string
  name?: string
  teacherId?: string | null
}

export interface ClassroomFilters {
  search: string
  hasTeacher: boolean | null
  hasPhotos: boolean | null
}

export const DEFAULT_CLASSROOM_FILTERS: ClassroomFilters = {
  search: '',
  hasTeacher: null,
  hasPhotos: null,
}

export function getTeacherFullName(t: ClassroomTeacher): string {
  return [t.lastName, t.firstName, t.middleName].filter(Boolean).join(' ')
}

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
