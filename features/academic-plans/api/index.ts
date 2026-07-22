'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/types/api'

import type {
  ComponentType,
  CurriculumComponentDto,
  CurriculumComponentKind,
  CurriculumComponentTermDto,
  CurriculumFilters,
  CurriculumListItemDto,
  CurriculumSectionDto,
  CurriculumSectionType,
  CurriculumVersionDetailDto,
  CurriculumVersionSummaryDto,
  EducationalProgramDto,
  ElectiveBlockDto,
  ExamFormat,
  GroupCurriculumAssignmentDto,
  PracticeType,
  SpecialtyDto,
  TermControlForm,
  WorkingComponentTermDto,
  WorkingCurriculumDetailDto,
  WorkingCurriculumSummaryDto,
} from '../types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const curriculumKeys = {
  all: ['curricula'] as const,
  list: (filters: CurriculumFilters) => [...curriculumKeys.all, 'list', filters] as const,
  detail: (id: string) => [...curriculumKeys.all, 'detail', id] as const,
  versions: (curriculumId: string) =>
    [...curriculumKeys.all, 'versions', curriculumId] as const,
  version: (versionId: string) => [...curriculumKeys.all, 'version', versionId] as const,
  assignments: ['group-curriculum-assignments'] as const,
  assignmentsByGroup: (groupId: string) =>
    ['group-curriculum-assignments', 'group', groupId] as const,
  workingCurricula: ['working-curricula'] as const,
  workingCurriculum: (id: string) => ['working-curricula', 'detail', id] as const,
  workingByVersion: (versionId: string) =>
    ['working-curricula', 'by-version', versionId] as const,
}

// ─── Specialties + Programs ───────────────────────────────────────────────────

export function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: () => apiGet<SpecialtyDto[]>(ENDPOINTS.CURRICULUM.SPECIALTIES),
    staleTime: 5 * 60_000,
  })
}

export function useEducationalPrograms(enabled: boolean | string = true) {
  const specialtyId = typeof enabled === 'string' ? enabled : undefined
  const isEnabled = typeof enabled === 'boolean' ? enabled : true
  const url = specialtyId
    ? `${ENDPOINTS.CURRICULUM.PROGRAMS}?specialtyId=${specialtyId}`
    : ENDPOINTS.CURRICULUM.PROGRAMS
  return useQuery({
    queryKey: ['educational-programs', specialtyId ?? 'all'],
    queryFn: () => apiGet<EducationalProgramDto[]>(url),
    enabled: isEnabled,
    staleTime: 5 * 60_000,
  })
}

// ─── Curricula queries ────────────────────────────────────────────────────────

export function useCurricula(filters: CurriculumFilters) {
  return useQuery({
    queryKey: curriculumKeys.list(filters),
    queryFn: () => apiGet<CurriculumListItemDto[]>(ENDPOINTS.CURRICULUM.CURRICULA),
    staleTime: 60_000,
  })
}

export function useCurriculum(id: string | null) {
  return useQuery({
    queryKey: curriculumKeys.detail(id!),
    queryFn: () => apiGet<CurriculumListItemDto>(ENDPOINTS.CURRICULUM.CURRICULUM(id!)),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useCurriculumVersions(curriculumId: string | null) {
  return useQuery({
    queryKey: curriculumKeys.versions(curriculumId!),
    queryFn: () =>
      apiGet<CurriculumVersionSummaryDto[]>(ENDPOINTS.CURRICULUM.CURRICULUM_VERSIONS(curriculumId!)),
    enabled: !!curriculumId,
    staleTime: 60_000,
  })
}

export function useCurriculumVersion(versionId: string | null) {
  return useQuery({
    queryKey: curriculumKeys.version(versionId!),
    queryFn: () =>
      apiGet<CurriculumVersionDetailDto>(ENDPOINTS.CURRICULUM.VERSION(versionId!)),
    enabled: !!versionId,
    staleTime: 60_000,
  })
}

// ─── Curricula mutations ──────────────────────────────────────────────────────

export function useSyncStudyPrograms() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost(ENDPOINTS.EDBO.SYNC_STUDY_PROGRAMS),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educational-programs'] })
      toast.success('Синхронізацію освітніх програм з ЄДЕБО завершено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка синхронізації'
      toast.error(msg)
    },
  })
}

export function useDeleteCurriculum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (curriculumId: string) =>
      apiDelete(ENDPOINTS.CURRICULUM.CURRICULUM(curriculumId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.all })
      toast.success('Навчальний план видалено')
    },
    // Business errors ("план має версії") surfaced by global mutations.onError in providers.tsx.
  })
}

export function useCreateCurriculum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      programId: string
      educationForm: string
      admissionBasis: string
      entryYear: number
      studyDurationMonths: number
      totalEcts: number
      notes?: string
    }) => apiPost<CurriculumListItemDto>(ENDPOINTS.CURRICULUM.CURRICULA, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.all })
      toast.success('Навчальний план створено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка створення'
      toast.error(msg)
    },
  })
}

export function useCreateVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      curriculumId,
      data,
    }: {
      curriculumId: string
      data: {
        notes?: string
      }
    }) =>
      apiPost<CurriculumVersionSummaryDto>(
        ENDPOINTS.CURRICULUM.VERSION_CREATE(curriculumId),
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.versions(variables.curriculumId) })
      queryClient.invalidateQueries({ queryKey: curriculumKeys.detail(variables.curriculumId) })
      toast.success('Версію навчального плану створено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка створення версії'
      toast.error(msg)
    },
  })
}

export function usePublishVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (versionId: string) =>
      apiPost<CurriculumVersionSummaryDto>(ENDPOINTS.CURRICULUM.VERSION_PUBLISH(versionId)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(data.id) })
      queryClient.invalidateQueries({ queryKey: curriculumKeys.all })
      toast.success('Версію опубліковано')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка публікації'
      toast.error(msg)
    },
  })
}

export function useDeprecateVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (versionId: string) =>
      apiPost<CurriculumVersionSummaryDto>(ENDPOINTS.CURRICULUM.VERSION_DEPRECATE(versionId)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(data.id) })
      queryClient.invalidateQueries({ queryKey: curriculumKeys.all })
      toast.success('Версію позначено як застарілу')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка операції'
      toast.error(msg)
    },
  })
}

export function useDeleteVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ versionId }: { versionId: string; curriculumId: string }) =>
      apiDelete(ENDPOINTS.CURRICULUM.VERSION(versionId)),
    onSuccess: (_data, { curriculumId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.versions(curriculumId) })
      queryClient.invalidateQueries({ queryKey: curriculumKeys.detail(curriculumId) })
      queryClient.invalidateQueries({ queryKey: curriculumKeys.all })
      toast.success('Чернеткову версію видалено')
    },
    // Error handled by the global mutations.onError in providers.tsx.
  })
}

export function useDuplicateVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sourceVersionId,
      targetCurriculumId,
    }: {
      sourceVersionId: string
      targetCurriculumId: string
    }) =>
      apiPost<CurriculumVersionSummaryDto>(
        ENDPOINTS.CURRICULUM.VERSION_DUPLICATE(sourceVersionId, targetCurriculumId),
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: curriculumKeys.versions(variables.targetCurriculumId),
      })
      toast.success('Версію продубльовано як новий чернетковий план')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка дублювання'
      toast.error(msg)
    },
  })
}

// ─── Group assignments ────────────────────────────────────────────────────────

export function useGroupAssignments(params?: {
  groupId?: string
  versionId?: string
  activeOnly?: boolean
}) {
  const query = new URLSearchParams()
  if (params?.groupId) query.set('groupId', params.groupId)
  if (params?.versionId) query.set('versionId', params.versionId)
  if (params?.activeOnly) query.set('activeOnly', 'true')
  const url = `${ENDPOINTS.CURRICULUM.GROUP_ASSIGNMENTS}${query.toString() ? `?${query}` : ''}`

  return useQuery({
    queryKey: [...curriculumKeys.assignments, params ?? {}],
    queryFn: () => apiGet<GroupCurriculumAssignmentDto[]>(url),
    staleTime: 60_000,
  })
}

export function useCreateGroupAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      groupId: string
      curriculumId: string
      versionId: string
      effectiveFrom: string
      reason?: string
    }) => apiPost<GroupCurriculumAssignmentDto>(ENDPOINTS.CURRICULUM.GROUP_ASSIGNMENTS, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.assignments })
      toast.success('Групу прив\'язано до навчального плану')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка прив\'язки'
      toast.error(msg)
    },
  })
}

export function useCloseGroupAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) =>
      apiPatch<GroupCurriculumAssignmentDto>(
        ENDPOINTS.CURRICULUM.GROUP_ASSIGNMENT_CLOSE(assignmentId),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.assignments })
      toast.success('Призначення закрито')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка закриття'
      toast.error(msg)
    },
  })
}

// ─── Working curricula ────────────────────────────────────────────────────────

export function useWorkingCurricula(params?: { versionId?: string; academicYear?: string }) {
  const query = new URLSearchParams()
  if (params?.versionId) query.set('versionId', params.versionId)
  if (params?.academicYear) query.set('academicYear', params.academicYear)
  const url = `${ENDPOINTS.CURRICULUM.WORKING_CURRICULA}${query.toString() ? `?${query}` : ''}`

  return useQuery({
    queryKey: [...curriculumKeys.workingCurricula, params ?? {}],
    queryFn: () => apiGet<WorkingCurriculumSummaryDto[]>(url),
    staleTime: 60_000,
  })
}

export function useWorkingCurriculum(id: string | null) {
  return useQuery({
    queryKey: curriculumKeys.workingCurriculum(id!),
    queryFn: () =>
      apiGet<WorkingCurriculumDetailDto>(ENDPOINTS.CURRICULUM.WORKING_CURRICULUM(id!)),
    enabled: !!id,
    staleTime: 60_000,
  })
}

/** Робочий навчальний план групи (для пікера компонентів у перезарахуванні/мобільності). */
export function useGroupWorkingCurriculum(groupId: string | null) {
  return useQuery({
    queryKey: [...curriculumKeys.workingCurricula, 'by-group', groupId],
    queryFn: () =>
      apiGet<WorkingCurriculumDetailDto | null>(
        ENDPOINTS.CURRICULUM.GROUP_WORKING_CURRICULA(groupId!),
      ),
    enabled: !!groupId,
    staleTime: 60_000,
  })
}

export function useInitializeWorkingCurriculumTerms() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workingCurriculumId: string) =>
      apiPost<WorkingCurriculumDetailDto>(
        ENDPOINTS.CURRICULUM.WORKING_CURRICULUM_INITIALIZE_TERMS(workingCurriculumId),
      ),
    onSuccess: (data, id) => {
      // Instant update: populate cache with the response so the table appears immediately
      // without waiting for a refetch.
      queryClient.setQueryData(curriculumKeys.workingCurriculum(id), data)
      // Also refresh the list so isEmpty is up to date
      queryClient.invalidateQueries({ queryKey: curriculumKeys.workingCurricula })
      toast.success('Розподіл годин ініціалізовано')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка ініціалізації'
      toast.error(msg)
    },
  })
}

export function useDeleteWorkingCurriculum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(ENDPOINTS.CURRICULUM.WORKING_CURRICULUM(id)),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.workingCurricula })
      queryClient.removeQueries({ queryKey: curriculumKeys.workingCurriculum(id) })
      toast.success('Робочий план видалено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка видалення'
      toast.error(msg)
    },
  })
}

export function useCreateWorkingCurriculum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      versionId: string
      academicYear: string
      semesterNumbers: number[]
      notes?: string
    }) =>
      apiPost<WorkingCurriculumSummaryDto>(ENDPOINTS.CURRICULUM.WORKING_CURRICULA, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.workingCurricula })
      toast.success('Робочий навчальний план створено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка створення'
      toast.error(msg)
    },
  })
}

export function useUpdateWorkingComponentTerm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      termId,
      data,
    }: {
      termId: string
      workingCurriculumId: string
      data: {
        lectureHours: number
        practicalHours: number
        labHours: number
        seminarHours: number
        independentHours: number
        consultationHours: number
        weeklyLectureHours: number | null
        weeklyPracticalHours: number | null
        /** undefined = не чіпати поточне призначення; null = зняти; string = призначити */
        teacherId?: string | null
        controlWorksAuditoryCount?: number
        controlWorksIndependentCount?: number
        /** undefined = не чіпати; null = очистити; ExamFormat = встановити */
        examFormat?: ExamFormat | null
        /** undefined = не чіпати; null = очистити; number = встановити */
        practiceDurationWeeks?: number | null
        diplomaCommitteeSize?: number
      }
    }) =>
      apiPatch<WorkingComponentTermDto>(
        ENDPOINTS.CURRICULUM.WORKING_COMPONENT_TERM(termId),
        data,
      ),
    onSuccess: (updatedTerm, { workingCurriculumId }) => {
      // Merge the saved term into the detail cache — no extra network round-trip.
      queryClient.setQueryData<WorkingCurriculumDetailDto | undefined>(
        curriculumKeys.workingCurriculum(workingCurriculumId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            componentTerms: old.componentTerms.map((t) =>
              t.id === updatedTerm.id ? updatedTerm : t,
            ),
          }
        },
      )
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка збереження розподілу'
      toast.error(msg)
    },
  })
}

/**
 * Призначає або знімає викладача з конкретного WorkingCurriculumComponentTerm.
 * Надсилає лише teacherId — інші поля терму не зачіпаються (PATCH).
 */
export function useAssignTeacherToTerm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      termId,
      teacherId,
    }: {
      termId: string
      workingCurriculumId: string
      teacherId: string | null
    }) =>
      apiPatch<WorkingComponentTermDto>(
        ENDPOINTS.CURRICULUM.WORKING_COMPONENT_TERM(termId),
        { teacherId },
      ),
    onSuccess: (updatedTerm, { workingCurriculumId }) => {
      queryClient.setQueryData<WorkingCurriculumDetailDto | undefined>(
        curriculumKeys.workingCurriculum(workingCurriculumId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            componentTerms: old.componentTerms.map((t) =>
              t.id === updatedTerm.id ? updatedTerm : t,
            ),
          }
        },
      )
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка призначення викладача'
      toast.error(msg)
    },
  })
}

export function useApproveWorkingCurriculum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<WorkingCurriculumSummaryDto>(ENDPOINTS.CURRICULUM.WORKING_CURRICULUM_APPROVE(id)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.workingCurriculum(data.id) })
      queryClient.invalidateQueries({ queryKey: curriculumKeys.workingCurricula })
      toast.success('Робочий план затверджено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка затвердження'
      toast.error(msg)
    },
  })
}

// ─── Structure mutations ──────────────────────────────────────────────────────

export function useCreateSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      versionId,
      data,
    }: {
      versionId: string
      data: { name: string; sectionType: CurriculumSectionType; code?: string; orderIndex: number }
    }) => apiPost<CurriculumSectionDto>(ENDPOINTS.CURRICULUM.SECTIONS(versionId), data),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Розділ додано')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка додавання розділу'
      toast.error(msg)
    },
  })
}

export function useUpdateSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: string
      versionId: string
      data: Partial<{ name: string; sectionType: CurriculumSectionType; code: string; orderIndex: number }>
    }) => apiPatch<CurriculumSectionDto>(ENDPOINTS.CURRICULUM.SECTION(sectionId), data),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Розділ оновлено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка оновлення'
      toast.error(msg)
    },
  })
}

export function useDeleteSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sectionId }: { sectionId: string; versionId: string }) =>
      apiDelete(ENDPOINTS.CURRICULUM.SECTION(sectionId)),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Розділ видалено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка видалення'
      toast.error(msg)
    },
  })
}

export function useCreateElectiveBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: string
      versionId: string
      data: {
        name: string
        semesterNumber: number
        minSelections: number
        maxSelections: number
        orderIndex: number
      }
    }) => apiPost<ElectiveBlockDto>(ENDPOINTS.CURRICULUM.ELECTIVE_BLOCKS(sectionId), data),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Блок ВК додано')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка додавання блоку ВК'
      toast.error(msg)
    },
  })
}

export function useDeleteElectiveBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; versionId: string }) =>
      apiDelete(ENDPOINTS.CURRICULUM.ELECTIVE_BLOCK(id)),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Блок ВК видалено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка видалення блоку ВК'
      toast.error(msg)
    },
  })
}

export function useCreateComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: string
      versionId: string
      data: {
        name: string
        componentType: ComponentType
        componentKind?: CurriculumComponentKind
        code?: string | null
        totalEcts: number
        totalHours: number
        orderIndex: number
        isMandatory?: boolean
        practiceType?: PracticeType
        electiveBlockId?: string | null
      }
    }) => apiPost<CurriculumComponentDto>(ENDPOINTS.CURRICULUM.COMPONENTS(sectionId), data),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Компонент додано')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка додавання компонента'
      toast.error(msg)
    },
  })
}

export function useUpdateComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      componentId,
      data,
    }: {
      componentId: string
      versionId: string
      data: Partial<{
        name: string
        componentType: ComponentType
        componentKind: CurriculumComponentKind
        code: string | null
        totalEcts: number
        totalHours: number
        isMandatory: boolean
        practiceType: PracticeType
        electiveBlockId: string | null
      }>
    }) => apiPatch<CurriculumComponentDto>(ENDPOINTS.CURRICULUM.COMPONENT(componentId), data),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Компонент оновлено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка оновлення'
      toast.error(msg)
    },
  })
}

export function useDeleteComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ componentId }: { componentId: string; versionId: string }) =>
      apiDelete(ENDPOINTS.CURRICULUM.COMPONENT(componentId)),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Компонент видалено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка видалення'
      toast.error(msg)
    },
  })
}

export function useCreateComponentTerm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      componentId,
      data,
    }: {
      componentId: string
      versionId: string
      data: {
        semesterNumber: number
        ects?: number
        hours: number
        hoursPerWeek?: number
        controlForm?: TermControlForm
        hasCourseWork?: boolean
        hasCourseProject?: boolean
      }
    }) => apiPost<CurriculumComponentTermDto>(ENDPOINTS.CURRICULUM.COMPONENT_TERMS(componentId), data),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Семестр додано')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка додавання'
      toast.error(msg)
    },
  })
}

export function useUpdateComponentTerm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      termId,
      data,
    }: {
      termId: string
      versionId: string
      data: Partial<{
        ects: number
        hours: number
        hoursPerWeek: number
        controlForm: TermControlForm
        hasCourseWork: boolean
        hasCourseProject: boolean
      }>
    }) => apiPatch<CurriculumComponentTermDto>(ENDPOINTS.CURRICULUM.COMPONENT_TERM(termId), data),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Семестр оновлено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка оновлення'
      toast.error(msg)
    },
  })
}

export function useDeleteComponentTerm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ termId }: { termId: string; versionId: string }) =>
      apiDelete(ENDPOINTS.CURRICULUM.COMPONENT_TERM(termId)),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Семестр видалено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка видалення'
      toast.error(msg)
    },
  })
}

// ─── Component display projections ────────────────────────────────────────────

export function useCreateProjection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      versionId,
      data,
    }: {
      versionId: string
      data: {
        componentId: string
        targetSectionId: string
        displayOrder?: number
        displayMarker?: string
        displayNote?: string
      }
    }) =>
      apiPost(ENDPOINTS.CURRICULUM.COMPONENT_PROJECTIONS(versionId), data),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Компонент відображатиметься в обраному розділі')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка додавання проекції'
      toast.error(msg)
    },
  })
}

export function useDeleteProjection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectionId }: { projectionId: string; versionId: string }) =>
      apiDelete(ENDPOINTS.CURRICULUM.COMPONENT_PROJECTION(projectionId)),
    onSuccess: (_data, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: curriculumKeys.version(versionId) })
      toast.success('Відображення компонента в розділі видалено')
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : 'Помилка видалення проекції'
      toast.error(msg)
    },
  })
}
