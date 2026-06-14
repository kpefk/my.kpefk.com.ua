'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPut } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  GroupDetailDto,
  GroupSummaryDto,
  ParentInfoDto,
  UpdateParentInfoPayload,
} from '../types'

export const groupLeaderKeys = {
  all: ['group-leader'] as const,
  myGroups: () => [...groupLeaderKeys.all, 'my-groups'] as const,
  groupStudents: (groupId: string) => [...groupLeaderKeys.all, 'students', groupId] as const,
  student: (groupId: string, studentId: string) =>
    [...groupLeaderKeys.all, 'student', groupId, studentId] as const,
  // Admin (no groupId)
  adminParentInfo: (studentId: string) =>
    [...groupLeaderKeys.all, 'admin-parent-info', studentId] as const,
}

export function useMyGroups() {
  return useQuery({
    queryKey: groupLeaderKeys.myGroups(),
    queryFn: () => apiGet<GroupSummaryDto[]>(ENDPOINTS.GROUP_LEADER.MY_GROUPS),
    staleTime: 60_000,
  })
}

export function useGroupStudents(groupId: string) {
  return useQuery({
    queryKey: groupLeaderKeys.groupStudents(groupId),
    queryFn: () => apiGet<GroupDetailDto>(ENDPOINTS.GROUP_LEADER.GROUP_STUDENTS(groupId)),
    enabled: !!groupId,
    staleTime: 30_000,
  })
}

export function useUpdateParentInfo(groupId: string, studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateParentInfoPayload) =>
      apiPut<ParentInfoDto>(ENDPOINTS.GROUP_LEADER.PARENT_INFO(groupId, studentId), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupLeaderKeys.groupStudents(groupId) })
      toast.success('Збережено')
    },
  })
}

// ── Admin hooks (HEAD_OF_DEPARTMENT+, no groupId) ─────────────────────────────

export function useAdminParentInfo(studentId: string, enabled = true) {
  return useQuery({
    queryKey: groupLeaderKeys.adminParentInfo(studentId),
    queryFn: () => apiGet<ParentInfoDto | null>(ENDPOINTS.GROUP_LEADER.ADMIN_PARENT_INFO(studentId)),
    enabled: !!studentId && enabled,
    staleTime: 30_000,
  })
}

export function useAdminUpdateParentInfo(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateParentInfoPayload) =>
      apiPut<ParentInfoDto>(ENDPOINTS.GROUP_LEADER.ADMIN_PARENT_INFO(studentId), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupLeaderKeys.adminParentInfo(studentId) })
      toast.success('Збережено')
    },
  })
}
