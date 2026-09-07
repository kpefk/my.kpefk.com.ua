'use client'

import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type { AdminDashboardStats } from '../types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  adminStats: () => [...dashboardKeys.all, 'admin-stats'] as const,
}

/** Зведені лічильники системи (лише ADMINISTRATOR). */
export function useAdminDashboardStats(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.adminStats(),
    queryFn: () => apiGet<AdminDashboardStats>(ENDPOINTS.ADMIN.DASHBOARD_STATS),
    enabled,
    staleTime: 60_000,
  })
}
