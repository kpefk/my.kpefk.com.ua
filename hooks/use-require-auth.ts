'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

/**
 * Hook для захисту клієнтських роутів.
 *
 * Перевіряє стан авторизації після hydration Zustand store.
 * Якщо юзер не авторизований — виконує redirect на /sign-in.
 *
 * ВАЖЛИВО: Використовувати ТІЛЬКИ в Client Components ('use client').
 */
export function useRequireAuth() {
	const router = useRouter()
	const user = useAuthStore((s) => s.user)
	const isHydrated = useAuthStore((s) => s.isHydrated)

	useEffect(() => {
		if (isHydrated && !user) {
			router.replace('/sign-in')
		}
	}, [isHydrated, user, router])

	return { user, isHydrated }
}