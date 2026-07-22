'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPut } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type { GroupRatingDto, SetRatingBonusPayload } from '../types'

// ─── Query key factory ────────────────────────────────────────────────────────

export const ratingKeys = {
  all: ['rating'] as const,
  group: (groupId: string, academicYear: string, semesterNumber: number) =>
    [...ratingKeys.all, 'group', groupId, academicYear, semesterNumber] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useGroupRating(
  groupId: string,
  academicYear: string,
  semesterNumber: number,
) {
  return useQuery({
    queryKey: ratingKeys.group(groupId, academicYear, semesterNumber),
    queryFn: () => {
      const params = new URLSearchParams({
        academicYear,
        semesterNumber: String(semesterNumber),
      })
      return apiGet<GroupRatingDto>(`${ENDPOINTS.RATING.GROUP(groupId)}?${params}`)
    },
    staleTime: 30_000,
    enabled: groupId !== '' && academicYear !== '',
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSetRatingBonus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetRatingBonusPayload) =>
      apiPut<{ ok: boolean }>(ENDPOINTS.RATING.BONUS, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all })
      toast.success('Додатковий бал збережено')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Не вдалося зберегти додатковий бал'
      toast.error(msg)
    },
  })
}

// ─── Download ─────────────────────────────────────────────────────────────────

export async function downloadRatingXlsx(
  groupId: string,
  academicYear: string,
  semesterNumber: number,
  groupName: string,
): Promise<void> {
  const params = new URLSearchParams({
    academicYear,
    semesterNumber: String(semesterNumber),
  })
  const blob = await apiGet<Blob>(
    `${ENDPOINTS.RATING.GROUP_EXPORT(groupId)}?${params}`,
    { responseType: 'blob' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Рейтинг_${groupName}_${academicYear}_сем${semesterNumber}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
