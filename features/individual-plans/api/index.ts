'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  Appendix2Data,
  Appendix3Data,
  CreateIndividualPlanPayload,
  CreatePlanItemPayload,
  ElectiveThresholdResult,
  GenerateForGroupResult,
  IndividualPlanDto,
  IndividualPlanItemDto,
  UpdatePlanItemPayload,
} from '../types'

export const individualPlanKeys = {
  all: ['individual-plans'] as const,
  byStudent: (studentId: string) =>
    [...individualPlanKeys.all, 'student', studentId] as const,
  byGroup: (groupId: string) =>
    [...individualPlanKeys.all, 'group', groupId] as const,
  appendix2: (studentId: string, seasonId: string) =>
    [...individualPlanKeys.all, 'appendix2', studentId, seasonId] as const,
  appendix3: (seasonId: string, groupId: string) =>
    [...individualPlanKeys.all, 'appendix3', seasonId, groupId] as const,
  threshold: (versionId: string) =>
    [...individualPlanKeys.all, 'threshold', versionId] as const,
}

// ── Individual Plans ─────────────────────────────────────────────────

export function useIndividualPlanByStudent(studentId: string) {
  return useQuery({
    queryKey: individualPlanKeys.byStudent(studentId),
    queryFn: () =>
      apiGet<IndividualPlanDto | null>(ENDPOINTS.INDIVIDUAL_PLANS.BY_STUDENT, {
        params: { studentId },
      }),
    enabled: !!studentId,
    staleTime: 60_000,
  })
}

export function useIndividualPlansByGroup(groupId: string) {
  return useQuery({
    queryKey: individualPlanKeys.byGroup(groupId),
    queryFn: () =>
      apiGet<IndividualPlanDto[]>(ENDPOINTS.INDIVIDUAL_PLANS.BY_GROUP, {
        params: { groupId },
      }),
    enabled: !!groupId,
    staleTime: 60_000,
  })
}

export function useCreateIndividualPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateIndividualPlanPayload) =>
      apiPost<IndividualPlanDto>(ENDPOINTS.INDIVIDUAL_PLANS.CREATE, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: individualPlanKeys.all })
    },
  })
}

export function useGenerateForGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, assignmentId }: { groupId: string; assignmentId: string }) =>
      apiPost<GenerateForGroupResult>(
        `${ENDPOINTS.INDIVIDUAL_PLANS.GENERATE_FOR_GROUP}?groupId=${encodeURIComponent(groupId)}&assignmentId=${encodeURIComponent(assignmentId)}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: individualPlanKeys.all })
    },
  })
}

export function useApproveIndividualPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<IndividualPlanDto>(ENDPOINTS.INDIVIDUAL_PLANS.APPROVE(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: individualPlanKeys.all })
    },
  })
}

export function useDeleteIndividualPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete(ENDPOINTS.INDIVIDUAL_PLANS.BY_ID(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: individualPlanKeys.all })
    },
  })
}

export function useAddPlanItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: CreatePlanItemPayload }) =>
      apiPost<IndividualPlanItemDto>(ENDPOINTS.INDIVIDUAL_PLANS.ADD_ITEM(planId), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: individualPlanKeys.all })
    },
  })
}

export function useUpdatePlanItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdatePlanItemPayload }) =>
      apiPatch<IndividualPlanItemDto>(ENDPOINTS.INDIVIDUAL_PLANS.UPDATE_ITEM(itemId), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: individualPlanKeys.all })
    },
  })
}

export function useRemovePlanItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) =>
      apiDelete(ENDPOINTS.INDIVIDUAL_PLANS.DELETE_ITEM(itemId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: individualPlanKeys.all })
    },
  })
}

// ── Print data: Додаток 2 + 3 ────────────────────────────────────────

export function useAppendix2Data(studentId: string, seasonId: string) {
  return useQuery({
    queryKey: individualPlanKeys.appendix2(studentId, seasonId),
    queryFn: () =>
      apiGet<Appendix2Data>(ENDPOINTS.ELECTIVES.ADMIN_APPENDIX2, {
        params: { studentId, seasonId },
      }),
    enabled: !!studentId && !!seasonId,
    staleTime: 60_000,
  })
}

export function useAppendix3Data(seasonId: string, groupId: string) {
  return useQuery({
    queryKey: individualPlanKeys.appendix3(seasonId, groupId),
    queryFn: () =>
      apiGet<Appendix3Data>(ENDPOINTS.ELECTIVES.ADMIN_APPENDIX3, {
        params: { seasonId, groupId },
      }),
    enabled: !!seasonId && !!groupId,
    staleTime: 60_000,
  })
}

// ── ECTS threshold validation ────────────────────────────────────────

export function useElectiveThreshold(versionId: string) {
  return useQuery({
    queryKey: individualPlanKeys.threshold(versionId),
    queryFn: () =>
      apiGet<ElectiveThresholdResult>(ENDPOINTS.ELECTIVES.ADMIN_VALIDATE_THRESHOLD, {
        params: { versionId },
      }),
    enabled: !!versionId,
    staleTime: 5 * 60_000,
  })
}
