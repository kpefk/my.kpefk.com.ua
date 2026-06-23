'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  AvailableSubjectDto,
  CopySchedulePayload,
  CreateEntryPayload,
  CreateSubstitutionPayload,
  CrossScheduleEntryDto,
  EligibleGroupDto,
  GenerateAllPayload,
  GenerateAllResultDto,
  GenerateSchedulePayload,
  GenerateScheduleResultDto,
  MassReplacePayload,
  ScheduleDto,
  ScheduleResponseDto,
  ScheduleSettingsDto,
  SetHomeroomPayload,
  SwapEntriesPayload,
  UpdateEntryPayload,
  UpdateScheduleSettingsPayload,
} from '../types'

// ─── Query key factory ────────────────────────────────────────────────────────

export const scheduleKeys = {
  all: ['schedule'] as const,
  allGroups: (academicYear: string) =>
    [...scheduleKeys.all, 'all-groups', academicYear] as const,
  eligibleGroups: (academicYear: string) =>
    [...scheduleKeys.all, 'eligible-groups', academicYear] as const,
  detail: (groupId: string, academicYear: string, semesterNumber: number) =>
    [...scheduleKeys.all, 'detail', groupId, academicYear, semesterNumber] as const,
  availableSubjects: (groupId: string, academicYear: string, semesterNumber: number) =>
    [...scheduleKeys.all, 'available-subjects', groupId, academicYear, semesterNumber] as const,
  settings: () => [...scheduleKeys.all, 'settings'] as const,
  byTeacher: (teacherId: string, academicYear: string, semesterNumber: number) =>
    [...scheduleKeys.all, 'by-teacher', teacherId, academicYear, semesterNumber] as const,
  byClassroom: (classroomId: string, academicYear: string, semesterNumber: number) =>
    [...scheduleKeys.all, 'by-classroom', classroomId, academicYear, semesterNumber] as const,
  audit: (scheduleId: string) => [...scheduleKeys.all, 'audit', scheduleId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useEligibleGroups(academicYear: string) {
  return useQuery({
    queryKey: scheduleKeys.eligibleGroups(academicYear),
    queryFn: () =>
      apiGet<EligibleGroupDto[]>(
        `${ENDPOINTS.SCHEDULE.ELIGIBLE_GROUPS}?academicYear=${encodeURIComponent(academicYear)}`,
      ),
    staleTime: 60_000,
    enabled: academicYear !== '',
  })
}

export function useAllSchedules(academicYear: string, enabled: boolean) {
  return useQuery({
    queryKey: scheduleKeys.allGroups(academicYear),
    queryFn: () =>
      apiGet<ScheduleDto[]>(
        `${ENDPOINTS.SCHEDULE.ALL}?academicYear=${encodeURIComponent(academicYear)}`,
      ),
    staleTime: 30_000,
    enabled: enabled && academicYear !== '',
  })
}

export function useSchedule(
  groupId: string,
  academicYear: string,
  semesterNumber: number,
) {
  return useQuery({
    queryKey: scheduleKeys.detail(groupId, academicYear, semesterNumber),
    queryFn: () =>
      apiGet<ScheduleResponseDto>(
        `${ENDPOINTS.SCHEDULE.BASE}?groupId=${encodeURIComponent(groupId)}` +
          `&academicYear=${encodeURIComponent(academicYear)}` +
          `&semesterNumber=${semesterNumber}`,
      ),
    staleTime: 15_000,
    enabled: groupId !== '' && academicYear !== '',
  })
}

export function useAvailableSubjects(
  groupId: string,
  academicYear: string,
  semesterNumber: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: scheduleKeys.availableSubjects(groupId, academicYear, semesterNumber),
    queryFn: () =>
      apiGet<AvailableSubjectDto[]>(
        `${ENDPOINTS.SCHEDULE.AVAILABLE_SUBJECTS}?groupId=${encodeURIComponent(groupId)}` +
          `&academicYear=${encodeURIComponent(academicYear)}` +
          `&semesterNumber=${semesterNumber}`,
      ),
    staleTime: 60_000,
    enabled: enabled && groupId !== '' && academicYear !== '',
  })
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

/** Записує оновлений ScheduleDto у кеш GET /schedule. */
function patchScheduleCache(
  queryClient: ReturnType<typeof useQueryClient>,
  schedule: ScheduleDto,
) {
  queryClient.setQueryData<ScheduleResponseDto>(
    scheduleKeys.detail(
      schedule.groupId,
      schedule.academicYear,
      schedule.semesterNumber,
    ),
    (old) =>
      old
        ? { ...old, schedule, hasWorkingCurriculum: true }
        : {
            hasWorkingCurriculum: true,
            workingCurriculumId: schedule.workingCurriculumId,
            schedule,
            warnings: [],
          },
  )
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GenerateSchedulePayload) =>
      apiPost<GenerateScheduleResultDto>(ENDPOINTS.SCHEDULE.GENERATE, payload),
    onSuccess: (result) => {
      patchScheduleCache(queryClient, result.schedule)
      const placed = result.schedule.entries.length
      if (result.warnings.length > 0) {
        toast.warning(
          `Розклад згенеровано (${placed} занять), ${result.warnings.length} попереджень`,
        )
      } else {
        toast.success(`Розклад згенеровано: ${placed} занять`)
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка генерації розкладу'
      toast.error(msg)
    },
  })
}

export function useGenerateAll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GenerateAllPayload) =>
      apiPost<GenerateAllResultDto>(ENDPOINTS.SCHEDULE.GENERATE_ALL, payload),
    onSuccess: (result) => {
      // Зачіпає всі групи — інвалідуємо весь кеш розкладу.
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
      const groupWarnings = result.results.filter((r) => r.warnings.length > 0).length
      if (groupWarnings > 0) {
        toast.warning(
          `Згенеровано ${result.groupsProcessed} груп (${result.totalEntries} занять), ` +
            `${groupWarnings} з попередженнями`,
        )
      } else {
        toast.success(
          `Згенеровано розклад: ${result.groupsProcessed} груп, ${result.totalEntries} занять`,
        )
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка масової генерації'
      toast.error(msg)
    },
  })
}

export function useCreateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEntryPayload) =>
      apiPost<ScheduleDto>(ENDPOINTS.SCHEDULE.ENTRIES, payload),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success('Заняття додано')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка додавання заняття'
      toast.error(msg)
    },
  })
}

/** Створює кілька занять поспіль (для поділу на підгрупи) — один тост. */
export function useCreateEntries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payloads: CreateEntryPayload[]) => {
      let last: ScheduleDto | null = null
      for (const p of payloads) {
        last = await apiPost<ScheduleDto>(ENDPOINTS.SCHEDULE.ENTRIES, p)
      }
      if (!last) throw new Error('Немає занять для додавання')
      return last
    },
    onSuccess: (schedule, payloads) => {
      patchScheduleCache(queryClient, schedule)
      toast.success(
        payloads.length > 1
          ? `Додано ${payloads.length} підгрупи`
          : 'Заняття додано',
      )
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка додавання заняття'
      toast.error(msg)
    },
  })
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntryPayload }) =>
      apiPatch<ScheduleDto>(ENDPOINTS.SCHEDULE.ENTRY(id), data),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success('Заняття оновлено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка оновлення заняття'
      toast.error(msg)
    },
  })
}

export function useSwapEntries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SwapEntriesPayload) =>
      apiPost<ScheduleDto>(ENDPOINTS.SCHEDULE.ENTRIES_SWAP, data),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка переміщення заняття'
      toast.error(msg)
    },
  })
}

export function useMassReplace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MassReplacePayload) =>
      apiPost<ScheduleDto>(ENDPOINTS.SCHEDULE.ENTRIES_MASS_REPLACE, data),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success('Заміну застосовано')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка масової заміни'
      toast.error(msg)
    },
  })
}

// ─── Homeroom (ТЗ §3.5) ─────────────────────────────────────────────────────────

export function useSetHomeroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SetHomeroomPayload) =>
      apiPost<ScheduleDto>(ENDPOINTS.SCHEDULE.HOMEROOM, data),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success('Виховну годину оновлено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка збереження виховної години'
      toast.error(msg)
    },
  })
}

// ─── Copy (ТЗ §3.8) ───────────────────────────────────────────────────────────

export function useCopySchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CopySchedulePayload) =>
      apiPost<ScheduleDto>(ENDPOINTS.SCHEDULE.COPY, data),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success('Розклад скопійовано')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка копіювання розкладу'
      toast.error(msg)
    },
  })
}

// ─── Substitutions (ТЗ §3.8, §7.3) ──────────────────────────────────────────────

export function useUpsertSubstitution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSubstitutionPayload) =>
      apiPost<ScheduleDto>(ENDPOINTS.SCHEDULE.SUBSTITUTIONS, data),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success('Заміну збережено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка збереження заміни'
      toast.error(msg)
    },
  })
}

export function useDeleteSubstitution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<ScheduleDto>(ENDPOINTS.SCHEDULE.SUBSTITUTION(id)),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success('Заміну видалено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка видалення заміни'
      toast.error(msg)
    },
  })
}

// ─── Settings (ТЗ §3.4) ─────────────────────────────────────────────────────────

export function useScheduleSettings() {
  return useQuery({
    queryKey: scheduleKeys.settings(),
    queryFn: () => apiGet<ScheduleSettingsDto>(ENDPOINTS.SCHEDULE.SETTINGS),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateScheduleSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateScheduleSettingsPayload) =>
      apiPatch<ScheduleSettingsDto>(ENDPOINTS.SCHEDULE.SETTINGS, data),
    onSuccess: (settings) => {
      queryClient.setQueryData(scheduleKeys.settings(), settings)
      toast.success('Налаштування збережено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка збереження налаштувань'
      toast.error(msg)
    },
  })
}

// ─── Teacher / classroom views (ТЗ §3.10) ────────────────────────────────────────

export function useScheduleByTeacher(
  teacherId: string,
  academicYear: string,
  semesterNumber: number,
) {
  return useQuery({
    queryKey: scheduleKeys.byTeacher(teacherId, academicYear, semesterNumber),
    queryFn: () =>
      apiGet<CrossScheduleEntryDto[]>(
        `${ENDPOINTS.SCHEDULE.BY_TEACHER(teacherId)}` +
          `?academicYear=${encodeURIComponent(academicYear)}` +
          `&semesterNumber=${semesterNumber}`,
      ),
    staleTime: 30_000,
    enabled: teacherId !== '' && academicYear !== '',
  })
}

export function useScheduleByClassroom(
  classroomId: string,
  academicYear: string,
  semesterNumber: number,
) {
  return useQuery({
    queryKey: scheduleKeys.byClassroom(classroomId, academicYear, semesterNumber),
    queryFn: () =>
      apiGet<CrossScheduleEntryDto[]>(
        `${ENDPOINTS.SCHEDULE.BY_CLASSROOM(classroomId)}` +
          `?academicYear=${encodeURIComponent(academicYear)}` +
          `&semesterNumber=${semesterNumber}`,
      ),
    staleTime: 30_000,
    enabled: classroomId !== '' && academicYear !== '',
  })
}

// ─── ICS export (ТЗ §3.11) ──────────────────────────────────────────────────────

/** Завантажує .ics-файл розкладу групи в браузері. */
export async function downloadScheduleIcs(
  groupId: string,
  academicYear: string,
  semesterNumber: number,
): Promise<void> {
  const res = await api.get(ENDPOINTS.SCHEDULE.EXPORT_ICS, {
    params: { groupId, academicYear, semesterNumber },
    responseType: 'blob',
  })
  const blob = new Blob([res.data as BlobPart], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `schedule-${academicYear}-sem${semesterNumber}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete<ScheduleDto>(ENDPOINTS.SCHEDULE.ENTRY(id)),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success('Заняття видалено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка видалення заняття'
      toast.error(msg)
    },
  })
}

export function usePublishSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      apiPost<ScheduleDto>(
        publish ? ENDPOINTS.SCHEDULE.PUBLISH(id) : ENDPOINTS.SCHEDULE.UNPUBLISH(id),
      ),
    onSuccess: (schedule) => {
      patchScheduleCache(queryClient, schedule)
      toast.success(
        schedule.status === 'PUBLISHED' ? 'Розклад опубліковано' : 'Повернено в чернетку',
      )
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка зміни статусу'
      toast.error(msg)
    },
  })
}
