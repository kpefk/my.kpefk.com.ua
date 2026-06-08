'use client'

import { Shield } from 'lucide-react'
import { SecuritySettings } from '@/features/auth/components/security-settings'

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield size={22} className="text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Налаштування безпеки</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Пароль та двофакторна автентифікація
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <SecuritySettings />
      </div>
    </div>
  )
}
