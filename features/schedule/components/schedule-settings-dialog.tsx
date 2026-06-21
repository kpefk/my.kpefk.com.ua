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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

import { useScheduleSettings, useUpdateScheduleSettings } from '../api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Налаштування модуля розкладу — ліміти пар на день (ТЗ §3.4). */
export function ScheduleSettingsDialog({ open, onOpenChange }: Props) {
  const { data, isLoading } = useScheduleSettings()
  const updateMut = useUpdateScheduleSettings()

  const [fullTime, setFullTime] = useState('4')
  const [partTime, setPartTime] = useState('')
  const [homeroomCounts, setHomeroomCounts] = useState(false)

  useEffect(() => {
    if (data) {
      setFullTime(String(data.maxPairsFullTime))
      setPartTime(data.maxPairsPartTime == null ? '' : String(data.maxPairsPartTime))
      setHomeroomCounts(data.homeroomCountsToLimit)
    }
  }, [data])

  function save() {
    updateMut.mutate(
      {
        maxPairsFullTime: Number(fullTime) || 4,
        maxPairsPartTime: partTime.trim() === '' ? null : Number(partTime),
        homeroomCountsToLimit: homeroomCounts,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Налаштування розкладу</DialogTitle>
          <DialogDescription>
            Ліміти пар на день за формою навчання (Закон №2745-VIII, ТЗ §3.4).
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full-time">Макс. пар/день — денна форма</Label>
              <Input
                id="full-time"
                type="number"
                min={1}
                max={8}
                value={fullTime}
                onChange={(e) => setFullTime(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="part-time">
                Макс. пар/день — заочна/дистанційна
              </Label>
              <Input
                id="part-time"
                type="number"
                min={1}
                max={12}
                placeholder="без обмеження"
                value={partTime}
                onChange={(e) => setPartTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Залиште порожнім, щоб не обмежувати.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={homeroomCounts}
                onCheckedChange={(v) => setHomeroomCounts(v === true)}
              />
              <span className="text-sm">Рахувати виховну годину в ліміті пар</span>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button onClick={save} disabled={updateMut.isPending || isLoading}>
            {updateMut.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
