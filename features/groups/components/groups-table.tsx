'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'

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

import { getGroupCuratorName, isGroupArchived, type GroupDto } from '../types'
import { GroupSyncButton } from './sync-button'

interface SortState {
  column: 'name' | 'course' | null
  direction: 'asc' | 'desc'
}

interface GroupsTableProps {
  groups: GroupDto[]
  isLoading: boolean
  totalCount: number
  onRowClick: (g: GroupDto) => void
}

function SortIcon({ column, sort }: { column: SortState['column']; sort: SortState }) {
  if (sort.column !== column) return null
  return sort.direction === 'asc' ? (
    <ChevronUp size={14} className="inline ml-1" />
  ) : (
    <ChevronDown size={14} className="inline ml-1" />
  )
}

function sortGroups(groups: GroupDto[], sort: SortState): GroupDto[] {
  if (!sort.column) return groups
  return [...groups].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number

    if (sort.column === 'name') {
      aVal = a.name.toLowerCase()
      bVal = b.name.toLowerCase()
    } else {
      aVal = a.course ?? 0
      bVal = b.course ?? 0
    }

    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
}

const SKELETON_ROWS = 8

export function GroupsTable({
  groups,
  isLoading,
  totalCount,
  onRowClick,
}: GroupsTableProps) {
  const [sort, setSort] = useState<SortState>({ column: 'name', direction: 'asc' })

  const handleSort = (column: SortState['column']) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    )
  }

  const sorted = sortGroups(groups, sort)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('name')}
            >
              Група <SortIcon column="name" sort={sort} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap hidden sm:table-cell"
              onClick={() => handleSort('course')}
            >
              Курс <SortIcon column="course" sort={sort} />
            </TableHead>
            <TableHead className="hidden md:table-cell">Спеціальність</TableHead>
            <TableHead className="hidden lg:table-cell">Форма</TableHead>
            <TableHead className="text-center hidden sm:table-cell">Студентів</TableHead>
            <TableHead className="hidden md:table-cell">Куратор</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Loading skeleton */}
          {isLoading &&
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
              </TableRow>
            ))}

          {/* Empty — no groups at all */}
          {!isLoading && totalCount === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <Users size={48} className="text-muted-foreground/40" />
                  <div>
                    <p className="font-semibold text-foreground">Групи відсутні</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Запустіть синхронізацію з ЄДЕБО, щоб завантажити групи
                    </p>
                  </div>
                  <GroupSyncButton />
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Empty — filtered */}
          {!isLoading && totalCount > 0 && sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Users size={48} className="text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">Групи не знайдено</p>
                  <p className="text-sm text-muted-foreground">
                    Спробуйте змінити параметри фільтрації
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Data rows */}
          {!isLoading &&
            sorted.map((group) => (
              <TableRow
                key={group.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(group)}
              >
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    {group.name}
                    {isGroupArchived(group) && (
                      <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300 hover:bg-slate-200 whitespace-nowrap font-normal">
                        Архів
                      </Badge>
                    )}
                  </span>
                </TableCell>

                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {group.course ?? '—'}
                </TableCell>

                <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px]">
                  <span className="truncate block">{group.fullSpecialityName ?? '—'}</span>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  {group.educationFormName ? (
                    <Badge variant="outline" className="whitespace-nowrap font-normal">
                      {group.educationFormName}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>

                <TableCell className="text-center hidden sm:table-cell text-sm text-muted-foreground">
                  {group.studentsCount ?? '—'}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {group.curator ? (
                    <span className="text-sm">{getGroupCuratorName(group.curator)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Не призначено</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
