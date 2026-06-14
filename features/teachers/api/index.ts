'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError, type PaginatedResponse } from '@/types/api'

import type { QualificationUpgradeDto, TeacherDto, TeacherFilters } from '../types'

export const teacherKeys = {
  all: ['teachers'] as const,
  list: (filters: TeacherFilters) => [...teacherKeys.all, 'list', filters] as const,
  detail: (id: string) => [...teacherKeys.all, 'detail', id] as const,
}

export function useTeachers(filters: TeacherFilters) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: () => apiGet<TeacherDto[] | PaginatedResponse<TeacherDto>>(ENDPOINTS.STAFF.LIST),
    select: (data) => (Array.isArray(data) ? data : data.data),
    staleTime: 60_000,
  })
}

export function useQualificationUpgrades(teacherId: string | null) {
  return useQuery({
    queryKey: [...teacherKeys.all, 'qualification-upgrades', teacherId] as const,
    queryFn: () => apiGet<QualificationUpgradeDto[]>(ENDPOINTS.STAFF.QUALIFICATION_UPGRADES(teacherId!)),
    enabled: !!teacherId,
    staleTime: 60_000,
  })
}

export function useSyncStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost(ENDPOINTS.EDBO.SYNC_STAFF),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
      toast.success('Синхронізацію з ЄДЕБО завершено')
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Помилка синхронізації'
      toast.error(message)
    },
  })
}
