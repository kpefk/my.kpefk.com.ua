'use client'

import { useState } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  type DefaultOptions,
} from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster, toast } from 'sonner'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ApiError } from '@/types/api'

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function getUserFriendlyErrorMessage(error: unknown): string | null {
  if (isAbortError(error)) {
    return null
  }

  if (!(error instanceof ApiError)) {
    return 'Не вдалося виконати запит. Перевірте з’єднання та спробуйте ще раз.'
  }

  const isRoutingError =
    /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s/.test(error.message)

  if (isRoutingError || error.statusCode >= 500) {
    return 'Помилка сервера. Спробуйте ще раз або зверніться до адміністратора.'
  }

  switch (error.statusCode) {
    case 401:
      return 'Сеанс завершився. Увійдіть у систему повторно.'
    case 403:
      return 'У вас немає прав для виконання цієї дії.'
    case 404:
      return 'Запитуваний ресурс не знайдено.'
    case 409:
      return 'Дані вже були змінені іншим користувачем. Оновіть сторінку.'
    default:
      return error.message.trim() || 'Не вдалося виконати дію. Спробуйте ще раз.'
  }
}

const queryDefaults: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    networkMode: 'online',

    retry: (failureCount, error) => {
      if (
        isAbortError(error) ||
        (error instanceof ApiError &&
          [400, 401, 403, 404, 422].includes(error.statusCode))
      ) {
        return false
      }

      return failureCount < 1
    },

    retryDelay: (attemptIndex) =>
      Math.min(1_000 * 2 ** attemptIndex, 10_000),
  },

  mutations: {
    networkMode: 'online',

    onError: (error) => {
      const message = getUserFriendlyErrorMessage(error)

      if (message) {
        toast.error(message)
      }
    },
  },
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: queryDefaults,
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider delayDuration={250}>
          {children}

          <Toaster
            position="top-right"
            theme="system"
            richColors
            closeButton
            toastOptions={{ duration: 5_000 }}
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}