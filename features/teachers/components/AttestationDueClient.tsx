'use client'

import { useState } from 'react'
import { Award, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

import { useAttestationsDue } from '../api'
import { ATTESTATION_STATUS_LABELS, formatDate, type AttestationStatus } from '../types'

const MANAGE_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i)

function statusBadge(status: AttestationStatus) {
  const label = ATTESTATION_STATUS_LABELS[status]
  if (status === 'OVERDUE') return <Badge variant="destructive">{label}</Badge>
  if (status === 'DUE') return <Badge>{label}</Badge>
  if (status === 'NEVER') return <Badge variant="outline">{label}</Badge>
  return <Badge variant="secondary">{label}</Badge>
}

export function AttestationDueClient() {
  const user = useUser()
  const [year, setYear] = useState(CURRENT_YEAR)

  const { data: rows = [], isLoading } = useAttestationsDue(year)

  if (!user) return <Skeleton className="h-64 w-full" />
  if (!MANAGE_ROLES.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
        <p className="font-semibold">Доступ обмежено</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Атестація викладачів доступна керівництву.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Атестація викладачів
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Хто підлягає атестації (5-річний цикл, Ст. 50 №2145-VIII)
          </p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y} рік</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 text-center">Статус</TableHead>
                <TableHead>ПІБ</TableHead>
                <TableHead>Посада</TableHead>
                <TableHead>Поточна категорія</TableHead>
                <TableHead className="w-28 text-center">Остання</TableHead>
                <TableHead className="w-28 text-center">Наступна</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.teacher.id}>
                  <TableCell className="text-center">{statusBadge(r.status)}</TableCell>
                  <TableCell className="font-medium">{r.teacher.fullName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.teacher.positionName ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.teacher.skillName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums">
                    {formatDate(r.lastAttestationDate)}
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums">
                    {formatDate(r.nextAttestationDate)}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Немає викладачів, що підлягають атестації у {year} році
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
