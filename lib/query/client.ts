'use client'

import { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError } from '@/types/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode === 401) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : 'Невідома помилка'
        toast.error(message)
      },
    },
  },
})
