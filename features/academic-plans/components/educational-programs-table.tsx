'use client'

import { useState } from 'react'
import { BookMarked, ChevronDown, ChevronUp } from 'lucide-react'

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

import { type EducationalProgramDto } from '../types'

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortColumn = 'name' | 'specialty' | 'qualificationLevel' | null

interface SortState {
  column: SortColumn
  direction: 'asc' | 'desc'
}

function SortIcon({ column, sort }: { column: SortColumn; sort: SortState }) {
  if (sort.column !== column) return null
  return sort.direction === 'asc' ? (
    <ChevronUp size={14} className="inline ml-1" />
  ) : (
    <ChevronDown size={14} className="inline ml-1" />
  )
}

function sortPrograms(
  programs: EducationalProgramDto[],
  sort: SortState,
): EducationalProgramDto[] {
  if (!sort.column) return programs
  return [...programs].sort((a, b) => {
    let aVal: string
    let bVal: string
    switch (sort.column) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'specialty':
        aVal = a.specialty.name.toLowerCase()
        bVal = b.specialty.name.toLowerCase()
        break
      case 'qualificationLevel':
        aVal = (a.qualificationLevel ?? a.qualificationName ?? '').toLowerCase()
        bVal = (b.qualificationLevel ?? b.qualificationName ?? '').toLowerCase()
        break
      default:
        return 0
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

const SKELETON_ROWS = 8

interface EducationalProgramsTableProps {
  programs: EducationalProgramDto[]
  isLoading: boolean
}

export function EducationalProgramsTable({
  programs,
  isLoading,
}: EducationalProgramsTableProps) {
  const [sort, setSort] = useState<SortState>({ column: 'name', direction: 'asc' })

  const handleSort = (column: SortColumn) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    )
  }

  const sorted = sortPrograms(programs, sort)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('name')}
            >
              Освітня програма <SortIcon column="name" sort={sort} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap hidden sm:table-cell"
              onClick={() => handleSort('specialty')}
            >
              Спеціальність <SortIcon column="specialty" sort={sort} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap hidden md:table-cell"
              onClick={() => handleSort('qualificationLevel')}
            >
              Рівень <SortIcon column="qualificationLevel" sort={sort} />
            </TableHead>
            <TableHead className="hidden lg:table-cell whitespace-nowrap">
              Спеціалізація
            </TableHead>
            <TableHead className="text-center hidden sm:table-cell whitespace-nowrap">
              ЄДЕБО ID
            </TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Loading */}
          {isLoading &&
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-52" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-44" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
              </TableRow>
            ))}

          {/* Empty */}
          {!isLoading && sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <BookMarked size={48} className="text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">
                    Освітніх програм не знайдено
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Спробуйте змінити параметри пошуку або запустіть синхронізацію з ЄДЕБО
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Data */}
          {!isLoading &&
            sorted.map((program) => (
              <TableRow
                key={program.id}
                className="hover:bg-muted/50 transition-colors"
              >
                {/* Program name */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{program.name}</span>
                    {program.studyProgramNameEn && (
                      <span className="text-xs text-muted-foreground/70 truncate max-w-[280px]">
                        {program.studyProgramNameEn}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Specialty */}
                <TableCell className="hidden sm:table-cell">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{program.specialty.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {program.specialty.code}
                    </span>
                  </div>
                </TableCell>

                {/* Qualification level */}
                <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                  {program.qualificationLevel ?? program.qualificationName ?? '—'}
                </TableCell>

                {/* Specialization */}
                <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                  {program.specializationName ?? '—'}
                </TableCell>

                {/* EDEBO ID */}
                <TableCell className="text-center hidden sm:table-cell">
                  {program.edeboId ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {program.edeboId}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell>
                  {program.isActive ? (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                      Активна
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
                      Заблокована
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
