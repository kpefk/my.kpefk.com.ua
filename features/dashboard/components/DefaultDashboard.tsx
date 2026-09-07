'use client'

import {
  Award,
  BarChart3,
  BookMarked,
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  DoorOpen,
  GraduationCap,
  Library,
  MessageSquareText,
  School,
  Trophy,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react'

import { MyTeacherLoadCard } from '@/features/teacher-load/components/my-teacher-load-card'
import { USER_ROLE_LABELS, type UserRole } from '@/lib/types/user-role.types'

import type { QuickLink } from './dashboard-ui'
import { DashboardSection, QuickLinks } from './dashboard-ui'

const TEACHER_LINKS: QuickLink[] = [
  { href: '/schedule', label: 'Розклад занять', icon: CalendarDays },
  { href: '/attendance', label: 'Відвідуваність', icon: UserCheck },
  { href: '/grades', label: 'Успішність', icon: BarChart3 },
  { href: '/my-group', label: 'Моя група', icon: Users },
  { href: '/my-classroom', label: 'Мій кабінет', icon: DoorOpen },
  { href: '/teacher-load', label: 'Педагогічне навантаження', icon: BookOpenCheck },
  { href: '/assignments', label: 'Завдання', icon: ClipboardList },
  { href: '/surveys', label: 'Опитування', icon: MessageSquareText },
]

const MANAGEMENT_LINKS: QuickLink[] = [
  { href: '/academic-groups', label: 'Навчальні групи', icon: Users },
  { href: '/students', label: 'Студенти', icon: GraduationCap },
  { href: '/teachers', label: 'Викладачі', icon: UserCog },
  { href: '/academic-plans', label: 'Навчальні плани', icon: Library },
  { href: '/teacher-load', label: 'Педагогічне навантаження', icon: BookOpenCheck },
  { href: '/rating', label: 'Рейтинг успішності', icon: Trophy },
  { href: '/attestation', label: 'Атестація викладачів', icon: Award },
  { href: '/educational-programs', label: 'Освітні програми', icon: BookMarked },
]

const DISPATCHER_LINKS: QuickLink[] = [
  { href: '/schedule', label: 'Розклад занять', icon: CalendarDays },
  { href: '/schedule/builder', label: 'Конструктор розкладу', icon: CalendarRange },
  { href: '/academic-groups', label: 'Навчальні групи', icon: Users },
  { href: '/classrooms', label: 'Навчальні кабінети', icon: School },
  { href: '/teacher-load', label: 'Педагогічне навантаження', icon: BookOpenCheck },
]

/** Набір швидких переходів для ролей без власного дашборду. */
function linksForRole(role: UserRole): QuickLink[] {
  switch (role) {
    case 'TEACHER':
      return TEACHER_LINKS
    case 'SCHEDULE_DISPATCHER':
      return DISPATCHER_LINKS
    case 'HEAD_OF_DEPARTMENT':
    case 'DEPUTY_DIRECTOR':
    case 'DIRECTOR':
      return MANAGEMENT_LINKS
    default:
      return TEACHER_LINKS
  }
}

/**
 * Базовий кабінет для ролей, у яких ще немає власного дашборду.
 * Готовий каркас: додаємо роль у `DashboardClient` — і вона отримує свій вигляд.
 */
export function DefaultDashboard({ role, name }: { role: UserRole; name: string }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h1 className="text-xl font-bold tracking-tight">Вітаємо, {name}!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ваша роль у системі — {USER_ROLE_LABELS[role].toLowerCase()}.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DashboardSection title="Швидкі переходи">
            <QuickLinks links={linksForRole(role)} />
          </DashboardSection>
        </div>

        <div className="space-y-5">
          {/* Рендериться лише для викладачів — для інших ролей повертає null */}
          <MyTeacherLoadCard />
        </div>
      </div>
    </div>
  )
}
