'use client'

import { BookOpenCheck, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useUser } from '@/store/auth.store'

import { useMyTeacherLoad } from '../api'

/** Поточний навчальний рік: вересень+ → year-(year+1), інакше (year-1)-year. */
function currentAcademicYear(): string {
  const now = new Date()
  const y = now.getFullYear()
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

export function MyTeacherLoadCard() {
  const user = useUser()
  const isTeacher = user?.role === 'TEACHER'
  const academicYear = currentAcademicYear()

  const { data, isLoading } = useMyTeacherLoad(academicYear, isTeacher)

  // Картка лише для викладачів.
  if (!isTeacher) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpenCheck className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Моє навантаження</h2>
        <span className="text-xs text-muted-foreground ml-auto">{academicYear}</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !data || data.plans.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Навантаження на {academicYear} ще не призначено.
        </div>
      ) : (
        <MyLoadBody data={data} />
      )}
    </div>
  )
}

function MyLoadBody({ data }: { data: NonNullable<ReturnType<typeof useMyTeacherLoad>['data']> }) {
  const pct =
    data.teachingHoursLimit > 0
      ? Math.min(100, Math.round((data.totalTeachingHours / data.teachingHoursLimit) * 100))
      : 0

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <span
            className={cn(
              'text-3xl font-bold tabular-nums',
              data.teachingHoursExceeded && 'text-destructive',
            )}
          >
            {data.totalTeachingHours}
          </span>
          <span className="text-sm text-muted-foreground"> / {data.teachingHoursLimit} год</span>
        </div>
        {data.teachingHoursExceeded && (
          <Badge variant="destructive" className="gap-1">
            <TriangleAlert className="w-3 h-3" /> Перевищення
          </Badge>
        )}
      </div>

      <Progress
        value={pct}
        className={cn(data.teachingHoursExceeded && '[&>div]:bg-destructive')}
      />

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Дисциплін: <strong className="text-foreground">{data.disciplineCount}</strong></span>
        <span>Планів: <strong className="text-foreground">{data.plans.length}</strong></span>
      </div>

      <ul className="divide-y divide-border border-t border-border">
        {data.plans.map((p) => (
          <li key={p.workingCurriculumId} className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm truncate min-w-0">{p.label}</span>
            <span className="text-sm font-medium tabular-nums shrink-0">{p.totalTeachingHours} год</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
