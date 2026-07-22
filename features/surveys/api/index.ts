'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  CreateSurveyPayload,
  StudentSurveyDto,
  SubmitAnswerInput,
  SurveyAdminDto,
  SurveyQuestionInput,
  SurveyResultsDto,
  SurveyStatus,
  UpdateSurveyPayload,
} from '../types'

// ─── Query key factory ────────────────────────────────────────────────────────

export const surveysKeys = {
  all: ['surveys'] as const,
  my: () => [...surveysKeys.all, 'my'] as const,
  list: () => [...surveysKeys.all, 'list'] as const,
  detail: (id: string) => [...surveysKeys.all, 'detail', id] as const,
  results: (id: string) => [...surveysKeys.all, 'results', id] as const,
}

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

// ─── Student ──────────────────────────────────────────────────────────────────

export function useMySurveys() {
  return useQuery({
    queryKey: surveysKeys.my(),
    queryFn: () => apiGet<StudentSurveyDto[]>(ENDPOINTS.SURVEYS.MY),
    staleTime: 60_000,
  })
}

export function useSubmitSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ surveyId, answers }: { surveyId: string; answers: SubmitAnswerInput[] }) =>
      apiPost<{ ok: boolean }>(ENDPOINTS.SURVEYS.SUBMIT(surveyId), { answers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surveysKeys.my() })
      toast.success('Дякуємо! Відповіді збережено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося зберегти відповіді')),
  })
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useSurveys() {
  return useQuery({
    queryKey: surveysKeys.list(),
    queryFn: () => apiGet<SurveyAdminDto[]>(ENDPOINTS.SURVEYS.LIST),
    staleTime: 30_000,
  })
}

export function useSurveyResults(id: string) {
  return useQuery({
    queryKey: surveysKeys.results(id),
    queryFn: () => apiGet<SurveyResultsDto>(ENDPOINTS.SURVEYS.RESULTS(id)),
    staleTime: 30_000,
    enabled: id !== '',
  })
}

export function useCreateSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSurveyPayload) =>
      apiPost<SurveyAdminDto>(ENDPOINTS.SURVEYS.LIST, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surveysKeys.list() })
      toast.success('Кампанію створено (чернетка)')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося створити кампанію')),
  })
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateSurveyPayload & { id: string }) =>
      apiPatch<SurveyAdminDto>(ENDPOINTS.SURVEYS.BY_ID(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surveysKeys.all })
      toast.success('Кампанію оновлено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося оновити кампанію')),
  })
}

export function useSetSurveyQuestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, questions }: { id: string; questions: SurveyQuestionInput[] }) =>
      apiPut<SurveyAdminDto>(ENDPOINTS.SURVEYS.QUESTIONS(id), { questions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surveysKeys.all })
      toast.success('Питання збережено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося зберегти питання')),
  })
}

export function useSetSurveyStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SurveyStatus }) =>
      apiPatch<SurveyAdminDto>(ENDPOINTS.SURVEYS.STATUS(id), { status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: surveysKeys.all })
      const msg =
        updated.status === 'OPEN'
          ? 'Опитування відкрито для студентів'
          : updated.status === 'DRAFT'
            ? 'Опитування повернуто в чернетку'
            : 'Опитування закрито'
      toast.success(msg)
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося змінити статус')),
  })
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(ENDPOINTS.SURVEYS.BY_ID(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: surveysKeys.list() })
      toast.success('Чернетку видалено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося видалити кампанію')),
  })
}
