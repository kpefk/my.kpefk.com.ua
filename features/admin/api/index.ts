'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type { AdminUserDto, CreateUserDto, UnlinkedStudentDto, UnlinkedTeacherDto, UpdateUserDto } from '../types'

export const adminKeys = {
  all: () => ['admin'] as const,
  users: () => [...adminKeys.all(), 'users'] as const,
  user: (id: string) => [...adminKeys.users(), id] as const,
  unlinkedStudents: () => [...adminKeys.all(), 'unlinked-students'] as const,
  unlinkedTeachers: () => [...adminKeys.all(), 'unlinked-teachers'] as const,
}

export function useUnlinkedStudents(enabled = false) {
  return useQuery({
    queryKey: adminKeys.unlinkedStudents(),
    queryFn: () => apiGet<UnlinkedStudentDto[]>(ENDPOINTS.ADMIN.UNLINKED_STUDENTS),
    enabled,
    staleTime: 60_000,
  })
}

export function useUnlinkedTeachers(enabled = false) {
  return useQuery({
    queryKey: adminKeys.unlinkedTeachers(),
    queryFn: () => apiGet<UnlinkedTeacherDto[]>(ENDPOINTS.ADMIN.UNLINKED_TEACHERS),
    enabled,
    staleTime: 60_000,
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => apiGet<AdminUserDto[]>(ENDPOINTS.ADMIN.USERS),
    staleTime: 30_000,
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => apiGet<AdminUserDto>(ENDPOINTS.ADMIN.USER(id)),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserDto) => apiPost<AdminUserDto>(ENDPOINTS.ADMIN.USERS, data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      toast.success(`Акаунт для ${user.email} створено. Тимчасовий пароль надіслано на email.`)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      apiPatch<AdminUserDto>(ENDPOINTS.ADMIN.USER(id), data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.setQueryData(adminKeys.user(user.id), user)
      toast.success('Дані користувача оновлено')
    },
  })
}

/** Прив'язує (teacherId) або відв'язує (null) картку викладача для акаунту. */
export function useLinkTeacher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, teacherId }: { id: string; teacherId: string | null }) =>
      apiPatch<AdminUserDto>(ENDPOINTS.ADMIN.USER_TEACHER(id), { teacherId }),
    onSuccess: (user, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.unlinkedTeachers() })
      queryClient.setQueryData(adminKeys.user(user.id), user)
      toast.success(teacherId ? 'Викладача прив’язано до акаунту' : 'Викладача відв’язано')
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete<AdminUserDto>(ENDPOINTS.ADMIN.USER(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      toast.success('Акаунт деактивовано')
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => apiPatch(ENDPOINTS.USERS.RESET_PASSWORD(id)),
    onSuccess: () => {
      toast.success('Тимчасовий пароль надіслано на email користувача')
    },
  })
}
