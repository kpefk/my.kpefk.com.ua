'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  BulkGradeEntryPayload,
  CreateSemesterGradePayload,
  GradeScaleInfoDto,
  GradeSheetDto,
  GradeWeightSettingsDto,
  SemesterGradeDto,
  StudentTranscriptDto,
  TeacherDisciplineDto,
} from '../types'

// ─── Query key factory ────────────────────────────────────────────────────────

export const gradesKeys = {
  all: ['grades'] as const,
  gradeSheet: (componentTermId: string, groupId: string, academicYear: string) =>
    [...gradesKeys.all, 'sheet', componentTermId, groupId, academicYear] as const,
  studentTranscript: (studentId: string, academicYear?: string, semesterNumber?: number) =>
    [...gradesKeys.all, 'transcript', studentId, academicYear, semesterNumber] as const,
  retakeHistory: (studentId: string, componentTermId: string) =>
    [...gradesKeys.all, 'retakes', studentId, componentTermId] as const,
  myDisciplines: (academicYear: string) =>
    [...gradesKeys.all, 'my-disciplines', academicYear] as const,
  scale: (componentTermId: string) =>
    [...gradesKeys.all, 'scale', componentTermId] as const,
  weightSettings: () => [...gradesKeys.all, 'weight-settings'] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useGradeSheet(
  componentTermId: string,
  groupId: string,
  academicYear: string,
) {
  return useQuery({
    queryKey: gradesKeys.gradeSheet(componentTermId, groupId, academicYear),
    queryFn: () => {
      const params = new URLSearchParams({ groupId, academicYear })
      return apiGet<GradeSheetDto>(
        `${ENDPOINTS.GRADES.BY_COMPONENT_TERM(componentTermId)}?${params}`,
      )
    },
    enabled: componentTermId !== '' && groupId !== '' && academicYear !== '',
  })
}

export function useStudentTranscript(
  studentId: string,
  academicYear?: string,
  semesterNumber?: number,
) {
  return useQuery({
    queryKey: gradesKeys.studentTranscript(studentId, academicYear, semesterNumber),
    queryFn: () => {
      const params = new URLSearchParams()
      if (academicYear) params.set('academicYear', academicYear)
      if (semesterNumber !== undefined) params.set('semesterNumber', String(semesterNumber))
      const qs = params.toString()
      return apiGet<StudentTranscriptDto>(
        `${ENDPOINTS.GRADES.BY_STUDENT(studentId)}${qs ? `?${qs}` : ''}`,
      )
    },
    enabled: studentId !== '',
  })
}

export function useRetakeHistory(studentId: string, componentTermId: string) {
  return useQuery({
    queryKey: gradesKeys.retakeHistory(studentId, componentTermId),
    queryFn: () => {
      const params = new URLSearchParams({ studentId, componentTermId })
      return apiGet<SemesterGradeDto[]>(`${ENDPOINTS.GRADES.RETAKE_HISTORY}?${params}`)
    },
    enabled: studentId !== '' && componentTermId !== '',
  })
}

export function useMyDisciplines(academicYear: string) {
  return useQuery({
    queryKey: gradesKeys.myDisciplines(academicYear),
    queryFn: () => {
      const params = new URLSearchParams({ academicYear })
      return apiGet<TeacherDisciplineDto[]>(
        `${ENDPOINTS.GRADES.MY_DISCIPLINES}?${params}`,
      )
    },
    enabled: academicYear !== '',
  })
}

export function useGradeScaleInfo(componentTermId: string) {
  return useQuery({
    queryKey: gradesKeys.scale(componentTermId),
    queryFn: () => apiGet<GradeScaleInfoDto>(ENDPOINTS.GRADES.SCALE(componentTermId)),
    staleTime: 5 * 60_000,
    enabled: componentTermId !== '',
  })
}

/** Глобальна вагова схема формули підказки підсумкової оцінки. */
export function useGradeWeightSettings() {
  return useQuery({
    queryKey: gradesKeys.weightSettings(),
    queryFn: () => apiGet<GradeWeightSettingsDto>(ENDPOINTS.GRADES.WEIGHT_SETTINGS),
    staleTime: 5 * 60_000,
  })
}

// ─── Download ────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadVidomist(
  componentTermId: string,
  groupId: string,
  academicYear: string,
  subjectName: string,
): Promise<void> {
  const params = new URLSearchParams({ groupId, academicYear })
  const blob = await apiGet<Blob>(
    `${ENDPOINTS.GRADES.VIDOMIST(componentTermId)}?${params}`,
    { responseType: 'blob' },
  )
  triggerDownload(blob, `Відомість_${subjectName}.docx`)
}

export async function downloadJournal(
  componentTermId: string,
  groupId: string,
  academicYear: string,
  semesterNumber: number,
  subjectName: string,
): Promise<void> {
  const params = new URLSearchParams({
    groupId,
    academicYear,
    semesterNumber: String(semesterNumber),
  })
  const blob = await apiGet<Blob>(
    `${ENDPOINTS.ATTENDANCE.JOURNAL(componentTermId)}?${params}`,
    { responseType: 'blob' },
  )
  triggerDownload(blob, `Журнал_${subjectName}.docx`)
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useRecordGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSemesterGradePayload) =>
      apiPost<SemesterGradeDto>(ENDPOINTS.GRADES.RECORD, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.all })
      toast.success('Оцінку збережено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Не вдалося зберегти оцінку'
      toast.error(msg)
    },
  })
}

export function useRecordGradesBulk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkGradeEntryPayload) =>
      apiPost<SemesterGradeDto[]>(ENDPOINTS.GRADES.BULK, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.all })
      toast.success('Оцінки збережено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Не вдалося зберегти оцінки'
      toast.error(msg)
    },
  })
}

export function useUpdateGradeWeightSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GradeWeightSettingsDto) =>
      apiPatch<GradeWeightSettingsDto>(ENDPOINTS.GRADES.WEIGHT_SETTINGS, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(gradesKeys.weightSettings(), data)
      queryClient.invalidateQueries({ queryKey: gradesKeys.all })
      toast.success('Вагову схему оновлено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Не вдалося оновити вагову схему'
      toast.error(msg)
    },
  })
}
