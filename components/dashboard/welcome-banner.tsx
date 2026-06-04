'use client'

import { useAuthStore } from '@/store/auth.store'

export function WelcomeBanner() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const name =
    user.role === 'STUDENT' && user.student?.personFIO
      ? user.student.personFIO.split(' ')[0]
      : user.role === 'TEACHER' && user.teacher?.firstName
        ? user.teacher.firstName
        : user.email.split('@')[0] ?? user.email

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Вітаємо, {name}!</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Раді бачити вас знову в особистому кабінеті MyKPEFK.
      </p>
    </div>
  )
}
