import axios, { AxiosRequestConfig } from 'axios'

import { ApiError } from '@/types/api'
import { ENDPOINTS } from './endpoints'

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(undefined)
  })
  failedQueue = []
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — structure ready for future token injection
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    const status: number = error.response?.status ?? 0
    const data = error.response?.data as
      | { message?: string | string[]; errorMessage?: string }
      | undefined

    const rawMessage = data?.message
    const normalizedMessage = Array.isArray(rawMessage)
      ? rawMessage.join('; ')
      : (rawMessage ?? data?.errorMessage ?? 'Сталася невідома помилка')
    const errors = Array.isArray(rawMessage) ? rawMessage : undefined

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((e) => Promise.reject(e))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post(ENDPOINTS.AUTH.REFRESH)
        processQueue(null)
        return api(originalRequest)
      } catch {
        const sessionError = new ApiError('Сесія завершена', 401)
        processQueue(sessionError)
        if (typeof window !== 'undefined') {
          const { useAuthStore } = await import('@/store/auth.store')
          useAuthStore.getState().logout()
          window.location.href = '/sign-in'
        }
        return Promise.reject(sessionError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(new ApiError(normalizedMessage, status, errors))
  }
)

export const apiGet = <T>(url: string, config?: Parameters<typeof api.get>[1]) =>
  api.get<T>(url, config).then((r) => r.data)

export const apiPost = <T>(url: string, data?: unknown, config?: Parameters<typeof api.post>[2]) =>
  api.post<T>(url, data, config).then((r) => r.data)

export const apiPatch = <T>(
  url: string,
  data?: unknown,
  config?: Parameters<typeof api.patch>[2]
) => api.patch<T>(url, data, config).then((r) => r.data)

export const apiDelete = <T>(url: string, config?: Parameters<typeof api.delete>[1]) =>
  api.delete<T>(url, config).then((r) => r.data)
