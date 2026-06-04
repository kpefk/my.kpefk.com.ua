'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, UserCheck, UserX, Users } from 'lucide-react'

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

import { formatStage, getFullName, type TeacherDto } from '../types'

interface SortState {
  column: 'name' | 'chair' | 'isActive' | null
  direction: 'asc' | 'desc'
}

interface TeachersTableProps {
  teachers: TeacherDto[]
  isLoading: boolean
  onRowClick: (t: TeacherDto) => void
}

function SortIcon({ column, sort }: { column: SortState['column']; sort: SortState }) {
  if (sort.column !== column) return null
  return sort.direction === 'asc' ? (
    <ChevronUp size={14} className="inline ml-1" />
  ) : (
    <ChevronDown size={14} className="inline ml-1" />
  )
}

function sortTeachers(teachers: TeacherDto[], sort: SortState): TeacherDto[] {
  if (!sort.column) return teachers
  return [...teachers].sort((a, b) => {
    let aVal: string | boolean
    let bVal: string | boolean

    if (sort.column === 'name') {
      aVal = getFullName(a).toLowerCase()
      bVal = getFullName(b).toLowerCase()
    } else if (sort.column === 'chair') {
      aVal = (a.universityFacultyChairShortName ?? '').toLowerCase()
      bVal = (b.universityFacultyChairShortName ?? '').toLowerCase()
    } else {
      aVal = a.isActive
      bVal = b.isActive
    }

    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
}

const SKELETON_ROWS = 8

export function TeachersTable({ teachers, isLoading, onRowClick }: TeachersTableProps) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: 'asc' })

  const handleSort = (column: SortState['column']) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    )
  }

  const sorted = sortTeachers(teachers, sort)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('name')}
            >
              ПІБ <SortIcon column="name" sort={sort} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap hidden md:table-cell"
              onClick={() => handleSort('chair')}
            >
              Кафедра <SortIcon column="chair" sort={sort} />
            </TableHead>
            <TableHead className="hidden lg:table-cell">Факультет</TableHead>
            <TableHead className="hidden md:table-cell">Посада</TableHead>
            <TableHead className="hidden lg:table-cell">Стаж</TableHead>
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('isActive')}
            >
              Статус <SortIcon column="isActive" sort={sort} />
            </TableHead>
            <TableHead className="text-center">Акаунт</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Loading skeleton */}
          {isLoading &&
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto rounded-full" />
                </TableCell>
              </TableRow>
            ))}

          {/* Empty state */}
          {!isLoading && sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Users size={48} className="text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">Викладачів не знайдено</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Спробуйте змінити параметри пошуку або синхронізувати дані з ЄДЕБО
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Data rows */}
          {!isLoading &&
            sorted.map((teacher) => (
              <TableRow
                key={teacher.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(teacher)}
              >
                <TableCell className="font-medium">{getFullName(teacher)}</TableCell>
                <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                  {teacher.universityFacultyChairShortName ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                  {teacher.universityFacultyShortName ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {teacher.positionName ?? '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatStage(teacher.stage)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={teacher.isActive ? 'default' : 'destructive'}
                    className={
                      teacher.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100'
                    }
                  >
                    {teacher.isActive ? 'Працює' : 'Звільнений'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {teacher.userId ? (
                    <UserCheck size={16} className="inline text-emerald-500" />
                  ) : (
                    <UserX size={16} className="inline text-muted-foreground/50" />
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
