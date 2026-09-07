'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/store/auth.store'

import { AdminDashboard } from './AdminDashboard'
import { DefaultDashboard } from './DefaultDashboard'
import { StudentDashboard } from './StudentDashboard'

/** Ім'я для привітання: ПІБ студента / викладача, інакше — частина email. */
function displayName(user: NonNullable<ReturnType<typeof useUser>>): string {
  if (user.student?.personFIO) {
    return user.student.personFIO.split(' ')[1] ?? user.student.personFIO
  }
  if (user.teacher?.firstName) return user.teacher.firstName
  return user.email.split('@')[0] ?? user.email
}

/**
 * Маршрутизатор головної сторінки: кожна роль отримує власний вигляд.
 * Нову роль додаємо окремою гілкою `switch` — решта лишається на `DefaultDashboard`.
 */
export function DashboardClient() {
  const user = useUser()

  if (!user) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  switch (user.role) {
    case 'ADMINISTRATOR':
      return <AdminDashboard />
    case 'STUDENT':
      return <StudentDashboard userId={user.id} />
    default:
      return <DefaultDashboard role={user.role} name={displayName(user)} />
  }
}
