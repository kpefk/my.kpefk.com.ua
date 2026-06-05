'use client'

import { useEffect, useState } from 'react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  SECTION_TYPE_LABELS,
  type CurriculumSectionDto,
  type CurriculumSectionType,
} from '../types'

interface SectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOrderIndex: number
  initialData?: CurriculumSectionDto
  onSubmit: (data: {
    name: string
    sectionType: CurriculumSectionType
    code?: string
    orderIndex: number
  }) => void
  isPending: boolean
}

export function SectionDialog({
  open,
  onOpenChange,
  defaultOrderIndex,
  initialData,
  onSubmit,
  isPending,
}: SectionDialogProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [code, setCode] = useState(initialData?.code ?? '')
  const [sectionType, setSectionType] = useState<CurriculumSectionType>(
    initialData?.sectionType ?? 'GENERAL_COMPETENCY',
  )

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '')
      setCode(initialData?.code ?? '')
      setSectionType(initialData?.sectionType ?? 'GENERAL_COMPETENCY')
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      sectionType,
      code: code.trim() || undefined,
      orderIndex: initialData?.orderIndex ?? defaultOrderIndex,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Редагувати розділ' : 'Новий розділ'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-type">Тип розділу *</Label>
            <Select
              value={sectionType}
              onValueChange={(v) => setSectionType(v as CurriculumSectionType)}
            >
              <SelectTrigger id="section-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SECTION_TYPE_LABELS) as [CurriculumSectionType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-name">Назва *</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Цикл фахової підготовки"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-code">Код (необов&#39;язково)</Label>
            <Input
              id="section-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ЦФП"
              maxLength={20}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button disabled={isPending || !name.trim()} onClick={handleSubmit}>
            {initialData ? 'Зберегти' : 'Додати розділ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
