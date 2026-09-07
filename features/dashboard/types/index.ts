import type { UserRole } from '@/lib/types/user-role.types'

/** Зведені лічильники головної сторінки адміністратора (mirror AdminDashboardStatsDto). */
export interface AdminDashboardStats {
  users: {
    total: number
    active: number
    inactive: number
    neverLoggedIn: number
    byRole: Record<UserRole, number>
  }
  students: {
    total: number
    studying: number
    withAccount: number
  }
  teachers: {
    total: number
    active: number
    withAccount: number
  }
  groups: {
    total: number
    active: number
    archived: number
    withoutCurator: number
  }
}

/** Навчальний рік у форматі `2025-2026` (вересень — межа переходу). */
export function currentAcademicYear(date = new Date()): string {
  const y = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1
  return `${y}-${y + 1}`
}

/** Поточний семестр: 1 — осінній (вересень–січень), 2 — весняний. */
export function currentSemester(date = new Date()): number {
  const m = date.getMonth()
  return m >= 8 || m === 0 ? 1 : 2
}
