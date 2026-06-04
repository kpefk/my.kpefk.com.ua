'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, School } from 'lucide-react'

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

import { formatDate, getTeacherFullName, type ClassroomDto } from '../types'

interface SortState {
  column: 'number' | 'name' | 'teacher' | 'photos' | 'updatedAt' | null
  direction: 'asc' | 'desc'
}

interface ClassroomsTableProps {
  classrooms: ClassroomDto[]
  isLoading: boolean
  onRowClick: (c: ClassroomDto) => void
}

function SortIcon({ column, sort }: { column: SortState['column']; sort: SortState }) {
  if (sort.column !== column) return null
  return sort.direction === 'asc'
    ? <ChevronUp size={14} className="inline ml-1" />
    : <ChevronDown size={14} className="inline ml-1" />
}

function sortClassrooms(classrooms: ClassroomDto[], sort: SortState): ClassroomDto[] {
  if (!sort.column) return classrooms
  return [...classrooms].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    switch (sort.column) {
      case 'number':    aVal = a.number.toLowerCase();   bVal = b.number.toLowerCase();   break
      case 'name':      aVal = a.name.toLowerCase();     bVal = b.name.toLowerCase();     break
      case 'teacher':
        aVal = a.teacher ? getTeacherFullName(a.teacher).toLowerCase() : ''
        bVal = b.teacher ? getTeacherFullName(b.teacher).toLowerCase() : ''
        break
      case 'photos':    aVal = a.photos.length;          bVal = b.photos.length;          break
      case 'updatedAt': aVal = a.updatedAt;              bVal = b.updatedAt;              break
      default: return 0
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
}

const SKELETON_ROWS = 6

export function ClassroomsTable({ classrooms, isLoading, onRowClick }: ClassroomsTableProps) {
  const [sort, setSort] = useState<SortState>({ column: 'number', direction: 'asc' })

  const handleSort = (column: SortState['column']) =>
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    )

  const sorted = sortClassrooms(classrooms, sort)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="cursor-pointer select-none w-[80px]" onClick={() => handleSort('number')}>
              № <SortIcon column="number" sort={sort} />
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
              Назва <SortIcon column="name" sort={sort} />
            </TableHead>
            <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('teacher')}>
              Завідувач <SortIcon column="teacher" sort={sort} />
            </TableHead>
            <TableHead className="cursor-pointer select-none text-center w-[80px] hidden sm:table-cell" onClick={() => handleSort('photos')}>
              Фото <SortIcon column="photos" sort={sort} />
            </TableHead>
            <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('updatedAt')}>
              Оновлено <SortIcon column="updatedAt" sort={sort} />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-10" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell className="hidden sm:table-cell text-center"><Skeleton className="h-5 w-6 mx-auto rounded" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
            </TableRow>
          ))}

          {!isLoading && sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <School size={48} className="text-muted-foreground/40" />
                  <p className="font-semibold">Кабінетів не знайдено</p>
                  <p className="text-sm text-muted-foreground">Спробуйте змінити параметри пошуку</p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!isLoading && sorted.map((classroom) => (
            <TableRow
              key={classroom.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(classroom)}
            >
              <TableCell className="font-mono font-semibold text-sm">
                №{classroom.number}
              </TableCell>
              <TableCell className="font-medium">{classroom.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                {classroom.teacher ? getTeacherFullName(classroom.teacher) : (
                  <span className="text-muted-foreground/50 italic">Не призначено</span>
                )}
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                <Badge
                  variant="outline"
                  className={classroom.photos.length > 0
                    ? 'text-xs border-primary/40 text-primary'
                    : 'text-xs text-muted-foreground/50'
                  }
                >
                  {classroom.photos.length}/4
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                {formatDate(classroom.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
