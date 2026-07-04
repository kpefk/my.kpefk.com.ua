'use client'

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

import { useStudentTranscript } from '../api'
import { nationalGradeBadgeVariant } from '../lib/grade-scale'
import {
  CONTROL_FORM_LABELS,
  GRADE_SCALE_LABELS,
  NATIONAL_GRADE_LABELS,
} from '../types'

interface StudentTranscriptProps {
  studentId: string
  academicYear?: string
  semesterNumber?: number
}

export function StudentTranscript({
  studentId,
  academicYear,
  semesterNumber,
}: StudentTranscriptProps) {
  const { data: transcript, isLoading } = useStudentTranscript(
    studentId,
    academicYear,
    semesterNumber,
  )

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  if (!transcript || transcript.grades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
        <p className="font-semibold">Немає оцінок</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          За обраний період оцінок поки немає.
        </p>
      </div>
    )
  }

  const bySemester = new Map<number, typeof transcript.grades>()
  for (const g of transcript.grades) {
    const arr = bySemester.get(g.semesterNumber) ?? []
    arr.push(g)
    bySemester.set(g.semesterNumber, arr)
  }

  const semesters = [...bySemester.entries()].sort(([a], [b]) => a - b)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Залікова книжка</h2>
        <p className="text-sm text-muted-foreground">{transcript.fullName}</p>
      </div>

      {semesters.map(([sem, grades]) => (
        <div key={sem} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {sem} семестр
          </h3>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дисципліна</TableHead>
                  <TableHead className="w-28 text-center">Оцінка</TableHead>
                  <TableHead className="w-36 text-center">Нац. шкала</TableHead>
                  <TableHead className="w-24 text-center">ECTS</TableHead>
                  <TableHead className="w-28 text-center">Контроль</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{g.subjectName}</span>
                        {g.attempt > 1 && (
                          <Badge variant="outline" className="text-xs">
                            Спроба {g.attempt}
                          </Badge>
                        )}
                      </div>
                      {g.componentCode && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {g.componentCode}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {g.finalGrade !== null ? (
                        <span className="text-lg font-bold tabular-nums">
                          {g.finalGrade}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={nationalGradeBadgeVariant(g.nationalGrade)}>
                        {NATIONAL_GRADE_LABELS[g.nationalGrade]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {g.ects}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs text-muted-foreground">
                        {CONTROL_FORM_LABELS[g.controlForm]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
