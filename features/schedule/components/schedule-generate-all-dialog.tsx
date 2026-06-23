'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Lock, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useGenerateAll } from '../api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  academicYear: string
  defaultSemester: number
}

const SEMESTER_OPTIONS = [1, 2]

/** Масова генерація розкладу всім групам (з РНП на рік+семестр). */
export function ScheduleGenerateAllDialog({
  open,
  onOpenChange,
  academicYear,
  defaultSemester,
}: Props) {
  const [semester, setSemester] = useState(defaultSemester)
  const generateAll = useGenerateAll()
  const result = generateAll.data

  const endYear = Number(academicYear.split('-')[1])
  const semesterLocked = new Date() > new Date(endYear, 5, 30)

  // Скидаємо попередній результат при кожному відкритті.
  useEffect(() => {
    if (open) {
      setSemester(defaultSemester)
      generateAll.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultSemester])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Згенерувати розклад усім групам</DialogTitle>
          <DialogDescription>
            Перегенерує розклади всіх груп, що мають РНП на {academicYear}, обраний
            семестр. Наявні розклади цих груп буде перезаписано.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {semesterLocked ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-950/30 p-3">
              <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                2-й семестр навчального року {academicYear} завершено. Генерація розкладу заблокована.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Семестр</Label>
                  <Select
                    value={String(semester)}
                    onValueChange={(v) => setSemester(Number(v))}
                    disabled={generateAll.isPending}
                  >
                    <SelectTrigger className="h-9 min-w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTER_OPTIONS.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          Семестр {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground pb-2">
                  Рік: <span className="font-medium text-foreground">{academicYear}</span>
                </p>
              </div>

              {!result && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-950/30 p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Операція може зайняти кілька секунд і перезапише наявні розклади груп
                    на цей семестр. Конфлікти (якщо лишаться) буде позначено в кожній групі.
                  </p>
                </div>
              )}
            </>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Опрацьовано <b>{result.groupsProcessed}</b> груп · усього{' '}
                <b>{result.totalEntries}</b> занять
              </div>
              <ul className="max-h-56 overflow-y-auto rounded-md border border-border divide-y divide-border">
                {result.results.map((r) => (
                  <li
                    key={r.groupId}
                    className="flex items-start justify-between gap-2 px-3 py-1.5 text-xs"
                  >
                    <span className="font-medium">{r.groupName}</span>
                    <span className="text-right text-muted-foreground">
                      {r.entries} занять
                      {r.warnings.length > 0 && (
                        <span className="block text-amber-600 dark:text-amber-400">
                          {r.warnings.length} попереджень
                        </span>
                      )}
                    </span>
                  </li>
                ))}
                {result.results.length === 0 && (
                  <li className="px-3 py-2 text-xs text-muted-foreground">
                    Немає груп із РНП на цей семестр.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {result ? 'Закрити' : 'Скасувати'}
          </Button>
          {!result && (
            <Button
              onClick={() => generateAll.mutate({ academicYear, semesterNumber: semester })}
              disabled={generateAll.isPending || semesterLocked}
            >
              {generateAll.isPending && (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              Згенерувати всім
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
