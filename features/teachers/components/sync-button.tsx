'use client'

import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { useSyncStaff } from '../api'

export function SyncButton() {
  const sync = useSyncStaff()
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    setOpen(false)
    sync.mutate()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={sync.isPending} className="gap-2 shrink-0">
          {sync.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Синхронізація...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Синхронізувати з ЄДЕБО
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Синхронізація з ЄДЕБО</AlertDialogTitle>
          <AlertDialogDescription>
            Буде запущено оновлення даних викладачів з реєстру ЄДЕБО. Це може зайняти кілька
            хвилин.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Синхронізувати</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
