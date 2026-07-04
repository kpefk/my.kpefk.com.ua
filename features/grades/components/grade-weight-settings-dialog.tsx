'use client'

import { useEffect, useState } from 'react'
import { Loader2, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useGradeWeightSettings, useUpdateGradeWeightSettings } from '../api'

export function GradeWeightSettingsDialog() {
  const [open, setOpen] = useState(false)
  const { data: weights } = useGradeWeightSettings()
  const update = useUpdateGradeWeightSettings()

  const [currentWeight, setCurrentWeight] = useState('60')
  const [examWeight, setExamWeight] = useState('40')

  useEffect(() => {
    if (weights) {
      setCurrentWeight(String(weights.currentWeight))
      setExamWeight(String(weights.examWeight))
    }
  }, [weights])

  const sum = (Number(currentWeight) || 0) + (Number(examWeight) || 0)
  const canSave = sum === 100

  function handleSave() {
    update.mutate(
      { currentWeight: Number(currentWeight), examWeight: Number(examWeight) },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Вагова схема формули оцінки">
          <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Вагова схема формули оцінки</DialogTitle>
          <DialogDescription>
            Підказка підсумкової оцінки = поточна успішність × вага + екзаменаційна оцінка × вага.
            Єдина схема для всього коледжу.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <div className="space-y-2 flex-1">
            <Label htmlFor="current-weight">Поточна успішність (%)</Label>
            <Input
              id="current-weight"
              type="number"
              min={0}
              max={100}
              value={currentWeight}
              onChange={(e) => {
                setCurrentWeight(e.target.value)
                const n = Number(e.target.value)
                if (!Number.isNaN(n)) setExamWeight(String(100 - n))
              }}
            />
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="exam-weight">Екзамен/залік (%)</Label>
            <Input
              id="exam-weight"
              type="number"
              min={0}
              max={100}
              value={examWeight}
              onChange={(e) => {
                setExamWeight(e.target.value)
                const n = Number(e.target.value)
                if (!Number.isNaN(n)) setCurrentWeight(String(100 - n))
              }}
            />
          </div>
        </div>

        {!canSave && (
          <p className="text-xs text-destructive">Сума ваг повинна дорівнювати 100%</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!canSave || update.isPending}>
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
