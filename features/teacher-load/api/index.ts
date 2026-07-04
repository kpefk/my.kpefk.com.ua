'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  AllTeachersLoadDto,
  ConfirmAssignmentsPayload,
  ConfirmResult,
  DiplomaStudentRowDto,
  LessonAssignmentDto,
  MyTeacherLoadDto,
  RevokeAssignmentsPayload,
  RevokeResult,
  SetDistributionModePayload,
  SubjectAssignmentDto,
  SupervisionRole,
  TeacherLoadDto,
} from '../types'

// ─── Query key factory ────────────────────────────────────────────────────────

export const teacherLoadKeys = {
  all: ['teacher-load'] as const,
  my: (academicYear?: string) => [...teacherLoadKeys.all, 'my', academicYear ?? ''] as const,
  allTeachers: (academicYear: string) =>
    [...teacherLoadKeys.all, 'all-teachers', academicYear] as const,
  byWorkingCurriculum: (id: string) =>
    [...teacherLoadKeys.all, 'by-wc', id] as const,
  byTeacher: (teacherId: string, academicYear?: string) =>
    [...teacherLoadKeys.all, 'by-teacher', teacherId, academicYear ?? ''] as const,
  assignments: (workingCurriculumId: string) =>
    [...teacherLoadKeys.all, 'subject-assignments', workingCurriculumId] as const,
  diplomaSupervision: (workingCurriculumId: string, componentTermId: string) =>
    [...teacherLoadKeys.all, 'diploma-supervision', workingCurriculumId, componentTermId] as const,
}

// ─── My load + manager overview ───────────────────────────────────────────────

export function useMyTeacherLoad(academicYear?: string, enabled = true) {
  return useQuery({
    queryKey: teacherLoadKeys.my(academicYear),
    queryFn: () =>
      apiGet<MyTeacherLoadDto>(
        ENDPOINTS.TEACHER_LOAD.MY +
          (academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : ''),
      ),
    staleTime: 60_000,
    enabled,
  })
}

export function useAllTeachersLoad(academicYear: string) {
  return useQuery({
    queryKey: teacherLoadKeys.allTeachers(academicYear),
    queryFn: () =>
      apiGet<AllTeachersLoadDto>(
        `${ENDPOINTS.TEACHER_LOAD.BY_ALL_TEACHERS}?academicYear=${encodeURIComponent(academicYear)}`,
      ),
    staleTime: 60_000,
    enabled: academicYear !== '',
  })
}

// ─── Read-only load computation ───────────────────────────────────────────────

export function useTeacherLoad(workingCurriculumId: string) {
  return useQuery({
    queryKey: teacherLoadKeys.byWorkingCurriculum(workingCurriculumId),
    queryFn: () =>
      apiGet<TeacherLoadDto>(
        ENDPOINTS.TEACHER_LOAD.BY_WORKING_CURRICULUM(workingCurriculumId),
      ),
    staleTime: 30_000,
  })
}

export function useTeacherLoadByTeacher(teacherId: string, academicYear?: string) {
  return useQuery({
    queryKey: teacherLoadKeys.byTeacher(teacherId, academicYear),
    queryFn: () =>
      apiGet<TeacherLoadDto[]>(
        ENDPOINTS.TEACHER_LOAD.BY_TEACHER(teacherId) +
          (academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : ''),
      ),
    staleTime: 30_000,
  })
}

// ─── Subject assignments ──────────────────────────────────────────────────────

export function useAssignments(workingCurriculumId: string) {
  return useQuery({
    queryKey: teacherLoadKeys.assignments(workingCurriculumId),
    queryFn: () =>
      apiGet<SubjectAssignmentDto[]>(
        `${ENDPOINTS.TEACHER_LOAD.SUBJECT_ASSIGNMENTS}?workingCurriculumId=${encodeURIComponent(workingCurriculumId)}`,
      ),
    staleTime: 30_000,
    enabled: workingCurriculumId !== '',
  })
}

export function useGenerateAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workingCurriculumId: string) =>
      apiPost<SubjectAssignmentDto[]>(
        ENDPOINTS.TEACHER_LOAD.SUBJECT_ASSIGNMENTS_GENERATE(workingCurriculumId),
        {},
      ),
    onSuccess: (data, workingCurriculumId) => {
      queryClient.setQueryData<SubjectAssignmentDto[]>(
        teacherLoadKeys.assignments(workingCurriculumId),
        data,
      )
      toast.success(`Згенеровано ${data.length} записів навантаження`)
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка генерації навантаження'
      toast.error(msg)
    },
  })
}

/** PATCH primaryTeacherId на рівні subject assignment */
export function useUpdateSubjectAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      primaryTeacherId,
    }: {
      id: string
      workingCurriculumId: string
      primaryTeacherId?: string | null
    }) =>
      apiPatch<SubjectAssignmentDto>(
        ENDPOINTS.TEACHER_LOAD.SUBJECT_ASSIGNMENT(id),
        { primaryTeacherId },
      ),
    onSuccess: (updated, { workingCurriculumId }) => {
      queryClient.setQueryData<SubjectAssignmentDto[]>(
        teacherLoadKeys.assignments(workingCurriculumId),
        (old) =>
          old !== undefined
            ? old.map((a) => (a.id === updated.id ? updated : a))
            : old,
      )
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка призначення викладача'
      toast.error(msg)
    },
  })
}

/** PATCH overrideTeacherId на рівні lesson assignment */
export function useUpdateLessonAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      overrideTeacherId,
      subgroupNumber,
    }: {
      id: string
      subjectAssignmentId: string
      workingCurriculumId: string
      overrideTeacherId?: string | null
      subgroupNumber?: number | null
    }) =>
      apiPatch<LessonAssignmentDto>(
        ENDPOINTS.TEACHER_LOAD.LESSON_ASSIGNMENT(id),
        { overrideTeacherId, subgroupNumber },
      ),
    onSuccess: (updatedLesson, { workingCurriculumId, subjectAssignmentId }) => {
      queryClient.setQueryData<SubjectAssignmentDto[]>(
        teacherLoadKeys.assignments(workingCurriculumId),
        (old) =>
          old !== undefined
            ? old.map((sa) =>
                sa.id === subjectAssignmentId
                  ? {
                      ...sa,
                      lessons: sa.lessons.map((l) =>
                        l.id === updatedLesson.id ? updatedLesson : l,
                      ),
                    }
                  : sa,
              )
            : old,
      )
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка призначення викладача'
      toast.error(msg)
    },
  })
}

export function useConfirmAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConfirmAssignmentsPayload) =>
      apiPost<ConfirmResult>(ENDPOINTS.TEACHER_LOAD.SUBJECT_ASSIGNMENTS_CONFIRM, payload),
    onSuccess: (result, { workingCurriculumId }) => {
      toast.success(`Навантаження підтверджено наказом (${result.confirmed} записів)`)
      void queryClient.invalidateQueries({
        queryKey: teacherLoadKeys.assignments(workingCurriculumId),
      })
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка підтвердження наказу'
      toast.error(msg)
    },
  })
}

/** Змінює режим розподілу практик/лаб і повертає перегенерований список. */
export function useSetDistributionMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetDistributionModePayload) =>
      apiPatch<SubjectAssignmentDto[]>(ENDPOINTS.TEACHER_LOAD.DISTRIBUTION_MODE, payload),
    onSuccess: (data, { workingCurriculumId }) => {
      queryClient.setQueryData<SubjectAssignmentDto[]>(
        teacherLoadKeys.assignments(workingCurriculumId),
        data,
      )
      // Зведення залежить від режиму — інвалідовуємо.
      void queryClient.invalidateQueries({
        queryKey: teacherLoadKeys.byWorkingCurriculum(workingCurriculumId),
      })
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка зміни режиму розподілу'
      toast.error(msg)
    },
  })
}

export function useRevokeAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RevokeAssignmentsPayload) =>
      apiPost<RevokeResult>(ENDPOINTS.TEACHER_LOAD.SUBJECT_ASSIGNMENTS_REVOKE, payload),
    onSuccess: (result, { workingCurriculumId }) => {
      toast.success(`Наказ скасовано, повернено в чернетку (${result.reverted} записів)`)
      void queryClient.invalidateQueries({
        queryKey: teacherLoadKeys.assignments(workingCurriculumId),
      })
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка скасування наказу'
      toast.error(msg)
    },
  })
}

// ─── Diploma supervision (п.20 Наказу №686) ──────────────────────────────────

export function useDiplomaSupervisionAssignments(
  workingCurriculumId: string,
  componentTermId: string,
) {
  return useQuery({
    queryKey: teacherLoadKeys.diplomaSupervision(workingCurriculumId, componentTermId),
    queryFn: () =>
      apiGet<DiplomaStudentRowDto[]>(
        `${ENDPOINTS.TEACHER_LOAD.DIPLOMA_SUPERVISION}?workingCurriculumId=${encodeURIComponent(workingCurriculumId)}&componentTermId=${encodeURIComponent(componentTermId)}`,
      ),
    staleTime: 30_000,
    enabled: workingCurriculumId !== '' && componentTermId !== '',
  })
}

export function useAssignDiplomaSupervisor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      studentId: string
      curriculumComponentTermId: string
      workingCurriculumId: string
      teacherId: string
      role: SupervisionRole
    }) => apiPost<{ warnings: string[] }>(ENDPOINTS.TEACHER_LOAD.DIPLOMA_SUPERVISION, payload),
    onSuccess: (result, { workingCurriculumId, curriculumComponentTermId }) => {
      result.warnings.forEach((w) => toast.warning(w))
      void queryClient.invalidateQueries({
        queryKey: teacherLoadKeys.diplomaSupervision(workingCurriculumId, curriculumComponentTermId),
      })
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка призначення керівника'
      toast.error(msg)
    },
  })
}

export function useUnassignDiplomaSupervisor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; workingCurriculumId: string; componentTermId: string }) =>
      apiDelete<void>(ENDPOINTS.TEACHER_LOAD.DIPLOMA_SUPERVISION_ITEM(id)),
    onSuccess: (_data, { workingCurriculumId, componentTermId }) => {
      void queryClient.invalidateQueries({
        queryKey: teacherLoadKeys.diplomaSupervision(workingCurriculumId, componentTermId),
      })
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка зняття призначення'
      toast.error(msg)
    },
  })
}
