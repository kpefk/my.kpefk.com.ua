'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError, type PaginatedResponse } from '@/types/api'

import type {
  AttestationDueRowDto,
  CreateAttestationPayload,
  QualificationUpgradeDto,
  TeacherAttestationDto,
  TeacherDto,
  TeacherFilters,
} from '../types'

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

// ─── Attestation (атестація педпрацівників) ───────────────────────────────────

const attestationKey = (teacherId: string | null) =>
  [...teacherKeys.all, 'attestations', teacherId] as const

export function useTeacherAttestations(teacherId: string | null) {
  return useQuery({
    queryKey: attestationKey(teacherId),
    queryFn: () =>
      apiGet<TeacherAttestationDto[]>(ENDPOINTS.STAFF.ATTESTATIONS(teacherId!)),
    enabled: !!teacherId,
    staleTime: 60_000,
  })
}

export function useCreateAttestation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teacherId, ...payload }: CreateAttestationPayload & { teacherId: string }) =>
      apiPost<TeacherAttestationDto>(ENDPOINTS.STAFF.ATTESTATIONS(teacherId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
      toast.success('Запис атестації додано')
    },
    onError: (error: unknown) =>
      toast.error(error instanceof ApiError ? error.message : 'Помилка збереження'),
  })
}

export function useUpdateAttestation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      teacherId,
      id,
      ...payload
    }: Partial<CreateAttestationPayload> & { teacherId: string; id: string }) =>
      apiPatch<TeacherAttestationDto>(ENDPOINTS.STAFF.ATTESTATION_ITEM(teacherId, id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
      toast.success('Запис атестації оновлено')
    },
    onError: (error: unknown) =>
      toast.error(error instanceof ApiError ? error.message : 'Помилка збереження'),
  })
}

export function useDeleteAttestation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teacherId, id }: { teacherId: string; id: string }) =>
      apiDelete(ENDPOINTS.STAFF.ATTESTATION_ITEM(teacherId, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
      toast.success('Запис атестації видалено')
    },
    onError: (error: unknown) =>
      toast.error(error instanceof ApiError ? error.message : 'Помилка видалення'),
  })
}

export function useAttestationsDue(year?: number) {
  return useQuery({
    queryKey: [...teacherKeys.all, 'attestations-due', year ?? 'current'] as const,
    queryFn: () => {
      const qs = year ? `?year=${year}` : ''
      return apiGet<AttestationDueRowDto[]>(`${ENDPOINTS.STAFF.ATTESTATIONS_DUE}${qs}`)
    },
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
