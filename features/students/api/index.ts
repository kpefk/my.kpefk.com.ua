'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError, type PaginatedResponse } from '@/types/api'

import type { StudentDto, StudentFilters } from '../types'

export const studentKeys = {
  all: ['students'] as const,
  list: (filters: StudentFilters) => [...studentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
}

export function useStudents(filters: StudentFilters) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => apiGet<StudentDto[] | PaginatedResponse<StudentDto>>(ENDPOINTS.STUDENTS.LIST),
    select: (data) => (Array.isArray(data) ? data : data.data),
    staleTime: 60_000,
  })
}

export function useSyncStudents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost(ENDPOINTS.EDBO.SYNC_STUDENTS),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
      toast.success('Синхронізацію студентів з ЄДЕБО завершено')
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : 'Помилка синхронізації'
      toast.error(message)
    },
  })
}
