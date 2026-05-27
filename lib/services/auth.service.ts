import { api } from '@/lib/api/axios'

export interface UserDto {
  id: string
  email: string
  role: 'STUDENT' | 'STAFF' | 'ADMINISTRATOR'
  isTwoFactorEnabled: boolean
  isFirstLogin: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginPayload {
  email: string
  password: string
  code?: string
}

export interface RegisterStudentPayload {
  email: string
  password: string
  consent: boolean
  rnokpp?: string
  no_rnokpp?: boolean
  serial_ticket?: string
  number_ticket?: string
  no_student_ticket?: boolean
  serial_passport?: string
  number_passport?: string
}

export interface AuthResponse {
  user: UserDto
}

export interface TwoFactorResponse {
  message: string
}

export const authService = {
  login(payload: LoginPayload): Promise<AuthResponse | TwoFactorResponse> {
    return api
      .post<AuthResponse | TwoFactorResponse>('/auth/login', payload)
      .then((r) => r.data)
  },

  register(payload: RegisterStudentPayload): Promise<AuthResponse> {
    return api
      .post<AuthResponse>('/auth/register', payload)
      .then((r) => r.data)
  },

  logout(): Promise<void> {
    return api.post('/auth/logout').then(() => undefined)
  },
}