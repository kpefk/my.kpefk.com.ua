'use client'

import { useState } from 'react'
import { Check, FileCheck2, Loader2, Lock, Plus, Trash2, Undo2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUser } from '@/store/auth.store'

import {
  useConfirmRecognition,
  useCreditRecognitions,
  useDeleteRecognition,
  useRevertRecognition,
} from '../api'
import {
  type CreditRecognitionDto,
  RECOGNITION_STATUS_LABELS,
  RECOGNITION_TYPE_LABELS,
} from '../types'

import { RecognitionDialog } from './recognition-dialog'

const MANAGE_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

export function CreditRecognitionClient() {
  const user = useUser()

  if (!user) return <Skeleton className="h-64 w-full" />
  if (!MANAGE_ROLES.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
        <p className="font-semibold">Доступ обмежено</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Перезарахування кредитів доступне навчальній частині та керівництву.
        </p>
      </div>
    )
  }

  return <RecognitionView isAdministrator={user.role === 'ADMINISTRATOR'} />
}

function RecognitionView({ isAdministrator }: { isAdministrator: boolean }) {
  const { data: rows = [], isLoading } = useCreditRecognitions()
  const confirmMut = useConfirmRecognition()
  const revertMut = useRevertRecognition()
  const deleteMut = useDeleteRecognition()

  const [dialogOpen, setDialogOpen] = useState(false)

  const busy = confirmMut.isPending || revertMut.isPending || deleteMut.isPending

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-primary" />
            Перезарахування кредитів
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Визнання результатів навчання (Наказ 510, п.6.7/6.8)
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Новий акт
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Здобувач</TableHead>
                <TableHead className="w-44">Підстава</TableHead>
                <TableHead className="w-56">Заклад</TableHead>
                <TableHead className="w-24 text-center">Компон.</TableHead>
                <TableHead className="w-20 text-center">ЄКТС</TableHead>
                <TableHead className="w-28 text-center">Статус</TableHead>
                <TableHead className="w-40 text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <RecognitionRow
                  key={r.id}
                  row={r}
                  isAdministrator={isAdministrator}
                  busy={busy}
                  onConfirm={() => confirmMut.mutate(r.id)}
                  onRevert={() => revertMut.mutate(r.id)}
                  onDelete={() => deleteMut.mutate(r.id)}
                />
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Актів ще немає — створіть перший
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <RecognitionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}

function RecognitionRow({
  row,
  isAdministrator,
  busy,
  onConfirm,
  onRevert,
  onDelete,
}: {
  row: CreditRecognitionDto
  isAdministrator: boolean
  busy: boolean
  onConfirm: () => void
  onRevert: () => void
  onDelete: () => void
}) {
  const isDraft = row.status === 'DRAFT'
  return (
    <TableRow>
      <TableCell className="font-medium">{row.studentName}</TableCell>
      <TableCell className="text-sm">{RECOGNITION_TYPE_LABELS[row.type]}</TableCell>
      <TableCell className="text-sm text-muted-foreground truncate" title={row.sourceInstitutionName}>
        {row.sourceInstitutionName}
      </TableCell>
      <TableCell className="text-center tabular-nums">{row.items.length}</TableCell>
      <TableCell className="text-center tabular-nums">{row.totalEcts}</TableCell>
      <TableCell className="text-center">
        <Badge variant={isDraft ? 'outline' : 'default'}>
          {RECOGNITION_STATUS_LABELS[row.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-0.5">
          {isDraft ? (
            <>
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                title="Підтвердити (внести оцінки)"
                disabled={busy}
                onClick={onConfirm}
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                title="Видалити чернетку"
                disabled={busy}
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            isAdministrator && (
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                title="Повернути в чернетку (прибрати оцінки)"
                disabled={busy}
                onClick={onRevert}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
            )
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
