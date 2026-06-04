'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

import { apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  CancellationDto,
  EnrollOrderDto,
  ExaminationDto,
  PersonRequestCategoryDto,
} from '../types'

export const entranceKeys = {
  all: () => ['entrance'] as const,
  cancellations: () => [...entranceKeys.all(), 'cancellations'] as const,
  enrollOrders: () => [...entranceKeys.all(), 'enrollOrders'] as const,
  categoryList: () => [...entranceKeys.all(), 'categoryList'] as const,
}

// ── Cancellation ──────────────────────────────────────────────────

export function useCancellationList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...entranceKeys.cancellations(), params],
    queryFn: () => apiPost<CancellationDto[]>(ENDPOINTS.ENTRANCE.CANCELLATION.LIST, params),
  })
}

export function useAddCancellation() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<CancellationDto>(ENDPOINTS.ENTRANCE.CANCELLATION.ADD, data),
  })
}

export function useUpdateCancellation() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<CancellationDto>(ENDPOINTS.ENTRANCE.CANCELLATION.UPDATE, data),
  })
}

export function useDeleteCancellation() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(ENDPOINTS.ENTRANCE.CANCELLATION.DELETE, data),
  })
}

// ── Enroll Order ──────────────────────────────────────────────────

export function useEnrollOrderList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...entranceKeys.enrollOrders(), params],
    queryFn: () => apiPost<EnrollOrderDto[]>(ENDPOINTS.ENTRANCE.ENROLL_ORDER.LIST, params),
  })
}

export function useEnrollOrderGet() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<EnrollOrderDto>(ENDPOINTS.ENTRANCE.ENROLL_ORDER.GET, data),
  })
}

// ── Examination ───────────────────────────────────────────────────

export function useAddExamination() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ExaminationDto>(ENDPOINTS.ENTRANCE.EXAMINATION.ADD, data),
  })
}

export function useCheckExamination() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ExaminationDto>(ENDPOINTS.ENTRANCE.EXAMINATION.CHECK, data),
  })
}

export function useDeleteExamination() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(ENDPOINTS.ENTRANCE.EXAMINATION.DELETE, data),
  })
}

// ── Person Request ────────────────────────────────────────────────

export function usePersonRequestCategoryList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...entranceKeys.categoryList(), params],
    queryFn: () =>
      apiPost<PersonRequestCategoryDto[]>(
        ENDPOINTS.ENTRANCE.PERSON_REQUEST.CATEGORY_LIST,
        params
      ),
  })
}
