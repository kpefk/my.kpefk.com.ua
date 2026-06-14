'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { TwoFactorMethod } from '@/lib/services/auth.service'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TwoFAStatusDto {
  method: TwoFactorMethod
  totpVerified: boolean
  email: string // masked
}

export interface TotpSetupDto {
  secret: string
  otpauthUrl: string
  qrCodeDataUrl: string
}

// ── Keys ──────────────────────────────────────────────────────────────────────

export const securityKeys = {
  status: () => ['security', '2fa-status'] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useGet2FAStatus() {
  return useQuery({
    queryKey: securityKeys.status(),
    queryFn: () => apiGet<TwoFAStatusDto>(ENDPOINTS.TWO_FA.STATUS),
    staleTime: 30_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useTotpSetup() {
  return useMutation({
    mutationFn: () => apiPost<TotpSetupDto>(ENDPOINTS.TWO_FA.TOTP_SETUP),
  })
}

export function useTotpVerifySetup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) =>
      apiPost<{ success: boolean }>(ENDPOINTS.TWO_FA.TOTP_VERIFY_SETUP, { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: securityKeys.status() })
      toast.success('Google Authenticator підключено')
    },
  })
}

export function useTotpDisable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) =>
      apiPost<{ success: boolean }>(ENDPOINTS.TWO_FA.TOTP_DISABLE, { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: securityKeys.status() })
      toast.success('Google Authenticator відключено')
    },
  })
}

export function useEmailEnable2FA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<{ success: boolean }>(ENDPOINTS.TWO_FA.EMAIL_ENABLE),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: securityKeys.status() })
      toast.success('Двофакторна автентифікація через email увімкнена')
    },
  })
}

export function useEmailDisable2FA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) =>
      apiPost<{ success: boolean }>(ENDPOINTS.TWO_FA.EMAIL_DISABLE, { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: securityKeys.status() })
      toast.success('Email 2FA відключено')
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiPost<{ success?: boolean }>(ENDPOINTS.USERS.CHANGE_PASSWORD, {
        currentPassword: data.currentPassword,
        password: data.newPassword,
        passwordRepeat: data.newPassword,
      }),
    onSuccess: () => toast.success('Пароль успішно змінено'),
  })
}

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: (data: { newEmail: string; password: string }) =>
      apiPost<{ success: boolean }>(ENDPOINTS.USERS.REQUEST_EMAIL_CHANGE, {
        newEmail: data.newEmail,
        password: data.password,
      }),
    onSuccess: () =>
      toast.success('Лист із підтвердженням надіслано на нову адресу'),
  })
}

export function useAdminReset2FA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      apiPost<{ success: boolean }>(ENDPOINTS.TWO_FA.ADMIN_RESET(userId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('2FA скинуто')
    },
  })
}
