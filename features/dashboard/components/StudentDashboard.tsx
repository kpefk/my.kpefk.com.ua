'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  BookMarked,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  MessageSquareText,
  Percent,
  TrendingUp,
  UserCheck,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentSemesterSummary } from '@/features/attendance/api'
import { useStudentTranscript } from '@/features/grades/api'
import { CONTROL_FORM_LABELS } from '@/features/grades/types'
import { useMySurveys } from '@/features/surveys/api'
import { useProfile } from '@/features/users/api'
import { cn } from '@/lib/utils'

import { currentAcademicYear, currentSemester } from '../types'
import { DashboardSection, EmptyHint, QuickLinks, StatCard } from './dashboard-ui'

const QUICK_LINKS = [
  { href: '/schedule', label: 'Розклад занять', icon: CalendarDays },
  { href: '/grades', label: 'Успішність', icon: GraduationCap },
  { href: '/attendance', label: 'Відвідуваність', icon: UserCheck },
  { href: '/electives', label: 'Вибіркові дисципліни', icon: BookMarked },
  { href: '/surveys', label: 'Опитування', icon: MessageSquareText },
  { href: '/assignments', label: 'Завдання', icon: ClipboardList },
]

export function StudentDashboard({ userId }: { userId: string }) {
  const academicYear = currentAcademicYear()
  const semester = currentSemester()

  const { data: profile, isLoading: profileLoading } = useProfile()
  // Бекенд для ролі STUDENT завжди підставляє власний studentId (IDOR-захист).
  const { data: transcript, isLoading: gradesLoading } = useStudentTranscript(userId, academicYear)
  const { data: attendance, isLoading: attendanceLoading } = useStudentSemesterSummary(
    userId,
    academicYear,
    semester
  )
  const { data: surveys = [], isLoading: surveysLoading } = useMySurveys()

  const grades = useMemo(() => transcript?.grades ?? [], [transcript])

  const gradeStats = useMemo(() => {
    const graded = grades.filter((g) => g.finalGrade !== null)
    const average =
      graded.length > 0
        ? graded.reduce((s, g) => s + (g.finalGrade ?? 0), 0) / graded.length
        : null
    const ects = graded.reduce((s, g) => s + (g.ects ?? 0), 0)
    return { average, ects, gradedCount: graded.length }
  }, [grades])

  const attendanceStats = useMemo(() => {
    const disciplines = attendance?.disciplines ?? []
    const totalLessons = disciplines.reduce((s, d) => s + d.totalLessons, 0)
    const attended = disciplines.reduce((s, d) => s + d.attended, 0)
    const absent = disciplines.reduce((s, d) => s + d.absent, 0)
    return {
      percent: totalLessons > 0 ? Math.round((attended / totalLessons) * 100) : null,
      absent,
      disciplines,
    }
  }, [attendance])

  const pendingSurveys = useMemo(() => surveys.filter((s) => !s.completed), [surveys])

  const student = profile?.student ?? null
  const firstName = student?.personFIO?.split(' ')[1] ?? student?.personFIO?.split(' ')[0] ?? null

  // Найпроблемніші дисципліни за відвідуваністю
  const worstAttendance = useMemo(
    () =>
      [...attendanceStats.disciplines]
        .filter((d) => d.totalLessons > 0)
        .sort((a, b) => a.attendancePercent - b.attendancePercent)
        .slice(0, 5),
    [attendanceStats.disciplines]
  )

  const recentGrades = useMemo(
    () => grades.filter((g) => g.finalGrade !== null).slice(0, 6),
    [grades]
  )

  return (
    <div className="space-y-5">
      {/* Привітання + навчальний контекст */}
      <section className="rounded-2xl border border-border bg-card p-5">
        {profileLoading ? (
          <Skeleton className="h-14 w-full" />
        ) : (
          <>
            <h1 className="text-xl font-bold tracking-tight">
              Вітаємо{firstName ? `, ${firstName}` : ''}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {[
                student?.groupName ? `Група ${student.groupName}` : null,
                student?.courseName,
                student?.fullSpecialityName,
              ]
                .filter(Boolean)
                .join(' · ') || 'Особистий кабінет студента'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {academicYear} н. р. · {semester} семестр
            </p>
          </>
        )}
      </section>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Середній бал"
          value={gradeStats.average !== null ? gradeStats.average.toFixed(1) : '—'}
          hint={`${gradeStats.gradedCount} оцінок за рік`}
          icon={TrendingUp}
          href="/grades"
          isLoading={gradesLoading}
        />
        <StatCard
          label="Кредитів ЄКТС"
          value={gradeStats.ects || '—'}
          hint="за оціненими дисциплінами"
          icon={GraduationCap}
          href="/grades"
          isLoading={gradesLoading}
        />
        <StatCard
          label="Відвідуваність"
          value={attendanceStats.percent !== null ? `${attendanceStats.percent}%` : '—'}
          hint={`${attendanceStats.absent} пропусків у семестрі`}
          icon={Percent}
          href="/attendance"
          isLoading={attendanceLoading}
          accent={
            attendanceStats.percent !== null && attendanceStats.percent < 75
              ? 'text-amber-500'
              : undefined
          }
        />
        <StatCard
          label="Опитувань пройти"
          value={pendingSurveys.length}
          hint={pendingSurveys.length > 0 ? 'потребують відповіді' : 'усе пройдено'}
          icon={MessageSquareText}
          href="/surveys"
          isLoading={surveysLoading}
          accent={pendingSurveys.length > 0 ? 'text-primary' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Оцінки */}
          <DashboardSection
            title="Останні оцінки"
            description={`Навчальний рік ${academicYear}`}
            href="/grades"
            hrefLabel="Усі оцінки"
          >
            {gradesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentGrades.length === 0 ? (
              <EmptyHint>Оцінок за цей навчальний рік ще немає</EmptyHint>
            ) : (
              <ul className="divide-y divide-border">
                {recentGrades.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{g.subjectName}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.semesterNumber} семестр
                        {g.controlForm ? ` · ${CONTROL_FORM_LABELS[g.controlForm]}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 tabular-nums">
                      {g.finalGrade}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          {/* Швидкі переходи */}
          <DashboardSection title="Швидкі переходи">
            <QuickLinks links={QUICK_LINKS} />
          </DashboardSection>
        </div>

        <div className="space-y-5">
          {/* Опитування */}
          <DashboardSection
            title="Опитування"
            description="Незавершені анкети"
            href="/surveys"
          >
            {surveysLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : pendingSurveys.length === 0 ? (
              <EmptyHint>Немає активних опитувань</EmptyHint>
            ) : (
              <ul className="space-y-2">
                {pendingSurveys.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link
                      href="/surveys"
                      className="block rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-accent/40"
                    >
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      {s.closesAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          до {new Date(s.closesAt).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          {/* Відвідуваність по дисциплінах */}
          <DashboardSection
            title="Відвідуваність"
            description={`${semester} семестр`}
            href="/attendance"
          >
            {attendanceLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : worstAttendance.length === 0 ? (
              <EmptyHint>Даних про заняття ще немає</EmptyHint>
            ) : (
              <div className="space-y-3">
                {worstAttendance.map((d) => (
                  <div key={d.componentTermId} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-muted-foreground">{d.subjectName}</span>
                      <span
                        className={cn(
                          'tabular-nums font-medium shrink-0',
                          d.attendancePercent < 75 ? 'text-amber-600 dark:text-amber-400' : ''
                        )}
                      >
                        {d.attendancePercent}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          d.attendancePercent < 75 ? 'bg-amber-500' : 'bg-primary'
                        )}
                        style={{ width: `${Math.min(d.attendancePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    </div>
  )
}
