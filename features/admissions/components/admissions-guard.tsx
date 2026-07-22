'use client'

import { Lock } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/store/auth.store'

const MANAGE_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

interface AdmissionsGuardProps {
  /** Якщо true — сторінка лише для ADMINISTRATOR (наприклад, налаштування / список заяв). */
  adminOnly?: boolean
  children: (ctx: { isAdministrator: boolean }) => React.ReactNode
}

/** Рольовий-гейт вступної кампанії (спільний для трьох сторінок). */
export function AdmissionsGuard({ adminOnly = false, children }: AdmissionsGuardProps) {
  const user = useUser()

  if (!user) return <Skeleton className="h-64 w-full" />

  const isAdministrator = user.role === 'ADMINISTRATOR'
  const allowed = adminOnly ? isAdministrator : MANAGE_ROLES.includes(user.role)

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
        <p className="font-semibold">Доступ обмежено</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {adminOnly
            ? 'Ця сторінка доступна лише адміністратору.'
            : 'Аналітика вступної кампанії доступна керівництву.'}
        </p>
      </div>
    )
  }

  return <>{children({ isAdministrator })}</>
}
