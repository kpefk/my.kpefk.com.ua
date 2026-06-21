'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useCopySchedule, useEligibleGroups } from '../api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Розклад-джерело. */
  fromScheduleId: string
  /** Рік джерела (за замовчуванням — цільовий рік). */
  defaultYear: string
  yearOptions: string[]
}

/** Копіювання розкладу як шаблону в іншу групу/семестр (ТЗ §3.8). */
export function ScheduleCopyDialog({
  open,
  onOpenChange,
  fromScheduleId,
  defaultYear,
  yearOptions,
}: Props) {
  const [toYear, setToYear] = useState(defaultYear)
  const [toGroupId, setToGroupId] = useState('')
  const [toSemester, setToSemester] = useState(1)
  const [overwrite, setOverwrite] = useState(false)

  const { data: groups = [] } = useEligibleGroups(toYear)
  const copyMut = useCopySchedule()

  useEffect(() => {
    if (open) {
      setToYear(defaultYear)
      setToGroupId('')
      setToSemester(1)
      setOverwrite(false)
    }
  }, [open, defaultYear])

  function submit() {
    if (!toGroupId) return
    copyMut.mutate(
      {
        fromScheduleId,
        toGroupId,
        toAcademicYear: toYear,
        toSemesterNumber: toSemester,
        overwrite,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Скопіювати розклад</DialogTitle>
          <DialogDescription>
            Перенести заняття цього розкладу як шаблон в іншу групу/семестр.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Навчальний рік</Label>
              <Select value={toYear} onValueChange={(v) => { setToYear(v); setToGroupId('') }}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Семестр</Label>
              <Select value={String(toSemester)} onValueChange={(v) => setToSemester(Number(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Семестр {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Цільова група</Label>
            <Select value={toGroupId || undefined} onValueChange={setToGroupId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="— Оберіть групу —" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.groupId} value={g.groupId}>
                    {g.groupName}
                    {!g.hasWorkingCurriculum && ' (немає РНП)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={overwrite} onCheckedChange={(v) => setOverwrite(v === true)} />
            <span className="text-sm">Перезаписати, якщо цільовий розклад не порожній</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button onClick={submit} disabled={!toGroupId || copyMut.isPending}>
            {copyMut.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Скопіювати
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
