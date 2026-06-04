'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useAuthStore } from '@/store/auth.store'

import type { AuthResponse, TwoFactorResponse, UserDto } from '../types'
import type { SignInData, SignUpData } from '../schemas'

// ── Query key factory ─────────────────────────────────────────────

export const authKeys = {
  me: () => ['auth', 'me'] as const,
}

// ── Queries ───────────────────────────────────────────────────────

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => apiGet<UserDto>(ENDPOINTS.USERS.PROFILE),
    retry: false,
    staleTime: Infinity,
  })
}

// ── Mutations ─────────────────────────────────────────────────────

export function useLogin() {
  const { setUser, setTwoFactor } = useAuthStore()
  return useMutation({
    mutationFn: (data: SignInData) =>
      apiPost<AuthResponse | TwoFactorResponse>(ENDPOINTS.AUTH.LOGIN, data),
    onSuccess: (response) => {
      if ('message' in response) {
        setTwoFactor(true, response.message)
        return
      }
      setUser(response.user)
      toast.success('Ласкаво просимо!')
    },
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  return useMutation({
    mutationFn: () => apiPost(ENDPOINTS.AUTH.LOGOUT),
    // Use window.location.replace (full reload) instead of router.replace.
    // Mutation-level callbacks (here) always fire even if the component that
    // called mutate() unmounts mid-flight — which is exactly what happens when
    // logout() clears the Zustand user and DashboardShell unmounts Header.
    onSettled: () => {
      logout()
      window.location.replace('/sign-in')
    },
  })
}

export function useRegister() {
  const { setUser } = useAuthStore()
  return useMutation({
    mutationFn: (data: SignUpData) => apiPost<AuthResponse>(ENDPOINTS.AUTH.REGISTER, data),
    onSuccess: (response) => {
      setUser(response.user)
    },
  })
}
