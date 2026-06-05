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

import { useCreateVersion } from '../api'

interface CreateVersionDialogProps {
  open: boolean
  onClose: () => void
  curriculumId: string
}

export function CreateVersionDialog({
  open,
  onClose,
  curriculumId,
}: CreateVersionDialogProps) {
  const [approvalDate, setApprovalDate] = useState('')
  const [approvalOrderNumber, setApprovalOrderNumber] = useState('')
  const [approvedBy, setApprovedBy] = useState('')
  const [notes, setNotes] = useState('')

  const createVersion = useCreateVersion()

  useEffect(() => {
    if (open) {
      setApprovalDate(new Date().toISOString().slice(0, 10))
      setApprovalOrderNumber('')
      setApprovedBy('')
      setNotes('')
    }
  }, [open])

  const isValid = approvalDate !== '' && approvalOrderNumber.trim() !== '' && approvedBy.trim() !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    createVersion.mutate(
      {
        curriculumId,
        data: {
          approvalDate,
          approvalOrderNumber: approvalOrderNumber.trim(),
          approvedBy: approvedBy.trim(),
          notes: notes.trim() || undefined,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Нова версія навчального плану</DialogTitle>
          <DialogDescription>
            Створюється нова чернеткова версія. Після заповнення структури її можна опублікувати.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <Field>
            <FieldLabel htmlFor="cv-date">
              Дата затвердження <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="cv-date"
              type="date"
              required
              value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)}
              className="bg-background"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="cv-order">
              Номер наказу / протоколу <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="cv-order"
              placeholder="Протокол № 6 від 26.05.2025"
              required
              value={approvalOrderNumber}
              onChange={(e) => setApprovalOrderNumber(e.target.value)}
              className="bg-background"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="cv-approved-by">
              Затверджено ким <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="cv-approved-by"
              placeholder="Директор Т. Селівончик"
              required
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              className="bg-background"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="cv-notes">Примітки</FieldLabel>
            <Input
              id="cv-notes"
              placeholder="Необов'язково"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background"
            />
          </Field>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={!isValid || createVersion.isPending}>
              {createVersion.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Створити чернетку'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
