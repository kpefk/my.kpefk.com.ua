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

import { useSyncStudyPrograms } from '../api'

export function EducationalProgramsSyncButton() {
  const sync = useSyncStudyPrograms()
  const [open, setOpen] = useState(false)

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
          <AlertDialogTitle>Синхронізація освітніх програм з ЄДЕБО</AlertDialogTitle>
          <AlertDialogDescription>
            Буде запущено оновлення освітніх програм (ОПП) з реєстру ЄДЕБО. Це може зайняти
            кілька хвилин.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={() => { setOpen(false); sync.mutate() }}>
            Синхронізувати
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
