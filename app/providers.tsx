'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

import { ApiError } from '@/types/api'

function makeQueryClient() {
  return new QueryClient({
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
}

export function Providers({ children }: { children: React.ReactNode }) {
  // useState guarantees a new QueryClient per browser session,
  // never shared between requests (important for SSR safety)
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
