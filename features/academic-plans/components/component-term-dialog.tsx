'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
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
  CONTROL_FORM_LABELS,
  type ControlForm,
  type CurriculumComponentTermDto,
} from '../types'

const CONTROL_FORM_OPTIONS: ControlForm[] = [
  'EXAM',
  'TEST',
  'DIFFERENTIATED_TEST',
  'COURSE_WORK',
  'COURSE_PROJECT',
  'NONE',
]

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
    ects: number
    hours: number
    controlForm: ControlForm
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
  const [ects, setEcts] = useState(initialData ? String(Number(initialData.ects)) : '')
  const [hours, setHours] = useState(initialData ? String(initialData.hours) : '')
  const [controlForm, setControlForm] = useState<ControlForm>(
    initialData?.controlForm ?? 'NONE',
  )
  const [hasCourseWork, setHasCourseWork] = useState(initialData?.hasCourseWork ?? false)
  const [hasCourseProject, setHasCourseProject] = useState(
    initialData?.hasCourseProject ?? false,
  )

  useEffect(() => {
    if (open) {
      setEcts(initialData ? String(Number(initialData.ects)) : '')
      setHours(initialData ? String(initialData.hours) : '')
      setControlForm(initialData?.controlForm ?? 'NONE')
      setHasCourseWork(initialData?.hasCourseWork ?? false)
      setHasCourseProject(initialData?.hasCourseProject ?? false)
    }
  }, [open, initialData])

  const ectsVal = parseFloat(ects)
  const hoursVal = parseInt(hours, 10)
  const remainingHours = totalHours - allocatedHours
  const hoursExceeded = Number.isFinite(hoursVal) && hoursVal > remainingHours
  const canSubmit =
    Number.isFinite(ectsVal) &&
    ectsVal >= 0 &&
    Number.isFinite(hoursVal) &&
    hoursVal >= 0 &&
    !hoursExceeded

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({ ects: ectsVal, hours: hoursVal, controlForm, hasCourseWork, hasCourseProject })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Редагувати' : 'Додати'} семестр {semesterNumber}
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{componentName}</p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Hours budget */}
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 flex items-center justify-between text-xs gap-4">
            <span className="text-muted-foreground">Годин загалом:</span>
            <span className="font-mono font-medium">{totalHours}</span>
            <span className="text-muted-foreground">Розподілено:</span>
            <span className="font-mono font-medium">{allocatedHours}</span>
            <span className="text-muted-foreground">Залишок:</span>
            <span className={cn('font-mono font-semibold', remainingHours < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
              {remainingHours}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="term-ects">ЄКТС *</Label>
              <Input
                id="term-ects"
                type="number"
                min={0}
                step={0.5}
                max={30}
                value={ects}
                onChange={(e) => setEcts(e.target.value)}
                placeholder="4.5"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="term-hours" className={cn(hoursExceeded && 'text-destructive')}>
                Годин * {hoursExceeded && `(макс. ${remainingHours})`}
              </Label>
              <Input
                id="term-hours"
                type="number"
                min={0}
                max={remainingHours}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="135"
                className={cn(hoursExceeded && 'border-destructive focus-visible:ring-destructive')}
              />
              {hoursExceeded && (
                <p className="text-xs text-destructive">
                  Перевищено ліміт на {hoursVal - remainingHours} год.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="control-form">Форма контролю</Label>
            <Select
              value={controlForm}
              onValueChange={(v) => setControlForm(v as ControlForm)}
            >
              <SelectTrigger id="control-form">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTROL_FORM_OPTIONS.map((form) => (
                  <SelectItem key={form} value={form}>
                    {CONTROL_FORM_LABELS[form]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                Курсовий проект (КП)
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
