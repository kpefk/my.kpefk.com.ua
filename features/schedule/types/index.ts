// ─── Schedule DTOs (mirror of backend src/schedule/dto/schedule.dto.ts) ───────

export type WeekParity = 'ODD' | 'EVEN' | 'EVERY'
export type ScheduleStatus = 'DRAFT' | 'PUBLISHED'
export type LessonType =
  | 'LECTURE'
  | 'PRACTICE'
  | 'LAB'
  | 'SEMINAR'
  | 'CONSULTATION'
  | 'SPRS'

export type ClassroomType =
  | 'LECTURE'
  | 'PRACTICE'
  | 'LAB'
  | 'COMPUTER'
  | 'SPORTS'
  | 'OTHER'

export type SubstitutionType =
  | 'CANCELLED'
  | 'TEACHER_CHANGE'
  | 'ROOM_CHANGE'
  | 'MOVED'

export interface ScheduleTeacherRef {
  id: string
  lastName: string
  firstName: string
  middleName: string | null
  shortName: string
}

export interface ScheduleClassroomRef {
  id: string
  number: string
  name: string
}

export interface ScheduleSubstitutionDto {
  id: string
  entryId: string
  date: string
  type: SubstitutionType
  newDayOfWeek: number | null
  newSlotNumber: number | null
  replacementTeacher: ScheduleTeacherRef | null
  replacementClassroom: ScheduleClassroomRef | null
  reason: string | null
  createdAt: string
}

export interface ScheduleEntryDto {
  id: string
  dayOfWeek: number
  slotNumber: number
  weekParity: WeekParity
  lessonType: LessonType
  subgroupNumber: number | null
  curriculumComponentTermId: string
  componentCode: string | null
  subjectName: string
  teacher: ScheduleTeacherRef | null
  classroom: ScheduleClassroomRef | null
  onlineUrl: string | null
  substitutions: ScheduleSubstitutionDto[]
  conflicts: string[]
  createdAt: string
  updatedAt: string
}

/** Запис у перегляді за викладачем/аудиторією (з прив'язкою до групи). */
export interface CrossScheduleEntryDto extends ScheduleEntryDto {
  groupId: string
  groupName: string
}

export interface ScheduleDto {
  id: string
  groupId: string
  groupName: string
  workingCurriculumId: string
  academicYear: string
  semesterNumber: number
  status: ScheduleStatus
  generatedAt: string | null
  homeroomDayOfWeek: number | null
  entries: ScheduleEntryDto[]
}

export interface ScheduleSettingsDto {
  maxPairsFullTime: number
  maxPairsPartTime: number | null
  homeroomCountsToLimit: boolean
}

export interface ScheduleResponseDto {
  hasWorkingCurriculum: boolean
  workingCurriculumId: string | null
  schedule: ScheduleDto | null
  warnings: string[]
}

export interface GenerateScheduleResultDto {
  schedule: ScheduleDto
  warnings: string[]
}

export interface GenerateAllGroupResultDto {
  groupId: string
  groupName: string
  /** Рільний номер семестру для цієї групи. */
  semesterNumber: number
  entries: number
  warnings: string[]
}

export interface GenerateAllResultDto {
  academicYear: string
  /** Позиція семестру в навчальному році: 1 = осінній, 2 = весняний. */
  term: number
  groupsProcessed: number
  totalEntries: number
  results: GenerateAllGroupResultDto[]
}

export interface EligibleGroupDto {
  groupId: string
  groupName: string
  hasWorkingCurriculum: boolean
  workingCurriculumId: string | null
  semesterNumbers: number[]
}

export interface AvailableLessonOptionDto {
  lessonType: LessonType
  defaultTeacher: ScheduleTeacherRef | null
}

export interface AvailableSubjectDto {
  curriculumComponentTermId: string
  componentCode: string | null
  componentName: string
  semesterNumber: number
  subgroupCount: number
  lessonOptions: AvailableLessonOptionDto[]
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface GenerateSchedulePayload {
  groupId: string
  academicYear: string
  semesterNumber: number
}

export interface GenerateAllPayload {
  academicYear: string
  semesterNumber: number
}

export interface CreateEntryPayload {
  groupId: string
  academicYear: string
  semesterNumber: number
  dayOfWeek: number
  slotNumber: number
  weekParity: WeekParity
  lessonType: LessonType
  subgroupNumber?: number | null
  curriculumComponentTermId: string
  teacherId?: string | null
  classroomId?: string | null
  onlineUrl?: string | null
}

export interface SwapEntriesPayload {
  entryAId: string
  entryBId: string
}

export interface UpdateEntryPayload {
  dayOfWeek?: number
  slotNumber?: number
  weekParity?: WeekParity
  lessonType?: LessonType
  subgroupNumber?: number | null
  teacherId?: string | null
  classroomId?: string | null
  onlineUrl?: string | null
}

export interface UpdateScheduleSettingsPayload {
  maxPairsFullTime?: number
  maxPairsPartTime?: number | null
  homeroomCountsToLimit?: boolean
}

export interface SetHomeroomPayload {
  groupId: string
  academicYear: string
  semesterNumber: number
  dayOfWeek: number | null
}

export interface CopySchedulePayload {
  fromScheduleId: string
  toGroupId: string
  toAcademicYear: string
  toSemesterNumber: number
  overwrite?: boolean
}

export interface MassReplacePayload {
  entryIds: string[]
  teacherId?: string | null
  classroomId?: string | null
}

export interface CreateSubstitutionPayload {
  entryId: string
  date: string
  type: SubstitutionType
  newDayOfWeek?: number | null
  newSlotNumber?: number | null
  replacementTeacherId?: string | null
  replacementClassroomId?: string | null
  reason?: string | null
}

// ─── Display constants (mirror backend schedule.constants.ts) ─────────────────

export interface BellTime {
  slot: number
  start: string
  end: string
}

export const BELL_TIMES: BellTime[] = [
  { slot: 1, start: '08:30', end: '09:50' },
  { slot: 2, start: '10:00', end: '11:20' },
  { slot: 3, start: '11:50', end: '13:10' },
  { slot: 4, start: '13:20', end: '14:40' },
]

/** Виховна година (5-й слот, раз на тиждень). */
export const HOMEROOM_BELL: BellTime = { slot: 5, start: '14:50', end: '15:30' }

export const WORKING_DAYS: { day: number; short: string; long: string }[] = [
  { day: 1, short: 'Пн', long: 'Понеділок' },
  { day: 2, short: 'Вт', long: 'Вівторок' },
  { day: 3, short: 'Ср', long: 'Середа' },
  { day: 4, short: 'Чт', long: 'Четвер' },
  { day: 5, short: 'Пт', long: "П'ятниця" },
]

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  LECTURE: 'Лекція',
  PRACTICE: 'Практична',
  LAB: 'Лабораторна',
  SEMINAR: 'Семінар',
  CONSULTATION: 'Консультація',
  SPRS: 'СПРС',
}

/** Кольори бейджа типу заняття (узгоджено з components/schedule/ScheduleClient.tsx). */
export const LESSON_TYPE_COLOR: Record<LessonType, string> = {
  LECTURE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PRACTICE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LAB: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SEMINAR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CONSULTATION: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  SPRS: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
}

export const WEEK_PARITY_LABELS: Record<WeekParity, string> = {
  EVERY: 'Щотижня',
  ODD: 'Чисельник (непарний)',
  EVEN: 'Знаменник (парний)',
}

export const CLASSROOM_TYPE_LABELS: Record<ClassroomType, string> = {
  LECTURE: 'Лекційна',
  PRACTICE: 'Практична',
  LAB: 'Лабораторна',
  COMPUTER: "Комп'ютерний клас",
  SPORTS: 'Спортивна зала',
  OTHER: 'Універсальна',
}

export const SUBSTITUTION_TYPE_LABELS: Record<SubstitutionType, string> = {
  CANCELLED: 'Скасовано',
  TEACHER_CHANGE: 'Заміна викладача',
  ROOM_CHANGE: 'Заміна аудиторії',
  MOVED: 'Перенесено',
}

/** Чи видиме заняття на тижні обраної парності. */
export function isVisibleOnParity(
  entryParity: WeekParity,
  viewParity: 'ODD' | 'EVEN',
): boolean {
  return entryParity === 'EVERY' || entryParity === viewParity
}
