'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiDelete, apiGet, apiPost } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type { AcademicMobilityDto, CreateAcademicMobilityPayload } from '../types'

export const mobilityKeys = {
  all: ['academic-mobility'] as const,
  list: () => [...mobilityKeys.all, 'list'] as const,
}

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

export function useAcademicMobilities() {
  return useQuery({
    queryKey: mobilityKeys.list(),
    queryFn: () => apiGet<AcademicMobilityDto[]>(ENDPOINTS.ACADEMIC_MOBILITY.LIST),
    staleTime: 30_000,
  })
}

export function useCreateMobility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAcademicMobilityPayload) =>
      apiPost<AcademicMobilityDto>(ENDPOINTS.ACADEMIC_MOBILITY.LIST, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mobilityKeys.all })
      toast.success('Запис мобільності створено (чернетка)')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося створити запис')),
  })
}

export function useConfirmMobility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiPost<AcademicMobilityDto>(ENDPOINTS.ACADEMIC_MOBILITY.CONFIRM(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mobilityKeys.all })
      toast.success('Результати визнано — оцінки внесено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося підтвердити')),
  })
}

export function useRevertMobility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiPost<AcademicMobilityDto>(ENDPOINTS.ACADEMIC_MOBILITY.REVERT(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mobilityKeys.all })
      toast.success('Повернуто в чернетку — оцінки прибрано')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося повернути в чернетку')),
  })
}

export function useDeleteMobility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(ENDPOINTS.ACADEMIC_MOBILITY.BY_ID(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mobilityKeys.all })
      toast.success('Чернетку видалено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося видалити')),
  })
}
