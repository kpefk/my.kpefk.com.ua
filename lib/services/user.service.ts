import { api } from '@/lib/api/axios'
import type { UserDto } from './auth.service'

// ── Extended profile types ────────────────────────────────────────
// Типи відповідають Prisma-схемі на сервері. DateTime → string (ISO).

export interface StudentProfileDto {
  id: string
  personFIO: string
  birthday: string | null
  personSexName: string | null
  educationFormName: string | null
  courseId: number | null
  courseName: string | null
  groupName: string | null
  facultyName: string | null
  qualificationGroupName: string | null
  fullSpecialityName: string | null
  studyProgramName: string | null
  professionInfo: string | null
  educationDateBegin: string | null
  educationDateEnd: string | null
  licenseYear: number | null
  isDualForm: boolean | null
  isSecondHigher: boolean | null
  isShortTerm: boolean | null
  expelEducationTypeName: string | null
  academicLeaveTypeName: string | null
  // Чутливі поля — відображаються лише для власного профілю
  rnokpp: string | null
  passportDocumentSeries: string | null
  passportDocumentNumbers: string | null
  studentTicketSeries: string | null
  studentTicketNumbers: string | null
  createdAt: string
  modifyDate: string | null
}

export interface TeacherProfileDto {
  id: string
  lastName: string
  firstName: string
  middleName: string | null
  birthday: string | null
  personSexName: string | null
  isActive: boolean
  positionName: string | null
  positionPluralityName: string | null
  positionPlace: string | null
  universityFacultyFullName: string | null
  universityFacultyShortName: string | null
  universityFacultyChairFullName: string | null
  universityFacultyChairShortName: string | null
  profession: string | null
  rang: string | null
  dignityNames: string | null
  skillName: string | null
  stageTypeName: string | null
  stage: number | null
  dateRecruit: string | null
  dateFire: string | null
  coursesInfo: string | null
  createdAt: string
  modifyDate: string | null
}

export interface ProfileDto extends Omit<UserDto, 'student' | 'teacher'> {
  isTwoFactorEnabled: boolean
  student: StudentProfileDto | null
  teacher: TeacherProfileDto | null
}

// ── Service ───────────────────────────────────────────────────────

export const userService = {
  /** Профіль поточного авторизованого користувача. Доступний для всіх. */
  getProfile(): Promise<ProfileDto> {
    return api.get<ProfileDto>('/users/profile').then((r) => r.data)
  },

  /** Профіль довільного користувача. Потребує ролі ADMINISTRATOR. */
  getById(id: string): Promise<ProfileDto> {
    return api.get<ProfileDto>(`/users/by-id/${id}`).then((r) => r.data)
  },
}
