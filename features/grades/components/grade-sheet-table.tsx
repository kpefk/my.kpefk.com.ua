'use client'

import { useState } from 'react'
import { BookOpen, Download, Loader2, Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

import {
  downloadJournal,
  downloadVidomist,
  useGradeSheet,
  useGradeWeightSettings,
  useRecordGradesBulk,
} from '../api'
import { computeSuggestedGrade, gradeRange, isCredit, nationalGradeBadgeVariant } from '../lib/grade-scale'
import type {
  GradeScale,
  GradeSheetStudentDto,
  NationalGrade,
  StudentGradeInput,
  TermControlForm,
} from '../types'
import {
  CONTROL_FORM_LABELS,
  GRADE_SCALE_LABELS,
  NATIONAL_GRADE_LABELS,
} from '../types'
import { GradeEntryDialog } from './grade-entry-dialog'

interface GradeSheetTableProps {
  componentTermId: string
  groupId: string
  academicYear: string
  subjectName: string
}

export function GradeSheetTable({
  componentTermId,
  groupId,
  academicYear,
  subjectName,
}: GradeSheetTableProps) {
  const { data: sheet, isLoading } = useGradeSheet(componentTermId, groupId, academicYear)
  const { data: weights } = useGradeWeightSettings()
  const bulkMutation = useRecordGradesBulk()

  const [bulkMode, setBulkMode] = useState(false)
  const [bulkGrades, setBulkGrades] = useState<Map<string, string>>(new Map())
  const [bulkCredits, setBulkCredits] = useState<Map<string, NationalGrade>>(new Map())
  const [dialogStudent, setDialogStudent] = useState<GradeSheetStudentDto | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadingJournal, setDownloadingJournal] = useState(false)

  if (isLoading || !sheet) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  const credit = isCredit(sheet.controlForm)
  const { min, max } = gradeRange(sheet.gradeScale)

  function setBulkGrade(studentId: string, value: string) {
    setBulkGrades((prev) => new Map(prev).set(studentId, value))
  }

  function setBulkCredit(studentId: string, value: NationalGrade) {
    setBulkCredits((prev) => new Map(prev).set(studentId, value))
  }

  function handleBulkSave() {
    if (!sheet) return
    const grades: StudentGradeInput[] = []

    for (const student of sheet.students) {
      if (credit) {
        const val = bulkCredits.get(student.studentId)
        if (val) {
          grades.push({ studentId: student.studentId, nationalGradeOverride: val })
        }
      } else {
        const raw = bulkGrades.get(student.studentId)
        if (raw) {
          const n = Number(raw)
          if (n >= min && n <= max) {
            grades.push({ studentId: student.studentId, finalGrade: n })
          }
        }
      }
    }

    if (grades.length === 0) return

    bulkMutation.mutate(
      { curriculumComponentTermId: componentTermId, groupId, academicYear, grades },
      {
        onSuccess: () => {
          setBulkMode(false)
          setBulkGrades(new Map())
          setBulkCredits(new Map())
        },
      },
    )
  }

  function cancelBulk() {
    setBulkMode(false)
    setBulkGrades(new Map())
    setBulkCredits(new Map())
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadVidomist(componentTermId, groupId, academicYear, subjectName)
    } finally {
      setDownloading(false)
    }
  }

  async function handleDownloadJournal() {
    if (!sheet) return
    setDownloadingJournal(true)
    try {
      await downloadJournal(componentTermId, groupId, academicYear, sheet.semesterNumber, subjectName)
    } finally {
      setDownloadingJournal(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">{subjectName}</h2>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant="outline">{GRADE_SCALE_LABELS[sheet.gradeScale]}</Badge>
            {sheet.controlForm && (
              <Badge variant="outline">{CONTROL_FORM_LABELS[sheet.controlForm]}</Badge>
            )}
            <Badge variant="outline">{sheet.ects} ECTS</Badge>
            <Badge variant="outline">{sheet.totalHours} год.</Badge>
            <Badge variant="secondary">{sheet.semesterNumber} семестр</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {bulkMode ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelBulk}>
                Скасувати
              </Button>
              <Button
                size="sm"
                onClick={handleBulkSave}
                disabled={bulkMutation.isPending}
              >
                {bulkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : null}
                Зберегти
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Download className="w-4 h-4 mr-1.5" />
                )}
                Відомість
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadJournal}
                disabled={downloadingJournal}
              >
                {downloadingJournal ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <BookOpen className="w-4 h-4 mr-1.5" />
                )}
                Журнал
              </Button>
              <Button variant="outline" size="sm" onClick={() => setBulkMode(true)}>
                <Pencil className="w-4 h-4 mr-1.5" />
                Масове введення
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>ПІБ</TableHead>
              <TableHead className="w-28 text-center">Оцінка</TableHead>
              <TableHead className="w-36 text-center">Нац. шкала</TableHead>
              <TableHead className="w-20 text-center">Спроба</TableHead>
              {!bulkMode && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheet.students.map((s, idx) => (
              <TableRow key={s.studentId}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium">{s.fullName}</TableCell>
                <TableCell className="text-center">
                  {bulkMode ? (
                    credit ? (
                      <CreditToggle
                        value={bulkCredits.get(s.studentId) ?? s.grade?.nationalGrade}
                        onChange={(v) => setBulkCredit(s.studentId, v)}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <Input
                          type="number"
                          min={min}
                          max={max}
                          value={bulkGrades.get(s.studentId) ?? ''}
                          onChange={(e) => setBulkGrade(s.studentId, e.target.value)}
                          placeholder={s.grade?.finalGrade?.toString() ?? `${min}–${max}`}
                          className="w-20 mx-auto text-center h-8"
                        />
                        {weights && (() => {
                          const raw = bulkGrades.get(s.studentId)
                          if (!raw) return null
                          const n = Number(raw)
                          if (Number.isNaN(n)) return null
                          const suggested = computeSuggestedGrade(
                            s.currentAverage,
                            n,
                            weights,
                            sheet.gradeScale,
                          )
                          if (suggested === n) return null
                          return (
                            <button
                              type="button"
                              onClick={() => setBulkGrade(s.studentId, String(suggested))}
                              title={`За формулою (${weights.currentWeight}/${weights.examWeight}): ${suggested}`}
                              className="text-[10px] text-primary hover:underline whitespace-nowrap"
                            >
                              Формула: {suggested}
                            </button>
                          )
                        })()}
                      </div>
                    )
                  ) : s.grade?.finalGrade !== null && s.grade?.finalGrade !== undefined ? (
                    <span className="text-lg font-bold tabular-nums">
                      {s.grade.finalGrade}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {!bulkMode && s.grade ? (
                    <Badge variant={nationalGradeBadgeVariant(s.grade.nationalGrade)}>
                      {NATIONAL_GRADE_LABELS[s.grade.nationalGrade]}
                    </Badge>
                  ) : (
                    !bulkMode && <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {s.grade ? s.grade.attempt : '—'}
                </TableCell>
                {!bulkMode && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDialogStudent(s)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {sheet.students.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Немає студентів у групі
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Individual grade entry dialog */}
      <GradeEntryDialog
        open={!!dialogStudent}
        onOpenChange={(open) => !open && setDialogStudent(null)}
        student={dialogStudent}
        componentTermId={componentTermId}
        academicYear={academicYear}
        controlForm={sheet.controlForm}
        gradeScale={sheet.gradeScale}
        subjectName={subjectName}
      />
    </div>
  )
}

function CreditToggle({
  value,
  onChange,
}: {
  value: NationalGrade | undefined
  onChange: (v: NationalGrade) => void
}) {
  return (
    <div className="flex gap-1 justify-center">
      <Button
        variant={value === 'PASSED' ? 'default' : 'outline'}
        size="sm"
        className="h-7 text-xs px-2"
        onClick={() => onChange('PASSED')}
      >
        Зар.
      </Button>
      <Button
        variant={value === 'NOT_PASSED' ? 'destructive' : 'outline'}
        size="sm"
        className="h-7 text-xs px-2"
        onClick={() => onChange('NOT_PASSED')}
      >
        Не зар.
      </Button>
    </div>
  )
}
