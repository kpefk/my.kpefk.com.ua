import { api } from '@/lib/api/axios'

export interface ResetPasswordPayload {
  email: string
}

export interface NewPasswordPayload {
  password: string
}

export const passwordRecoveryService = {
  reset(payload: ResetPasswordPayload): Promise<boolean> {
    return api
      .post<boolean>('/auth/password-recovery/reset', payload)
      .then((r) => r.data)
  },

  new(payload: NewPasswordPayload, token: string): Promise<boolean> {
    return api
      .post<boolean>(`/auth/password-recovery/new/${token}`, payload)
      .then((r) => r.data)
  },
}
