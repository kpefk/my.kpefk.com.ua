'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiPatch } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type { ChangePasswordDto, ProfileDto, UpdateProfileDto } from '../types'

export const userKeys = {
  all: () => ['users'] as const,
  profile: () => [...userKeys.all(), 'profile'] as const,
  byId: (id: string) => [...userKeys.all(), id] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => apiGet<ProfileDto>(ENDPOINTS.USERS.PROFILE),
  })
}

export function useUserById(id: string) {
  return useQuery({
    queryKey: userKeys.byId(id),
    queryFn: () => apiGet<ProfileDto>(ENDPOINTS.USERS.BY_ID(id)),
    enabled: !!id,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProfileDto) =>
      apiPatch<ProfileDto>(ENDPOINTS.USERS.PROFILE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) =>
      apiPatch(ENDPOINTS.USERS.CHANGE_PASSWORD, data),
  })
}
