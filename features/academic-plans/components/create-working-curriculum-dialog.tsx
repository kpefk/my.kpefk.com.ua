'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useCreateWorkingCurriculum } from '../api'

interface CreateWorkingCurriculumDialogProps {
  open: boolean
  onClose: () => void
  versionId: string
  /** Max semesters in this curriculum version */
  maxSemesters?: number
}

export function CreateWorkingCurriculumDialog({
  open,
  onClose,
  versionId,
  maxSemesters = 8,
}: CreateWorkingCurriculumDialogProps) {
  const currentYear = new Date().getFullYear()
  const [academicYear, setAcademicYear] = useState(
    `${currentYear}-${currentYear + 1}`,
  )
  const [semesterNumbers, setSemesterNumbers] = useState<number[]>([])
  const [notes, setNotes] = useState('')

  const createWorking = useCreateWorkingCurriculum()

  useEffect(() => {
    if (open) {
      setAcademicYear(`${currentYear}-${currentYear + 1}`)
      setSemesterNumbers([])
      setNotes('')
    }
  }, [open, currentYear])

  const toggleSemester = (s: number) => {
    setSemesterNumbers((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].sort((a, b) => a - b),
    )
  }

  const isValidYear = /^\d{4}-\d{4}$/.test(academicYear)
  const isValid = isValidYear && semesterNumbers.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    createWorking.mutate(
      {
        versionId,
        academicYear,
        semesterNumbers,
        notes: notes.trim() || undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Новий робочий навчальний план</DialogTitle>
          <DialogDescription>
            Робочий план оперативно деталізує розподіл годин для конкретного
            навчального року.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
          {/* Academic year */}
          <Field>
            <FieldLabel htmlFor="wc-year">
              Навчальний рік <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="wc-year"
              placeholder="2024-2025"
              pattern="\d{4}-\d{4}"
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-background font-mono"
            />
            {!isValidYear && academicYear.length > 0 && (
              <p className="text-xs text-destructive mt-1">Формат: РРРР-РРРР</p>
            )}
          </Field>

          {/* Semester numbers */}
          <Field>
            <FieldLabel>
              Семестри, що охоплює план <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <Checkbox
                    id={`sem-${s}`}
                    checked={semesterNumbers.includes(s)}
                    onCheckedChange={() => toggleSemester(s)}
                  />
                  <Label htmlFor={`sem-${s}`} className="text-sm cursor-pointer">
                    Сем. {s}
                  </Label>
                </div>
              ))}
            </div>
            {semesterNumbers.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Оберіть хоча б один семестр
              </p>
            )}
          </Field>

          {/* Notes */}
          <Field>
            <FieldLabel htmlFor="wc-notes">Примітки</FieldLabel>
            <Input
              id="wc-notes"
              placeholder="Необов&#39;язково"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background"
            />
          </Field>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={!isValid || createWorking.isPending}>
              {createWorking.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Створити'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
