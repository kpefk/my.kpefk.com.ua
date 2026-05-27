'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { authService, UserDto, LoginPayload, RegisterStudentPayload } from '@/lib/services'
import { api } from '../api/axios'

// ── Типи ─────────────────────────────────────────────────────────

interface AuthState {
	user: UserDto | null
	isLoading: boolean
	isHydrated: boolean
	isTwoFactorRequired: boolean
	twoFactorMessage: string

	// ── Actions ─────────────────────────────────────────────────────
	login: (payload: LoginPayload) => Promise<'success' | 'two_factor' | 'error'>
	register: (payload: RegisterStudentPayload) => Promise<'success' | 'error'>
	logout: () => Promise<void>
	hydrate: () => Promise<void> // ← новий метод
	setUser: (user: UserDto | null) => void
	clearTwoFactor: () => void
}

// ── Store ─────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
	devtools(
		set => ({
			user: null,
			isLoading: false,
			isHydrated: false,
			isTwoFactorRequired: false,
			twoFactorMessage: '',

			hydrate: async () => {
				try {
					const { data } = await api.get<UserDto>('/users/profile')
					set({ user: data, isHydrated: true }, false, 'auth/hydrateSuccess')
				} catch {
					// cookie немає або протухло — юзер не авторизований
					set({ user: null, isHydrated: true }, false, 'auth/hydrateEmpty')
				}
			},

			login: async payload => {
				set({ isLoading: true }, false, 'auth/loginStart')

				try {
					const response = await authService.login(payload)

					if ('message' in response) {
						set(
							{
								isTwoFactorRequired: true,
								twoFactorMessage: response.message
							},
							false,
							'auth/twoFactorRequired'
						)
						return 'two_factor'
					}

					set(
						{
							user: response.user,
							isTwoFactorRequired: false,
							twoFactorMessage: ''
						},
						false,
						'auth/loginSuccess'
					)
					return 'success'
				} catch (error) {
					set({ user: null }, false, 'auth/loginError')
					throw error
				} finally {
					set({ isLoading: false }, false, 'auth/loginEnd')
				}
			},

			register: async payload => {
				set({ isLoading: true }, false, 'auth/registerStart')

				try {
					const response = await authService.register(payload)
					set({ user: response.user }, false, 'auth/registerSuccess')
					return 'success'
				} catch (error) {
					set({ user: null }, false, 'auth/registerError')
					throw error
				} finally {
					set({ isLoading: false }, false, 'auth/registerEnd')
				}
			},

			logout: async () => {
				set({ isLoading: true }, false, 'auth/logoutStart')

				try {
					await authService.logout()
					set(
						{
							user: null,
							isTwoFactorRequired: false,
							twoFactorMessage: ''
						},
						false,
						'auth/logoutSuccess'
					)
				} finally {
					set({ isLoading: false }, false, 'auth/logoutEnd')
				}
			},

			setUser: user => set({ user }, false, 'auth/setUser'),

			clearTwoFactor: () =>
				set(
					{ isTwoFactorRequired: false, twoFactorMessage: '' },
					false,
					'auth/clearTwoFactor'
				)
		}),
		{ name: 'AuthStore' }
	)
)

export const useUser = () => useAuthStore(s => s.user)
export const useIsAuthenticated = () => useAuthStore(s => !!s.user)
export const useAuthLoading = () => useAuthStore(s => s.isLoading)
export const useIsTwoFactorRequired = () => useAuthStore(s => s.isTwoFactorRequired)
