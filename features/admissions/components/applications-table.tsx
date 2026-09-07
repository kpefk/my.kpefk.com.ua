'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Inbox } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { AdmissionApplicationRowDto } from '../types'

type SortColumn = 'personalCode' | 'fio' | 'speciality' | 'status' | 'konkurs' | 'priority'
interface SortState {
  column: SortColumn | null
  direction: 'asc' | 'desc'
}

interface ApplicationsTableProps {
  applications: AdmissionApplicationRowDto[]
  isLoading: boolean
  onRowClick?: (application: AdmissionApplicationRowDto) => void
}

function SortIcon({ column, sort }: { column: SortColumn; sort: SortState }) {
  if (sort.column !== column) return null
  return sort.direction === 'asc' ? (
    <ChevronUp size={14} className="inline ml-1" />
  ) : (
    <ChevronDown size={14} className="inline ml-1" />
  )
}

function claimLabel(a: AdmissionApplicationRowDto): string {
  if (a.isClaimForBudget && a.isClaimForContract) return 'Б+К'
  if (a.isClaimForBudget) return 'Б'
  if (a.isClaimForContract) return 'К'
  return '—'
}

/** Короткий підпис документа про освіту (свідоцтво/атестат) — заповнено для заочних КП. */
function eduDocNumber(a: AdmissionApplicationRowDto): string {
  if (!a.entryEduDocNumber) return ''
  return `${a.entryEduDocSeries ? `${a.entryEduDocSeries} ` : ''}№${a.entryEduDocNumber}`
}

function sortApplications(
  apps: AdmissionApplicationRowDto[],
  sort: SortState,
): AdmissionApplicationRowDto[] {
  if (!sort.column) return apps
  const col = sort.column
  const dir = sort.direction === 'asc' ? 1 : -1
  if (col === 'personalCode') {
    // Номер справи має числовий префікс (напр. «03-Тс», «119-Ав») — натуральне сортування.
    return [...apps].sort(
      (a, b) =>
        dir *
        (a.personalCode ?? '').localeCompare(b.personalCode ?? '', 'uk', { numeric: true }),
    )
  }
  return [...apps].sort((a, b) => {
    let av: string | number
    let bv: string | number
    if (col === 'konkurs') {
      av = a.konkursValue ?? -1
      bv = b.konkursValue ?? -1
    } else if (col === 'priority') {
      av = a.requestPriority ?? Number.MAX_SAFE_INTEGER
      bv = b.requestPriority ?? Number.MAX_SAFE_INTEGER
    } else if (col === 'fio') {
      av = (a.fio ?? '').toLowerCase()
      bv = (b.fio ?? '').toLowerCase()
    } else if (col === 'speciality') {
      av = (a.specialityName ?? '').toLowerCase()
      bv = (b.specialityName ?? '').toLowerCase()
    } else {
      av = (a.statusTypeName ?? '').toLowerCase()
      bv = (b.statusTypeName ?? '').toLowerCase()
    }
    if (av < bv) return -dir
    if (av > bv) return dir
    return 0
  })
}

const SKELETON_ROWS = 8

export function ApplicationsTable({
  applications,
  isLoading,
  onRowClick,
}: ApplicationsTableProps) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: 'asc' })

  const handleSort = (column: SortColumn) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    )
  }

  const sorted = useMemo(() => sortApplications(applications, sort), [applications, sort])

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead
                className="cursor-pointer select-none whitespace-nowrap w-24"
                onClick={() => handleSort('personalCode')}
              >
                № справи <SortIcon column="personalCode" sort={sort} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort('fio')}
              >
                ПІБ <SortIcon column="fio" sort={sort} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none whitespace-nowrap hidden md:table-cell"
                onClick={() => handleSort('speciality')}
              >
                Спеціальність <SortIcon column="speciality" sort={sort} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none whitespace-nowrap w-44"
                onClick={() => handleSort('status')}
              >
                Статус <SortIcon column="status" sort={sort} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-center w-20"
                onClick={() => handleSort('konkurs')}
              >
                Бал <SortIcon column="konkurs" sort={sort} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-center w-16 hidden lg:table-cell"
                onClick={() => handleSort('priority')}
              >
                Пріор. <SortIcon column="priority" sort={sort} />
              </TableHead>
              <TableHead className="text-center w-16">Б/К</TableHead>
              <TableHead className="text-center w-16 hidden lg:table-cell">Вимоги</TableHead>
              <TableHead className="w-48 hidden lg:table-cell">Документ про освіту</TableHead>
              <TableHead className="w-52 hidden xl:table-cell">Контакти</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell />
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-44" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center">
                    <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center">
                    <Skeleton className="h-4 w-4 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <Inbox size={48} className="text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">Заяв не знайдено</p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Спробуйте змінити параметри фільтрів
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              sorted.map((a, i) => (
                <TableRow
                  key={a.personRequestId}
                  onClick={() => onRowClick?.(a)}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                >
                  <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums whitespace-nowrap">
                    {a.personalCode ?? '—'}
                  </TableCell>
                  <TableCell className="font-medium">{a.fio ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                    {a.specialityName ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1">
                      {a.enrolled && <Badge className="text-[10px] px-1">Зарах.</Badge>}
                      {a.statusTypeName ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{a.konkursValue ?? '—'}</TableCell>
                  <TableCell className="text-center tabular-nums hidden lg:table-cell">
                    {a.requestPriority ?? '—'}
                  </TableCell>
                  <TableCell className="text-center text-xs">{claimLabel(a)}</TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    {a.isOriginalDocumentsAdded ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                    {a.entryEduDocNumber ? (
                      <span title={a.entryEduDocTypeName ?? undefined} className="inline-flex flex-col items-start">
                        <span className="tabular-nums">{eduDocNumber(a)}</span>
                        {a.entryEduDocDateGet ? (
                          <span className="text-muted-foreground/60">{new Date(a.entryEduDocDateGet).toLocaleDateString('uk-UA')}</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">
                    <div className="truncate max-w-[200px]">{a.phone}</div>
                    <div className="truncate max-w-[200px]">{a.email}</div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
