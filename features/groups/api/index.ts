'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError, type PaginatedResponse } from '@/types/api'

import type { GroupDto, GroupFilters } from '../types'

export const groupKeys = {
  all: ['groups'] as const,
  list: (filters: GroupFilters) => [...groupKeys.all, 'list', filters] as const,
  detail: (id: string) => [...groupKeys.all, 'detail', id] as const,
}

// TODO: backend — GET /groups → GroupDto[] | PaginatedResponse<GroupDto>
// Groups are aggregated from the students table, grouped by groupName.
// Expected response shape: { id, name, course, courseId, facultyName,
//   educationFormName, educationFormId, qualificationGroupName,
//   fullSpecialityName, studyProgramName, studentsCount,
//   curatorId, curator, createdAt, modifyDate }
export function useGroups(filters: GroupFilters) {
  return useQuery({
    queryKey: groupKeys.list(filters),
    queryFn: () => apiGet<GroupDto[] | PaginatedResponse<GroupDto>>(ENDPOINTS.GROUPS.LIST),
    select: (data) => (Array.isArray(data) ? data : data.data),
    staleTime: 60_000,
  })
}

// TODO: backend — GET /groups/:id → GroupDto (with curator and students list)
export function useGroup(id: string | null) {
  return useQuery({
    queryKey: groupKeys.detail(id!),
    queryFn: () => apiGet<GroupDto>(ENDPOINTS.GROUPS.BY_ID(id!)),
    enabled: !!id,
    staleTime: 60_000,
  })
}

// TODO: backend — PATCH /groups/:id/curator
// body: { teacherId: string | null }
// response: GroupDto
export function useAssignCurator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, teacherId }: { groupId: string; teacherId: string | null }) =>
      apiPatch<GroupDto>(ENDPOINTS.GROUPS.ASSIGN_CURATOR(groupId), { teacherId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
      toast.success(variables.teacherId ? 'Куратора призначено' : 'Куратора знято')
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Помилка збереження'
      toast.error(message)
    },
  })
}

export function useSyncGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost(ENDPOINTS.EDBO.SYNC_ALL),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all })
      toast.success('Синхронізацію з ЄДЕБО завершено')
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Помилка синхронізації'
      toast.error(message)
    },
  })
}
