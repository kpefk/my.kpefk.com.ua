'use client'

import {
  AlertTriangle,
  BookMarked,
  Building2,
  DoorOpen,
  GraduationCap,
  School,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserSearch,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { USER_ROLE_COLORS, USER_ROLE_LABELS, type UserRole } from '@/lib/types/user-role.types'

import { useAdminDashboardStats } from '../api'
import { DashboardSection, EmptyHint, QuickLinks, StatCard } from './dashboard-ui'

const QUICK_LINKS = [
  { href: '/users', label: 'Користувачі', icon: UserSearch },
  { href: '/students', label: 'Студенти', icon: GraduationCap },
  { href: '/teachers', label: 'Викладачі', icon: UserCog },
  { href: '/academic-groups', label: 'Групи', icon: Users },
  { href: '/admissions', label: 'Вступна кампанія', icon: UserPlus },
  { href: '/classrooms', label: 'Кабінети', icon: School },
  { href: '/educational-programs', label: 'Освітні програми', icon: BookMarked },
  { href: '/institution', label: 'Про заклад', icon: Building2 },
  { href: '/schedule/builder', label: 'Конструктор розкладу', icon: DoorOpen },
]

export function AdminDashboard() {
  const { data: stats, isLoading, isError } = useAdminDashboardStats()

  const roleRows = stats
    ? (Object.entries(stats.users.byRole) as [UserRole, number][])
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
    : []

  // Речі, що потребують уваги адміністратора.
  const attention = stats
    ? [
        {
          key: 'no-curator',
          count: stats.groups.withoutCurator,
          label: 'Активних груп без куратора',
          href: '/academic-groups',
        },
        {
          key: 'teachers-no-account',
          count: stats.teachers.active - stats.teachers.withAccount,
          label: 'Викладачів без акаунту',
          href: '/users',
        },
        {
          key: 'never-logged-in',
          count: stats.users.neverLoggedIn,
          label: 'Акаунтів, які жодного разу не входили',
          href: '/users',
        },
        {
          key: 'inactive',
          count: stats.users.inactive,
          label: 'Деактивованих акаунтів',
          href: '/users',
        },
      ].filter((i) => i.count > 0)
    : []

  return (
    <div className="space-y-5">
      {isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-muted-foreground">
          Не вдалося завантажити зведену статистику. Спробуйте оновити сторінку.
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Акаунтів у системі"
          value={stats?.users.total ?? '—'}
          hint={stats ? `${stats.users.active} активних` : undefined}
          icon={ShieldCheck}
          href="/users"
          isLoading={isLoading}
        />
        <StatCard
          label="Студентів навчається"
          value={stats?.students.studying ?? '—'}
          hint={stats ? `${stats.students.total} усього в ЄДЕБО` : undefined}
          icon={GraduationCap}
          href="/students"
          isLoading={isLoading}
        />
        <StatCard
          label="Викладачів працює"
          value={stats?.teachers.active ?? '—'}
          hint={stats ? `${stats.teachers.withAccount} мають акаунт` : undefined}
          icon={UserCog}
          href="/teachers"
          isLoading={isLoading}
        />
        <StatCard
          label="Активних груп"
          value={stats?.groups.active ?? '—'}
          hint={stats ? `${stats.groups.archived} в архіві` : undefined}
          icon={Users}
          href="/academic-groups"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Розподіл за ролями */}
          <DashboardSection
            title="Акаунти за ролями"
            description="Розподіл користувачів системи"
            href="/users"
            hrefLabel="Керувати"
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : roleRows.length === 0 ? (
              <EmptyHint>Акаунтів ще немає</EmptyHint>
            ) : (
              <div className="space-y-2">
                {roleRows.map(([role, count]) => {
                  const pct = stats ? Math.round((count / stats.users.total) * 100) : 0
                  return (
                    <div key={role} className="flex items-center gap-3">
                      <Badge
                        className={`${USER_ROLE_COLORS[role]} hover:${USER_ROLE_COLORS[role]} shrink-0 w-44 justify-center`}
                      >
                        {USER_ROLE_LABELS[role]}
                      </Badge>
                      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium tabular-nums w-10 text-right">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </DashboardSection>

          {/* Швидкі переходи */}
          <DashboardSection title="Швидкі переходи">
            <QuickLinks links={QUICK_LINKS} />
          </DashboardSection>
        </div>

        <div className="space-y-5">
          {/* Потребує уваги */}
          <DashboardSection
            title="Потребує уваги"
            description="Незавершені налаштування системи"
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : attention.length === 0 ? (
              <EmptyHint>Усе гаразд — відкритих питань немає</EmptyHint>
            ) : (
              <ul className="space-y-2">
                {attention.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-accent/40"
                    >
                      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                      <span className="text-sm flex-1 leading-tight">{item.label}</span>
                      <span className="text-sm font-semibold tabular-nums">{item.count}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          {/* Покриття акаунтами */}
          <DashboardSection
            title="Покриття акаунтами"
            description="Скільки осіб з ЄДЕБО мають доступ до системи"
          >
            {isLoading || !stats ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-4">
                <CoverageBar
                  label="Студенти"
                  value={stats.students.withAccount}
                  total={stats.students.studying}
                />
                <CoverageBar
                  label="Викладачі"
                  value={stats.teachers.withAccount}
                  total={stats.teachers.active}
                />
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    </div>
  )
}

function CoverageBar({
  label,
  value,
  total,
}: {
  label: string
  value: number
  total: number
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {value} / {total} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
