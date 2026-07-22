'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type { CreateCreditRecognitionPayload, CreditRecognitionDto } from '../types'

export const recognitionKeys = {
  all: ['credit-recognitions'] as const,
  list: () => [...recognitionKeys.all, 'list'] as const,
  detail: (id: string) => [...recognitionKeys.all, 'detail', id] as const,
}

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

export function useCreditRecognitions() {
  return useQuery({
    queryKey: recognitionKeys.list(),
    queryFn: () => apiGet<CreditRecognitionDto[]>(ENDPOINTS.CREDIT_RECOGNITION.LIST),
    staleTime: 30_000,
  })
}

export function useCreateCreditRecognition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCreditRecognitionPayload) =>
      apiPost<CreditRecognitionDto>(ENDPOINTS.CREDIT_RECOGNITION.LIST, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recognitionKeys.all })
      toast.success('Акт перезарахування створено (чернетка)')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося створити акт')),
  })
}

export function useConfirmRecognition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<CreditRecognitionDto>(ENDPOINTS.CREDIT_RECOGNITION.CONFIRM(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recognitionKeys.all })
      toast.success('Перезарахування підтверджено — оцінки внесено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося підтвердити')),
  })
}

export function useRevertRecognition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<CreditRecognitionDto>(ENDPOINTS.CREDIT_RECOGNITION.REVERT(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recognitionKeys.all })
      toast.success('Повернуто в чернетку — оцінки прибрано')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося повернути в чернетку')),
  })
}

export function useDeleteRecognition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: boolean }>(ENDPOINTS.CREDIT_RECOGNITION.BY_ID(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recognitionKeys.all })
      toast.success('Чернетку видалено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося видалити')),
  })
}
