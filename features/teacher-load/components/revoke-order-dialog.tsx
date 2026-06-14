'use client'

import { useState } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { useRevokeAssignments } from '../api'

interface RevokeOrderDialogProps {
  open: boolean
  workingCurriculumId: string
  orderNumber: string | null
  onClose: () => void
}

export function RevokeOrderDialog({
  open,
  workingCurriculumId,
  orderNumber,
  onClose,
}: RevokeOrderDialogProps) {
  const [reason, setReason] = useState('')
  const revoke = useRevokeAssignments()

  function handleClose() {
    onClose()
    setReason('')
  }

  function handleRevoke() {
    revoke.mutate(
      { workingCurriculumId, reason: reason.trim() || undefined },
      { onSuccess: () => handleClose() },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="w-5 h-5 text-amber-500" />
            Скасувати наказ
          </DialogTitle>
          <DialogDescription>
            Усі підтверджені рядки наказу{orderNumber ? ` №${orderNumber}` : ''} буде
            повернено у стан «Чернетка». Після цього розподіл знову можна редагувати.
            Дію буде зафіксовано в журналі аудиту.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 py-2">
          <Label htmlFor="revoke-reason" className="text-sm">
            Причина <span className="text-muted-foreground">(необов'язково)</span>
          </Label>
          <Textarea
            id="revoke-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Напр.: виявлено помилку в розподілі годин"
            rows={3}
            maxLength={500}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={revoke.isPending}>
            Назад
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={revoke.isPending}
          >
            {revoke.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Скасувати наказ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
