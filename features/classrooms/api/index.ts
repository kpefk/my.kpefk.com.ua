'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  ClassroomDto,
  CreateClassroomInput,
  UpdateClassroomInput,
} from '../types'

export const classroomKeys = {
  all: () => ['classrooms'] as const,
  lists: () => [...classroomKeys.all(), 'list'] as const,
  my: () => [...classroomKeys.all(), 'my'] as const,
  detail: (id: string) => [...classroomKeys.all(), id] as const,
}

export function useClassrooms() {
  return useQuery({
    queryKey: classroomKeys.lists(),
    queryFn: () => apiGet<ClassroomDto[]>(ENDPOINTS.CLASSROOMS.LIST),
    staleTime: 30_000,
  })
}

export function useMyClassroom() {
  return useQuery({
    queryKey: classroomKeys.my(),
    queryFn: () => apiGet<ClassroomDto | null>(ENDPOINTS.CLASSROOMS.MY),
    staleTime: 30_000,
  })
}

export function useCreateClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClassroomInput) =>
      apiPost<ClassroomDto>(ENDPOINTS.CLASSROOMS.LIST, data),
    onSuccess: (classroom) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() })
      toast.success(`Кабінет №${classroom.number} створено`)
    },
  })
}

export function useUpdateClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassroomInput }) =>
      apiPatch<ClassroomDto>(ENDPOINTS.CLASSROOMS.BY_ID(id), data),
    onSuccess: (classroom) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() })
      queryClient.setQueryData(classroomKeys.detail(classroom.id), classroom)
      toast.success('Кабінет оновлено')
    },
  })
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete<ClassroomDto>(ENDPOINTS.CLASSROOMS.BY_ID(id)),
    onSuccess: (classroom) => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() })
      toast.success(`Кабінет №${classroom.number} видалено`)
    },
  })
}

export function useUploadPhoto(classroomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      // НЕ виставляємо Content-Type вручну — браузер сам додає
      // multipart/form-data; boundary=... без якого сервер не може розпарсити тіло.
      // Також прибираємо дефолтний application/json з axios-інстансу.
      return api
        .post<ClassroomDto>(ENDPOINTS.CLASSROOMS.PHOTOS(classroomId), formData, {
          headers: { 'Content-Type': undefined },
        })
        .then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() })
      toast.success('Фото завантажено')
    },
  })
}

export function useDeletePhoto(classroomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (googleFileId: string) =>
      apiDelete<ClassroomDto>(ENDPOINTS.CLASSROOMS.PHOTO_DELETE(classroomId, googleFileId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() })
      toast.success('Фото видалено')
    },
  })
}

export function useReorderPhotos(classroomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (photos: { googleFileId: string; order: number }[]) =>
      apiPatch<ClassroomDto>(ENDPOINTS.CLASSROOMS.PHOTOS_REORDER(classroomId), { photos }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() })
    },
  })
}

export function useUploadPassport(classroomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api
        .post<ClassroomDto>(ENDPOINTS.CLASSROOMS.PASSPORT(classroomId), formData, {
          headers: { 'Content-Type': undefined },
        })
        .then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() })
      toast.success('Паспорт кабінету завантажено')
    },
  })
}

export function useDeletePassport(classroomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiDelete<ClassroomDto>(ENDPOINTS.CLASSROOMS.PASSPORT(classroomId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all() })
      toast.success('Паспорт кабінету видалено')
    },
  })
}
