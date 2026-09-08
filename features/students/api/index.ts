'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError, type PaginatedResponse } from '@/types/api'

import type { StudentDto, StudentFilters } from '../types'

export interface BulkProvisionResult {
	provisioned: number
	skipped: number
	failed: number
	total: number
	failures: Array<{
		studentId: string
		personFIO: string
		message: string
	}>
}

/** Стан навчання — єдиний фільтр, що застосовується на сервері. */
export type StudentListStatus = 'all' | 'active' | 'inactive'

export const studentKeys = {
	all: ['students'] as const,
	list: (status: StudentListStatus) => [...studentKeys.all, 'list', status] as const,
	detail: (id: string) => [...studentKeys.all, 'detail', id] as const
}

function toStatus(isActive: boolean | null | undefined): StudentListStatus {
	if (isActive === true) return 'active'
	if (isActive === false) return 'inactive'
	return 'all'
}

export function useStudents(filters: StudentFilters) {
	// Ключ залежить лише від серверного фільтра: пошук/курс/група фільтруються на клієнті,
	// тож набір рядків не перезапитується на кожне натискання клавіші.
	const status = toStatus(filters.isActive)
	return useQuery({
		queryKey: studentKeys.list(status),
		queryFn: () =>
			apiGet<StudentDto[] | PaginatedResponse<StudentDto>>(
				`${ENDPOINTS.STUDENTS.LIST}?status=${status}`
			),
		select: data => (Array.isArray(data) ? data : data.data),
		staleTime: 60_000
	})
}

export function useSyncStudents() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () => apiPost(ENDPOINTS.EDBO.SYNC_STUDENTS),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: studentKeys.all })
			toast.success('Синхронізацію студентів з ЄДЕБО завершено')
		},
		onError: (error: unknown) => {
			const message = error instanceof ApiError ? error.message : 'Помилка синхронізації'
			toast.error(message)
		}
	})
}

export function useProvisionAllStudentEmails() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (studentIds: string[]) =>
			apiPost<BulkProvisionResult>(ENDPOINTS.STUDENTS.PROVISION_ALL_EMAILS, {
				studentIds
			}),
		onSuccess: result => {
			queryClient.invalidateQueries({ queryKey: studentKeys.all })

			if (result.failed > 0) {
				toast.warning(
					`Готово: створено ${result.provisioned}, пропущено ${result.skipped}, помилок ${result.failed}.`
				)
				return
			}

			toast.success(
				result.total === 0
					? 'У всіх студентів уже є корпоративна пошта'
					: `Готово: створено ${result.provisioned}, уже існувало ${result.skipped}.`
			)
		},
		onError: (error: unknown) => {
			const message =
				error instanceof ApiError
					? error.message
					: 'Не вдалося масово створити корпоративну пошту'
			toast.error(message)
		}
	})
}
