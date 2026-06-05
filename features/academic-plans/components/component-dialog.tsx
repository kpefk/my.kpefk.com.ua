'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
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
  COMPONENT_TYPE_LABELS,
  PRACTICE_TYPE_LABELS,
  type ComponentType,
  type CurriculumComponentDto,
  type PracticeType,
} from '../types'

interface ComponentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionName: string
  sectionType?: string
  defaultOrderIndex: number
  initialData?: CurriculumComponentDto
  onSubmit: (data: {
    name: string
    code?: string
    componentType: ComponentType
    totalEcts: number
    totalHours: number
    isMandatory: boolean
    practiceType?: PracticeType
    orderIndex: number
  }) => void
  isPending: boolean
}

export function ComponentDialog({
  open,
  onOpenChange,
  sectionName,
  sectionType,
  defaultOrderIndex,
  initialData,
  onSubmit,
  isPending,
}: ComponentDialogProps) {
  const isSecondaryEdu = sectionType === 'SECONDARY_EDUCATION'
  const [name, setName] = useState(initialData?.name ?? '')
  const [code, setCode] = useState(initialData?.code ?? '')
  const [componentType, setComponentType] = useState<ComponentType>(
    initialData?.componentType ?? 'DISCIPLINE',
  )
  const [totalEcts, setTotalEcts] = useState(
    initialData ? String(Number(initialData.totalEcts)) : '',
  )
  const [totalHours, setTotalHours] = useState(
    initialData ? String(initialData.totalHours) : '',
  )
  const [isMandatory, setIsMandatory] = useState(initialData?.isMandatory ?? true)
  const [practiceType, setPracticeType] = useState<PracticeType | ''>(
    initialData?.practiceType ?? '',
  )

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '')
      setCode(initialData?.code ?? '')
      setComponentType(initialData?.componentType ?? 'DISCIPLINE')
      setTotalEcts(initialData ? String(Number(initialData.totalEcts)) : '')
      setTotalHours(initialData ? String(initialData.totalHours) : '')
      setIsMandatory(initialData?.isMandatory ?? true)
      setPracticeType(initialData?.practiceType ?? '')
    }
  }, [open, initialData])

  const ectsVal = isSecondaryEdu ? 0 : parseFloat(totalEcts)
  const hoursVal = parseInt(totalHours, 10)
  const ectsValid = isSecondaryEdu || (Number.isFinite(ectsVal) && ectsVal >= 0)
  const canSubmit =
    name.trim().length >= 2 &&
    ectsValid &&
    Number.isFinite(hoursVal) &&
    hoursVal >= 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      code: code.trim() || undefined,
      componentType,
      totalEcts: ectsVal,
      totalHours: hoursVal,
      isMandatory,
      practiceType:
        componentType === 'PRACTICE' && practiceType ? (practiceType as PracticeType) : undefined,
      orderIndex: initialData?.orderIndex ?? defaultOrderIndex,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Редагувати компонент' : `Новий компонент — ${sectionName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comp-name">Назва *</Label>
            <Input
              id="comp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Алгоритмізація та програмування"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comp-code">Код</Label>
              <Input
                id="comp-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ОК12"
                maxLength={20}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comp-type">Тип *</Label>
              <Select
                value={componentType}
                onValueChange={(v) => setComponentType(v as ComponentType)}
              >
                <SelectTrigger id="comp-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(COMPONENT_TYPE_LABELS) as [ComponentType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {componentType === 'PRACTICE' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="practice-type">Вид практики</Label>
              <Select
                value={practiceType}
                onValueChange={(v) => setPracticeType(v as PracticeType)}
              >
                <SelectTrigger id="practice-type">
                  <SelectValue placeholder="Оберіть вид..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRACTICE_TYPE_LABELS) as [PracticeType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {isSecondaryEdu ? (
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="comp-hours">Годин *</Label>
                <Input
                  id="comp-hours"
                  type="number"
                  min={0}
                  value={totalHours}
                  onChange={(e) => setTotalHours(e.target.value)}
                  placeholder="180"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comp-ects">ЄКТС *</Label>
                  <Input
                    id="comp-ects"
                    type="number"
                    min={0}
                    step={0.5}
                    max={999}
                    value={totalEcts}
                    onChange={(e) => setTotalEcts(e.target.value)}
                    placeholder="6.0"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comp-hours">Годин *</Label>
                  <Input
                    id="comp-hours"
                    type="number"
                    min={0}
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value)}
                    placeholder="180"
                  />
                </div>
              </>
            )}
          </div>
          {isSecondaryEdu && (
            <p className="text-xs text-muted-foreground -mt-2">
              ЄКТС не застосовується для компонентів загальної середньої освіти — буде збережено як 0.
            </p>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="comp-mandatory"
              checked={isMandatory}
              onCheckedChange={(v) => setIsMandatory(!!v)}
            />
            <Label htmlFor="comp-mandatory" className="cursor-pointer font-normal">
              Обов&#39;язковий компонент
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
            {initialData ? 'Зберегти' : 'Додати компонент'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
