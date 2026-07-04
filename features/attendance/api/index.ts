'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  AttendanceSummaryDto,
  LessonSessionDto,
  LessonSlotDto,
  OpenSessionPayload,
  SaveRecordsPayload,
  StudentSemesterSummaryDto,
  UpdateSessionPayload,
} from '../types'

// ─── Query key factory ────────────────────────────────────────────────────────

export const attendanceKeys = {
  all: ['attendance'] as const,
  lessons: (date: string) => [...attendanceKeys.all, 'lessons', date] as const,
  session: (id: string) => [...attendanceKeys.all, 'session', id] as const,
  summary: (componentTermId: string, groupId: string, academicYear: string, semesterNumber: number) =>
    [...attendanceKeys.all, 'summary', componentTermId, groupId, academicYear, semesterNumber] as const,
  studentSummary: (studentId: string, academicYear: string, semesterNumber: number) =>
    [...attendanceKeys.all, 'student-summary', studentId, academicYear, semesterNumber] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useLessons(date: string) {
  return useQuery({
    queryKey: attendanceKeys.lessons(date),
    queryFn: () =>
      apiGet<LessonSlotDto[]>(
        `${ENDPOINTS.ATTENDANCE.LESSONS}?date=${encodeURIComponent(date)}`,
      ),
    staleTime: 30_000,
    enabled: date !== '',
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: attendanceKeys.session(id),
    queryFn: () => apiGet<LessonSessionDto>(ENDPOINTS.ATTENDANCE.SESSION(id)),
    staleTime: 15_000,
    enabled: id !== '',
  })
}

// ─── Mutations ──────────────────────────────────────────────────────────────────

/** Кладе оновлену сесію в кеш і освіжає список занять дня (hasSession/тема). */
function cacheSession(
  queryClient: ReturnType<typeof useQueryClient>,
  session: LessonSessionDto,
) {
  queryClient.setQueryData(attendanceKeys.session(session.id), session)
  queryClient.invalidateQueries({
    queryKey: attendanceKeys.lessons(session.date),
  })
}

export function useOpenSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: OpenSessionPayload) =>
      apiPost<LessonSessionDto>(ENDPOINTS.ATTENDANCE.SESSIONS, payload),
    onSuccess: (session) => cacheSession(queryClient, session),
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Не вдалося відкрити заняття'
      toast.error(msg)
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionPayload }) =>
      apiPatch<LessonSessionDto>(ENDPOINTS.ATTENDANCE.SESSION(id), data),
    onSuccess: (session) => {
      cacheSession(queryClient, session)
      toast.success('Збережено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Не вдалося оновити заняття'
      toast.error(msg)
    },
  })
}

export function useSaveRecords() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaveRecordsPayload }) =>
      apiPut<LessonSessionDto>(ENDPOINTS.ATTENDANCE.SESSION_RECORDS(id), data),
    onSuccess: (session) => {
      cacheSession(queryClient, session)
      toast.success('Відвідуваність збережено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Не вдалося зберегти'
      toast.error(msg)
    },
  })
}

export function useCarryOver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<LessonSessionDto>(ENDPOINTS.ATTENDANCE.SESSION_CARRY_OVER(id)),
    onSuccess: (session) => {
      cacheSession(queryClient, session)
      toast.success('Відвідуваність перенесено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Не вдалося перенести'
      toast.error(msg)
    },
  })
}

// ─── Summary queries ────────────────────────────────────────────────────────

export function useAttendanceSummary(
  componentTermId: string,
  groupId: string,
  academicYear: string,
  semesterNumber: number,
) {
  return useQuery({
    queryKey: attendanceKeys.summary(componentTermId, groupId, academicYear, semesterNumber),
    queryFn: () => {
      const params = new URLSearchParams({
        componentTermId,
        groupId,
        academicYear,
        semesterNumber: String(semesterNumber),
      })
      return apiGet<AttendanceSummaryDto>(`${ENDPOINTS.ATTENDANCE.SUMMARY}?${params}`)
    },
    enabled:
      componentTermId !== '' &&
      groupId !== '' &&
      academicYear !== '' &&
      semesterNumber > 0,
  })
}

export function useStudentSemesterSummary(
  studentId: string,
  academicYear: string,
  semesterNumber: number,
) {
  return useQuery({
    queryKey: attendanceKeys.studentSummary(studentId, academicYear, semesterNumber),
    queryFn: () => {
      const params = new URLSearchParams({
        academicYear,
        semesterNumber: String(semesterNumber),
      })
      return apiGet<StudentSemesterSummaryDto>(
        `${ENDPOINTS.ATTENDANCE.STUDENT_SUMMARY(studentId)}?${params}`,
      )
    },
    enabled: studentId !== '' && academicYear !== '' && semesterNumber > 0,
  })
}
