"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth.store"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BottomTabBar } from "@/components/dashboard/bottom-tab-bar"

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Студент",
  TEACHER: "Викладач",
  SCHEDULE_DISPATCHER: "Диспетчер розкладу",
  HEAD_OF_DEPARTMENT: "Завідувач відділення",
  DEPUTY_DIRECTOR: "Заступник директора",
  DIRECTOR: "Директор",
  ADMINISTRATOR: "Адміністратор",
}

/** Ролі що мають ім'я + групу в шапці */
const PERSONAL_ROLES = new Set(["STUDENT", "TEACHER"])

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  // AuthGuard гарантує що user !== null, але TypeScript потребує type narrowing
  if (!user) return null

  // ── Дані для шапки залежно від ролі ──────────────────────────────
  const isPersonalRole = PERSONAL_ROLES.has(user.role)

  const headerUser = isPersonalRole
    ? {
        // STUDENT / TEACHER — показуємо ім'я та групу (якщо є)
        name: user.email.split("@")[0],
        subtitle: ROLE_LABELS[user.role] ?? user.role,
      }
    : {
        // Всі інші ролі — показуємо email та роль
        name: user.email,
        subtitle: ROLE_LABELS[user.role] ?? user.role,
      }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          user={headerUser}
          onMenuClick={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  )
}