'use client'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { useGradeWeightSettings, useRecordGrade } from '../api'
import {
  computeSuggestedGrade,
  gradeRange,
  isCredit,
  nationalGradeBadgeVariant,
  toNationalGradePreview,
} from '../lib/grade-scale'
import type {
  GradeScale,
  GradeSheetStudentDto,
  NationalGrade,
  TermControlForm,
} from '../types'
import { NATIONAL_GRADE_LABELS } from '../types'

interface GradeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: GradeSheetStudentDto | null
  componentTermId: string
  academicYear: string
  controlForm: TermControlForm | null
  gradeScale: GradeScale
  subjectName: string
}

export function GradeEntryDialog({
  open,
  onOpenChange,
  student,
  componentTermId,
  academicYear,
  controlForm,
  gradeScale,
  subjectName,
}: GradeEntryDialogProps) {
  const [gradeValue, setGradeValue] = useState('')
  const [creditResult, setCreditResult] = useState<'PASSED' | 'NOT_PASSED'>('PASSED')
  const [isRetake, setIsRetake] = useState(false)

  const recordGrade = useRecordGrade()
  const { data: weights } = useGradeWeightSettings()
  const credit = isCredit(controlForm)
  const { min, max } = gradeRange(gradeScale)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setGradeValue('')
      setCreditResult('PASSED')
      setIsRetake(false)
    }
    onOpenChange(nextOpen)
  }

  function handleSave() {
    if (!student) return

    const hasExistingGrade = !!student.grade
    const payload = {
      studentId: student.studentId,
      curriculumComponentTermId: componentTermId,
      academicYear,
      ...(credit
        ? { nationalGradeOverride: creditResult as NationalGrade }
        : { finalGrade: Number(gradeValue) }),
      ...(isRetake || hasExistingGrade ? { isRetake: true } : {}),
    }

    recordGrade.mutate(payload, {
      onSuccess: () => handleOpenChange(false),
    })
  }

  const numericGrade = Number(gradeValue)
  const validNumeric = !credit && gradeValue !== '' && numericGrade >= min && numericGrade <= max
  const canSave = credit || validNumeric

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Виставити оцінку</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Студент</p>
            <p className="font-medium">{student?.fullName}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Дисципліна</p>
            <p className="font-medium">{subjectName}</p>
          </div>

          {student?.grade && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground mb-1">Поточна оцінка</p>
              <div className="flex items-center gap-2">
                {student.grade.finalGrade !== null && (
                  <span className="text-lg font-bold tabular-nums">
                    {student.grade.finalGrade}
                  </span>
                )}
                <Badge variant={nationalGradeBadgeVariant(student.grade.nationalGrade)}>
                  {NATIONAL_GRADE_LABELS[student.grade.nationalGrade]}
                </Badge>
                {student.grade.attempt > 1 && (
                  <Badge variant="outline">Спроба {student.grade.attempt}</Badge>
                )}
              </div>
            </div>
          )}

          {credit ? (
            <div className="space-y-2">
              <Label>Результат заліку</Label>
              <RadioGroup
                value={creditResult}
                onValueChange={(v) => setCreditResult(v as 'PASSED' | 'NOT_PASSED')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="PASSED" id="passed" />
                  <Label htmlFor="passed" className="font-normal cursor-pointer">
                    Зараховано
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="NOT_PASSED" id="not-passed" />
                  <Label htmlFor="not-passed" className="font-normal cursor-pointer">
                    Не зараховано
                  </Label>
                </div>
              </RadioGroup>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="grade-input">
                Оцінка ({min}–{max})
              </Label>
              <Input
                id="grade-input"
                type="number"
                min={min}
                max={max}
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                placeholder={`${min}–${max}`}
                autoFocus
              />
              {(student?.currentAverage !== null && student?.currentAverage !== undefined) && (
                <p className="text-xs text-muted-foreground">
                  Поточна успішність: <span className="font-medium">{student.currentAverage}</span>
                </p>
              )}
              {weights && student && gradeValue !== '' && !Number.isNaN(numericGrade) && (() => {
                const suggested = computeSuggestedGrade(
                  student.currentAverage,
                  numericGrade,
                  weights,
                  gradeScale,
                )
                if (suggested === numericGrade) return null
                return (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      За формулою ({weights.currentWeight}/{weights.examWeight}): {suggested}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGradeValue(String(suggested))}
                      className="text-primary hover:underline font-medium"
                    >
                      Застосувати
                    </button>
                  </div>
                )
              })()}
              {validNumeric && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Національна:</span>
                  <Badge variant={nationalGradeBadgeVariant(toNationalGradePreview(numericGrade, gradeScale))}>
                    {NATIONAL_GRADE_LABELS[toNationalGradePreview(numericGrade, gradeScale)]}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {student?.grade && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="retake-check"
                checked={isRetake}
                onChange={(e) => setIsRetake(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="retake-check" className="font-normal cursor-pointer text-sm">
                Перездача (нова спроба)
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!canSave || recordGrade.isPending}>
            {recordGrade.isPending ? 'Збереження...' : 'Зберегти'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
