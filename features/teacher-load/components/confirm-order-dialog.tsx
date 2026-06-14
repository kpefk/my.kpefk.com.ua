'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { useConfirmAssignments } from '../api'
import type { ConfirmResult } from '../types'

interface ConfirmOrderDialogProps {
  open: boolean
  workingCurriculumId: string
  onClose: () => void
}

export function ConfirmOrderDialog({
  open,
  workingCurriculumId,
  onClose,
}: ConfirmOrderDialogProps) {
  const [orderNumber, setOrderNumber] = useState('')
  const [orderDate, setOrderDate] = useState(
    () => new Date().toISOString().split('T')[0] ?? '',
  )
  const [result, setResult] = useState<ConfirmResult | null>(null)

  const confirm = useConfirmAssignments()

  const isValid = orderNumber.trim().length > 0 && orderDate.length > 0
  const hasWarnings = (result?.warnings.length ?? 0) > 0
  const isDone = result !== null

  function handleConfirm() {
    if (!isValid) return
    confirm.mutate(
      {
        workingCurriculumId,
        orderNumber: orderNumber.trim(),
        orderDate: new Date(orderDate).toISOString(),
      },
      {
        onSuccess: (data) => {
          setResult(data)
          // If no warnings — close immediately; otherwise stay open to show them
          if (data.warnings.length === 0) {
            onClose()
            setOrderNumber('')
          }
        },
      },
    )
  }

  function handleClose() {
    onClose()
    setOrderNumber('')
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Підтвердити педагогічне навантаження</DialogTitle>
          <DialogDescription>
            Всі DRAFT-рядки будуть переведені в стан «Підтверджено»
            після підписання наказу директором.
            Після підтвердження редагування недоступне.
          </DialogDescription>
        </DialogHeader>

        {/* Warnings block — shown after confirmation if any */}
        {isDone && hasWarnings && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Підтверджено {result.confirmed} рядків. Зверніть увагу:
            </div>
            {result.warnings.map((w, i) => (
              <div
                key={i}
                className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Input form — hidden after confirmation */}
        {!isDone && (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-number" className="text-sm">
                Номер наказу <span className="text-red-500">*</span>
              </Label>
              <Input
                id="order-number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Наприклад: 45-к"
                className={cn(!orderNumber.trim() && 'border-amber-300')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-date" className="text-sm">
                Дата наказу <span className="text-red-500">*</span>
              </Label>
              <Input
                id="order-date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {isDone ? (
            <Button onClick={handleClose}>Закрити</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={confirm.isPending}>
                Скасувати
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!isValid || confirm.isPending}
              >
                {confirm.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : null}
                Підтвердити наказом
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
