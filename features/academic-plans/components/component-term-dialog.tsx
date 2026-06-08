'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  TERM_CONTROL_FORM_LABELS,
  type CurriculumComponentTermDto,
  type TermControlForm,
} from '../types'

const TERM_CONTROL_FORM_OPTIONS: Array<TermControlForm> = ['EXAM', 'CREDIT', 'GRADED_CREDIT']
const NONE_SENTINEL = 'NONE' // placeholder — Radix Select forbids value=""

interface ComponentTermDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentName: string
  semesterNumber: number
  /** component.totalHours — the hard cap for this component */
  totalHours: number
  /** hours already assigned to other semesters of this component (current term excluded on edit) */
  allocatedHours: number
  initialData?: CurriculumComponentTermDto
  onSubmit: (data: {
    hours: number
    hoursPerWeek?: number
    controlForm?: TermControlForm
    hasCourseWork: boolean
    hasCourseProject: boolean
  }) => void
  onDelete?: () => void
  isPending: boolean
}

export function ComponentTermDialog({
  open,
  onOpenChange,
  componentName,
  semesterNumber,
  totalHours,
  allocatedHours,
  initialData,
  onSubmit,
  onDelete,
  isPending,
}: ComponentTermDialogProps) {
  const [hours, setHours] = useState(initialData ? String(initialData.hours) : '')
  const [hoursPerWeek, setHoursPerWeek] = useState(
    initialData?.hoursPerWeek != null ? String(initialData.hoursPerWeek) : '',
  )
  const [controlForm, setControlForm] = useState<TermControlForm | typeof NONE_SENTINEL>(
    initialData?.controlForm ?? NONE_SENTINEL,
  )
  const [hasCourseWork, setHasCourseWork] = useState(initialData?.hasCourseWork ?? false)
  const [hasCourseProject, setHasCourseProject] = useState(
    initialData?.hasCourseProject ?? false,
  )

  useEffect(() => {
    if (open) {
      setHours(initialData ? String(initialData.hours) : '')
      setHoursPerWeek(initialData?.hoursPerWeek != null ? String(initialData.hoursPerWeek) : '')
      setControlForm(initialData?.controlForm ?? NONE_SENTINEL)
      setHasCourseWork(initialData?.hasCourseWork ?? false)
      setHasCourseProject(initialData?.hasCourseProject ?? false)
    }
  }, [open, initialData])

  const hoursVal = parseInt(hours, 10)
  const hpwVal = parseInt(hoursPerWeek, 10)
  const remainingHours = totalHours - allocatedHours
  const hoursExceeded = Number.isFinite(hoursVal) && hoursVal > remainingHours

  const canSubmit = Number.isFinite(hoursVal) && hoursVal >= 0 && !hoursExceeded

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      hours: hoursVal,
      hoursPerWeek: Number.isFinite(hpwVal) && hpwVal >= 1 ? hpwVal : undefined,
      controlForm: controlForm !== NONE_SENTINEL ? (controlForm as TermControlForm) : undefined,
      hasCourseWork,
      hasCourseProject,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Редагувати' : 'Додати'} семестр {semesterNumber}
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{componentName}</p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Hours budget bar */}
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 flex items-center justify-between text-xs gap-3 flex-wrap">
            <span className="text-muted-foreground">
              Годин загалом:{' '}
              <span className="font-mono font-medium text-foreground">{totalHours}</span>
            </span>
            <span className="text-muted-foreground">
              Розподілено:{' '}
              <span className="font-mono font-medium text-foreground">{allocatedHours}</span>
            </span>
            <span className="text-muted-foreground">
              Залишок:{' '}
              <span
                className={cn(
                  'font-mono font-semibold',
                  remainingHours < 0
                    ? 'text-destructive'
                    : 'text-emerald-600 dark:text-emerald-400',
                )}
              >
                {remainingHours}
              </span>
            </span>
          </div>

          {/* Годин / Год.тижд. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="term-hours" className={cn(hoursExceeded && 'text-destructive')}>
                Годин *{hoursExceeded && ` (макс. ${remainingHours})`}
              </Label>
              <Input
                id="term-hours"
                type="number"
                min={0}
                max={remainingHours}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="135"
                className={cn(
                  hoursExceeded && 'border-destructive focus-visible:ring-destructive',
                )}
              />
              {hoursExceeded && (
                <p className="text-xs text-destructive">
                  Перевищено ліміт на {hoursVal - remainingHours} год.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="term-hpw">Год./тижд.</Label>
              <Input
                id="term-hpw"
                type="number"
                min={1}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                placeholder="2"
              />
              <p className="text-xs text-muted-foreground leading-tight">
                Знаменник у &#34;34/<strong>2</strong>&#34;
              </p>
            </div>
          </div>

          {/* Control form */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="control-form">Форма контролю</Label>
            <Select
              value={controlForm}
              onValueChange={(v) => setControlForm(v as TermControlForm | typeof NONE_SENTINEL)}
            >
              <SelectTrigger id="control-form">
                <SelectValue placeholder="(не вказано)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_SENTINEL}>
                  <span className="text-muted-foreground">(не вказано)</span>
                </SelectItem>
                {TERM_CONTROL_FORM_OPTIONS.map((form) => (
                  <SelectItem key={form} value={form}>
                    {TERM_CONTROL_FORM_LABELS[form]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KP / KP checkboxes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="has-cw"
                checked={hasCourseWork}
                onCheckedChange={(v) => setHasCourseWork(!!v)}
              />
              <Label htmlFor="has-cw" className="cursor-pointer font-normal">
                Курсова робота (КР)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="has-cp"
                checked={hasCourseProject}
                onCheckedChange={(v) => setHasCourseProject(!!v)}
              />
              <Label htmlFor="has-cp" className="cursor-pointer font-normal">
                Курсовий проєкт (КП)
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={onDelete}
              className="sm:mr-auto"
            >
              Видалити
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
            {initialData ? 'Зберегти' : 'Додати'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
