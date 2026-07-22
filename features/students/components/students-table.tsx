'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, GraduationCap, UserCheck, UserX } from 'lucide-react'

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

import { isStudentActive, studentStatus, type StudentDto } from '../types'

interface SortState {
  column: 'personFIO' | 'groupName' | 'courseName' | 'isActive' | null
  direction: 'asc' | 'desc'
}

interface StudentsTableProps {
  students: StudentDto[]
  isLoading: boolean
  onRowClick: (s: StudentDto) => void
}

function SortIcon({ column, sort }: { column: SortState['column']; sort: SortState }) {
  if (sort.column !== column) return null
  return sort.direction === 'asc' ? (
    <ChevronUp size={14} className="inline ml-1" />
  ) : (
    <ChevronDown size={14} className="inline ml-1" />
  )
}

function sortStudents(students: StudentDto[], sort: SortState): StudentDto[] {
  if (!sort.column) return students
  return [...students].sort((a, b) => {
    let aVal: string | boolean
    let bVal: string | boolean

    switch (sort.column) {
      case 'personFIO':
        aVal = a.personFIO.toLowerCase()
        bVal = b.personFIO.toLowerCase()
        break
      case 'groupName':
        aVal = (a.groupName ?? '').toLowerCase()
        bVal = (b.groupName ?? '').toLowerCase()
        break
      case 'courseName':
        aVal = (a.courseName ?? '').toLowerCase()
        bVal = (b.courseName ?? '').toLowerCase()
        break
      case 'isActive':
        aVal = isStudentActive(a)
        bVal = isStudentActive(b)
        break
      default:
        return 0
    }

    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
}

function StudentStatusBadge({ student }: { student: StudentDto }) {
  switch (studentStatus(student)) {
    case 'ACADEMIC_LEAVE':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 whitespace-nowrap">
          Академвідпустка
        </Badge>
      )
    case 'EXPELLED':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
          Відраховано
        </Badge>
      )
    case 'COMPLETED':
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 whitespace-nowrap">
          Навчання завершено
        </Badge>
      )
    default:
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
          Навчається
        </Badge>
      )
  }
}

const SKELETON_ROWS = 10

export function StudentsTable({ students, isLoading, onRowClick }: StudentsTableProps) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: 'asc' })

  const handleSort = (column: SortState['column']) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    )
  }

  const sorted = sortStudents(students, sort)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('personFIO')}
            >
              ПІБ <SortIcon column="personFIO" sort={sort} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap hidden sm:table-cell"
              onClick={() => handleSort('groupName')}
            >
              Група <SortIcon column="groupName" sort={sort} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap hidden md:table-cell"
              onClick={() => handleSort('courseName')}
            >
              Курс <SortIcon column="courseName" sort={sort} />
            </TableHead>
            <TableHead className="hidden lg:table-cell">Спеціальність</TableHead>
            <TableHead className="hidden xl:table-cell">Форма</TableHead>
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
          {isLoading &&
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-4 w-4 mx-auto rounded-full" /></TableCell>
              </TableRow>
            ))}

          {!isLoading && sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <GraduationCap size={48} className="text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">Студентів не знайдено</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Спробуйте змінити параметри пошуку або синхронізувати дані з ЄДЕБО
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            sorted.map((student) => (
              <TableRow
                key={student.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(student)}
              >
                <TableCell className="font-medium">{student.personFIO}</TableCell>
                <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                  {student.groupName ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                  {student.courseName ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm hidden lg:table-cell max-w-[240px] truncate">
                  {student.fullSpecialityName ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm hidden xl:table-cell">
                  {student.educationFormName ?? '—'}
                </TableCell>
                <TableCell>
                  <StudentStatusBadge student={student} />
                </TableCell>
                <TableCell className="text-center">
                  {student.userId ? (
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
