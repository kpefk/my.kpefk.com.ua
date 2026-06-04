'use client'

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

import type { UserDto } from '@/lib/services/auth.service'

interface AuthState {
  user: UserDto | null
  isLoading: boolean
  isHydrated: boolean
  isTwoFactorRequired: boolean
  twoFactorMessage: string

  // Actions — accept data, do not fetch
  setUser: (user: UserDto | null) => void
  setTwoFactor: (required: boolean, message?: string) => void
  clearTwoFactor: () => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        isHydrated: false,
        isTwoFactorRequired: false,
        twoFactorMessage: '',

        setUser: (user) =>
          set({ user, isHydrated: true }, false, 'auth/setUser'),

        setTwoFactor: (required, message = '') =>
          set(
            { isTwoFactorRequired: required, twoFactorMessage: message },
            false,
            'auth/setTwoFactor'
          ),

        clearTwoFactor: () =>
          set(
            { isTwoFactorRequired: false, twoFactorMessage: '' },
            false,
            'auth/clearTwoFactor'
          ),

        logout: () =>
          set(
            {
              user: null,
              isTwoFactorRequired: false,
              twoFactorMessage: '',
            },
            false,
            'auth/logout'
          ),

        setLoading: (isLoading) => set({ isLoading }, false, 'auth/setLoading'),

        setHydrated: (isHydrated) => set({ isHydrated }, false, 'auth/setHydrated'),
      }),
      {
        name: 'auth-store',
        storage: createJSONStorage(() => sessionStorage),
        // Only persist user — ephemeral flags are NOT persisted
        partialize: (state) => ({ user: state.user }),
      }
    ),
    { name: 'AuthStore' }
  )
)

export const useUser = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAuthStore((s) => !!s.user)
export const useAuthLoading = () => useAuthStore((s) => s.isLoading)
export const useIsTwoFactorRequired = () => useAuthStore((s) => s.isTwoFactorRequired)
