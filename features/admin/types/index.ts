import type { TwoFactorMethod } from '@/lib/services/auth.service'
import type { UserRole } from '@/lib/types/user-role.types'

export type { TwoFactorMethod }

export interface AdminUserDto {
  id: string
  email: string
  role: UserRole
  isActive: boolean
  isFirstLogin: boolean
  isTwoFactorEnabled: boolean
  twoFactorMethod: TwoFactorMethod
  createdAt: string
  updatedAt: string
  student?: {
    personFIO: string | null
    groupName: string | null
  } | null
  teacher?: {
    lastName: string | null
    firstName: string | null
    middleName: string | null
    positionName: string | null
  } | null
}

export interface UnlinkedStudentDto {
  id: string
  personFIO: string
  groupName: string | null
  courseName: string | null
}

export interface UnlinkedTeacherDto {
  id: string
  lastName: string
  firstName: string
  middleName: string | null
  positionName: string | null
}

export interface CreateUserDto {
  email: string
  role: UserRole
  studentId?: string
  teacherId?: string
}

export interface UpdateUserDto {
  email?: string
  role?: UserRole
  isActive?: boolean
}

export interface UserFilters {
  search: string
  role: UserRole | null
  isActive: boolean | null
}

export const DEFAULT_USER_FILTERS: UserFilters = {
  search: '',
  role: null,
  isActive: null,
}

export function getUserDisplayName(u: AdminUserDto): string {
  if (u.teacher) {
    return [u.teacher.lastName, u.teacher.firstName, u.teacher.middleName]
      .filter(Boolean)
      .join(' ')
  }
  if (u.student?.personFIO) return u.student.personFIO
  return u.email
}


export const formatDate = (date: string | null | undefined): string =>
  date
    ? new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(date))
    : '—'
