'use client'

import { TriangleAlert, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { useAllTeachersLoad } from '../api'
import { teacherShortName } from '../types'

export function AllTeachersTable({ academicYear }: { academicYear: string }) {
  const { data, isLoading, isError } = useAllTeachersLoad(academicYear)

  if (academicYear === '') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
        <Users className="w-10 h-10 opacity-30" />
        <p className="text-sm">Оберіть конкретний навчальний рік для зведення по викладачах</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Не вдалося завантажити зведення навантаження.
      </div>
    )
  }

  if (data.rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        За {academicYear} немає призначеного навантаження.
      </div>
    )
  }

  const overloaded = data.rows.filter((r) => r.teachingHoursExceeded).length

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-border text-xs text-muted-foreground">
        <span>Викладачів: <strong className="text-foreground">{data.rows.length}</strong></span>
        {overloaded > 0 && (
          <span className="text-destructive flex items-center gap-1">
            <TriangleAlert className="w-3.5 h-3.5" /> Перевищення ліміту: {overloaded}
          </span>
        )}
        {data.unassignedComponents > 0 && (
          <span className="text-amber-600 dark:text-amber-400">
            Без викладача: {data.unassignedComponents} компонентів
          </span>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Викладач</TableHead>
            <TableHead>Кафедра / відділення</TableHead>
            <TableHead className="text-center w-20">Ставка</TableHead>
            <TableHead className="text-center w-24">Дисциплін</TableHead>
            <TableHead className="text-center w-20">Планів</TableHead>
            <TableHead className="text-right w-32">Години / ліміт</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((r) => (
            <TableRow key={r.teacher.id}>
              <TableCell className="font-medium">
                {teacherShortName(r.teacher)}
                {r.teacher.positionName && (
                  <span className="block text-xs text-muted-foreground">{r.teacher.positionName}</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {r.teacher.departmentName ?? '—'}
              </TableCell>
              <TableCell className="text-center tabular-nums">{r.teacher.rate}</TableCell>
              <TableCell className="text-center tabular-nums">{r.disciplineCount}</TableCell>
              <TableCell className="text-center tabular-nums">{r.workingCurriculumCount}</TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    'tabular-nums font-medium',
                    r.teachingHoursExceeded && 'text-destructive',
                  )}
                >
                  {r.totalTeachingHours}
                </span>
                <span className="text-muted-foreground tabular-nums"> / {r.teachingHoursLimit}</span>
                {r.teachingHoursExceeded && (
                  <Badge variant="destructive" className="ml-2 text-[10px]">!</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
