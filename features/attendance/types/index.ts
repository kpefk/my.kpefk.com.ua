// ─── Attendance DTOs (mirror backend src/attendance/dto/attendance.dto.ts) ────

import type { LessonType } from '@/features/schedule/types'

export type AttendanceStatus = 'ABSENT' | 'PRESENT' | 'LATE'

/** Один слот заняття на дату (для списку «заняття дня»). */
export interface LessonSlotDto {
  scheduleEntryId: string
  groupId: string
  groupName: string
  curriculumComponentTermId: string
  componentCode: string | null
  subjectName: string
  slotNumber: number
  startTime: string
  endTime: string
  subgroupNumber: number | null
  classroomNumber: string | null
  isSubstituteTeacher: boolean
  hasSession: boolean
  sessionId: string | null
  topic: string | null
}

export interface AttendanceRowDto {
  studentId: string
  fullName: string
  userId: string | null
  status: AttendanceStatus
  grade: number | null
  comment: string | null
}

export interface LessonSessionDto {
  id: string
  date: string
  academicYear: string
  semesterNumber: number
  groupId: string
  groupName: string
  curriculumComponentTermId: string
  subjectName: string
  componentCode: string | null
  slotNumber: number
  startTime: string
  endTime: string
  subgroupNumber: number
  lessonType: LessonType
  topic: string | null
  teacherId: string
  canEdit: boolean
  rows: AttendanceRowDto[]
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface OpenSessionPayload {
  scheduleEntryId: string
  date: string
  lessonType?: LessonType
  topic?: string
}

export interface UpdateSessionPayload {
  topic?: string
  lessonType?: LessonType
}

export interface AttendanceRecordInput {
  studentId: string
  status: AttendanceStatus
  grade?: number | null
  comment?: string | null
}

export interface SaveRecordsPayload {
  records: AttendanceRecordInput[]
}

// ─── Display constants ────────────────────────────────────────────────────────

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  ABSENT: 'Відсутній',
  PRESENT: 'Присутній',
  LATE: 'Запізнився',
}

/** Кольори маркерів присутності (узгоджено з макетом). */
export const ATTENDANCE_STATUS_COLOR: Record<AttendanceStatus, string> = {
  ABSENT:
    'border-red-500 text-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500',
  LATE:
    'border-orange-500 text-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500',
  PRESENT:
    'border-green-500 text-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500',
}

/** Порядок маркерів у рядку (Відсутній / Запізнився / Присутній — як у макеті). */
export const ATTENDANCE_STATUS_ORDER: AttendanceStatus[] = ['ABSENT', 'LATE', 'PRESENT']
