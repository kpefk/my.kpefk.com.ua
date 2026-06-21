'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPost } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type { UniversityDto, UniversitySyncResult } from '../types'

export const institutionKeys = {
  all: ['institution'] as const,
  info: () => [...institutionKeys.all, 'info'] as const,
}

export function useUniversity() {
  return useQuery({
    queryKey: institutionKeys.info(),
    queryFn: () => apiGet<UniversityDto | null>(ENDPOINTS.UNIVERSITY.INFO),
    staleTime: 5 * 60_000,
  })
}

export function useSyncUniversity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiPost<UniversitySyncResult>(ENDPOINTS.EDBO.SYNC_UNIVERSITY),
    onSuccess: (result) => {
      toast.success(`Дані закладу оновлено${result.name ? `: ${result.name}` : ''}`)
      void queryClient.invalidateQueries({ queryKey: institutionKeys.info() })
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Помилка синхронізації закладу'
      toast.error(msg)
    },
  })
}
