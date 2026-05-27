'use client'

import { useRequireAuth } from '@/hooks/use-require-auth'

/**
 * Клієнтський guard для захищених роутів dashboard.
 *
 * Відповідальність:
 * 1. Чекає завершення hydration (перевірка сесії через API)
 * 2. Якщо юзер не авторизований — редіректить на /sign-in (через useRequireAuth)
 * 3. Якщо авторизований — рендерить children
 * 4. Під час hydration показує null (глобальний Preloader покриває цей стан)
 *
 * Чому окремий компонент, а не 'use client' в layout.tsx?
 * - layout.tsx залишається Server Component → може експортувати metadata
 * - Чітке розділення відповідальності: layout = структура, guard = авторизація
 * - Тестується ізольовано від layout
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
	const { user, isHydrated } = useRequireAuth()

	// Hydration ще не завершена — API-запит /users/profile в процесі
	if (!isHydrated) {
		return null
	}

	// Hydration завершена, юзер не авторизований — redirect вже ініційовано в useRequireAuth
	if (!user) {
		return null
	}

	// Юзер авторизований — рендеримо захищений контент
	return <>{children}</>
}
