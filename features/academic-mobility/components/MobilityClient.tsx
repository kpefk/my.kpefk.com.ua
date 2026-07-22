'use client'

import { useState } from 'react'
import { Check, Loader2, Lock, Plane, Plus, Trash2, Undo2 } from 'lucide-react'

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
  useAcademicMobilities,
  useConfirmMobility,
  useDeleteMobility,
  useRevertMobility,
} from '../api'
import {
  type AcademicMobilityDto,
  MOBILITY_DIRECTION_LABELS,
  MOBILITY_STATUS_LABELS,
} from '../types'

import { MobilityDialog } from './mobility-dialog'

const MANAGE_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

export function MobilityClient() {
  const user = useUser()

  if (!user) return <Skeleton className="h-64 w-full" />
  if (!MANAGE_ROLES.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
        <p className="font-semibold">Доступ обмежено</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Академічна мобільність доступна навчальній частині та керівництву.
        </p>
      </div>
    )
  }

  return <MobilityView isAdministrator={user.role === 'ADMINISTRATOR'} />
}

function MobilityView({ isAdministrator }: { isAdministrator: boolean }) {
  const { data: rows = [], isLoading } = useAcademicMobilities()
  const confirmMut = useConfirmMobility()
  const revertMut = useRevertMobility()
  const deleteMut = useDeleteMobility()

  const [dialogOpen, setDialogOpen] = useState(false)
  const busy = confirmMut.isPending || revertMut.isPending || deleteMut.isPending

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('uk-UA')
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" />
            Академічна мобільність
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Визнання результатів навчання в закладі-партнері (Наказ 510, розд. VIII)
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Новий запис
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
                <TableHead className="w-20 text-center">Напрям</TableHead>
                <TableHead className="w-56">Заклад-партнер</TableHead>
                <TableHead className="w-40">Період</TableHead>
                <TableHead className="w-20 text-center">Компон.</TableHead>
                <TableHead className="w-28 text-center">Статус</TableHead>
                <TableHead className="w-40 text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <MobilityRow
                  key={r.id}
                  row={r}
                  isAdministrator={isAdministrator}
                  busy={busy}
                  fmtDate={fmtDate}
                  onConfirm={() => confirmMut.mutate(r.id)}
                  onRevert={() => revertMut.mutate(r.id)}
                  onDelete={() => deleteMut.mutate(r.id)}
                />
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Записів ще немає — створіть перший
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <MobilityDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}

function MobilityRow({
  row,
  isAdministrator,
  busy,
  fmtDate,
  onConfirm,
  onRevert,
  onDelete,
}: {
  row: AcademicMobilityDto
  isAdministrator: boolean
  busy: boolean
  fmtDate: (iso: string) => string
  onConfirm: () => void
  onRevert: () => void
  onDelete: () => void
}) {
  const isDraft = row.status === 'DRAFT'
  return (
    <TableRow>
      <TableCell className="font-medium">{row.studentName}</TableCell>
      <TableCell className="text-center text-sm">{MOBILITY_DIRECTION_LABELS[row.direction]}</TableCell>
      <TableCell className="text-sm text-muted-foreground truncate" title={row.partnerInstitutionName}>
        {row.partnerInstitutionName}
        {row.country && <span className="text-xs"> ({row.country})</span>}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {fmtDate(row.periodFrom)} – {fmtDate(row.periodTo)}
      </TableCell>
      <TableCell className="text-center tabular-nums">{row.items.length}</TableCell>
      <TableCell className="text-center">
        <Badge variant={isDraft ? 'outline' : 'default'}>{MOBILITY_STATUS_LABELS[row.status]}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-0.5">
          {isDraft ? (
            <>
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                title="Підтвердити (внести оцінки)" disabled={busy} onClick={onConfirm}
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                title="Видалити чернетку" disabled={busy} onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            isAdministrator && (
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                title="Повернути в чернетку (прибрати оцінки)" disabled={busy} onClick={onRevert}
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
