'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEFAULT_FILTERS } from '@/features/teachers/types'
import { useTeachers } from '@/features/teachers/api'
import { getFullName } from '@/features/teachers/types'

import { useCreateClassroom, useUpdateClassroom } from '../api'
import type { ClassroomDto } from '../types'

interface ClassroomFormDialogProps {
  open: boolean
  onClose: () => void
  /** Якщо передано — режим редагування, інакше — створення */
  classroom?: ClassroomDto
}

export function ClassroomFormDialog({ open, onClose, classroom }: ClassroomFormDialogProps) {
  const isEdit = !!classroom

  const [number, setNumber] = useState(classroom?.number ?? '')
  const [name, setName] = useState(classroom?.name ?? '')
  const [teacherId, setTeacherId] = useState<string>(classroom?.teacherId ?? 'none')

  // Синхронізуємо стан при відкритті в режимі редагування
  useEffect(() => {
    if (open) {
      setNumber(classroom?.number ?? '')
      setName(classroom?.name ?? '')
      setTeacherId(classroom?.teacherId ?? 'none')
    }
  }, [open, classroom])

  const { data: teachers = [] } = useTeachers(DEFAULT_FILTERS)
  const createClassroom = useCreateClassroom()
  const updateClassroom = useUpdateClassroom()

  const isPending = createClassroom.isPending || updateClassroom.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!number.trim() || !name.trim()) return

    const payload = {
      number: number.trim(),
      name: name.trim(),
      teacherId: teacherId === 'none' ? null : teacherId,
    }

    if (isEdit) {
      updateClassroom.mutate(
        { id: classroom.id, data: payload },
        { onSuccess: onClose }
      )
    } else {
      createClassroom.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редагувати кабінет' : 'Новий кабінет'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Редагування кабінету №${classroom.number}`
              : 'Заповніть дані нового навчального кабінету'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="classroom-number">
                Номер <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="classroom-number"
                placeholder="101"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="bg-background font-mono"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="classroom-name">
              Назва <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="classroom-name"
              placeholder="Лабораторія програмного забезпечення"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="classroom-teacher">Завідувач кабінету</FieldLabel>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger id="classroom-teacher" className="bg-background">
                <SelectValue placeholder="Не призначено" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Не призначено</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {getFullName(t)}
                    {t.positionName && (
                      <span className="text-muted-foreground ml-1 text-xs">· {t.positionName}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={!number.trim() || !name.trim() || isPending}>
              {isPending
                ? <Loader2 size={16} className="animate-spin" />
                : isEdit ? 'Зберегти' : 'Створити'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
