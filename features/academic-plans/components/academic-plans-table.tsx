'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Library } from 'lucide-react'

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
import { cn } from '@/lib/utils'

import {
  ADMISSION_BASIS_LABELS,
  EDUCATION_FORM_LABELS,
  formatDate,
  getLatestActiveVersion,
  type CurriculumFilters,
  type CurriculumListItemDto,
} from '../types'

interface SortState {
  column: 'specialty' | 'program' | 'year' | null
  direction: 'asc' | 'desc'
}

function SortIcon({ column, sort }: { column: SortState['column']; sort: SortState }) {
  if (sort.column !== column) return null
  return sort.direction === 'asc' ? (
    <ChevronUp size={14} className="inline ml-1 shrink-0" />
  ) : (
    <ChevronDown size={14} className="inline ml-1 shrink-0" />
  )
}

function sortItems(items: CurriculumListItemDto[], sort: SortState): CurriculumListItemDto[] {
  if (!sort.column) return items
  return [...items].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    if (sort.column === 'specialty') {
      aVal = a.program.specialty.name.toLowerCase()
      bVal = b.program.specialty.name.toLowerCase()
    } else if (sort.column === 'program') {
      aVal = a.program.name.toLowerCase()
      bVal = b.program.name.toLowerCase()
    } else {
      aVal = a.entryYear
      bVal = b.entryYear
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
}

function filterItems(
  items: CurriculumListItemDto[],
  filters: CurriculumFilters,
): CurriculumListItemDto[] {
  const q = filters.search.toLowerCase()
  return items.filter((item) => {
    const matchSearch =
      !q ||
      item.program.name.toLowerCase().includes(q) ||
      item.program.specialty.name.toLowerCase().includes(q) ||
      item.program.specialty.code.toLowerCase().includes(q)
    const matchForm = !filters.educationForm || item.educationForm === filters.educationForm
    const matchBasis = !filters.admissionBasis || item.admissionBasis === filters.admissionBasis
    const matchActive = filters.isActive === null || item.isActive === filters.isActive
    return matchSearch && matchForm && matchBasis && matchActive
  })
}

const SKELETON_ROWS = 8

interface AcademicPlansTableProps {
  curricula: CurriculumListItemDto[]
  isLoading: boolean
  filters: CurriculumFilters
}

export function AcademicPlansTable({ curricula, isLoading, filters }: AcademicPlansTableProps) {
  const router = useRouter()
  const [sort, setSort] = useState<SortState>({ column: 'year', direction: 'desc' })

  const handleSort = (column: SortState['column']) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    )
  }

  const filtered = filterItems(curricula, filters)
  const sorted = sortItems(filtered, sort)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('specialty')}
            >
              Спеціальність <SortIcon column="specialty" sort={sort} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none whitespace-nowrap hidden sm:table-cell"
              onClick={() => handleSort('program')}
            >
              Освітня програма <SortIcon column="program" sort={sort} />
            </TableHead>
            <TableHead className="hidden md:table-cell whitespace-nowrap">Форма / Підстава</TableHead>
            <TableHead
              className="cursor-pointer select-none text-center hidden lg:table-cell whitespace-nowrap"
              onClick={() => handleSort('year')}
            >
              Рік вступу <SortIcon column="year" sort={sort} />
            </TableHead>
            <TableHead className="text-center hidden md:table-cell whitespace-nowrap">ЄКТС</TableHead>
            <TableHead className="hidden sm:table-cell whitespace-nowrap">Остання версія</TableHead>
            <TableHead className="text-center hidden lg:table-cell whitespace-nowrap">Груп</TableHead>
            <TableHead className="hidden sm:table-cell whitespace-nowrap">Статус</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Loading */}
          {isLoading &&
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              </TableRow>
            ))}

          {/* Empty – no data at all */}
          {!isLoading && curricula.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <Library size={48} className="text-muted-foreground/40" />
                  <div>
                    <p className="font-semibold text-foreground">Навчальних планів ще немає</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Натисніть «Новий план», щоб створити перший
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Empty – filtered */}
          {!isLoading && curricula.length > 0 && sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Library size={48} className="text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">Не знайдено</p>
                  <p className="text-sm text-muted-foreground">Спробуйте змінити фільтри</p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Data */}
          {!isLoading &&
            sorted.map((item) => {
              const latestVersion = getLatestActiveVersion(item.versions ?? [])
              const hasDraft = (item.versions ?? []).some((v) => !v.isPublished)
              return (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/academic-plans/${item.id}`)}
                >
                  {/* Specialty */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{item.program.specialty.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {item.program.specialty.code}
                      </span>
                    </div>
                  </TableCell>

                  {/* Program */}
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5 max-w-[220px]">
                      <span className="text-sm truncate">{item.program.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {item.program.qualificationName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Form / Basis */}
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="whitespace-nowrap font-normal w-fit text-xs">
                        {EDUCATION_FORM_LABELS[item.educationForm]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {ADMISSION_BASIS_LABELS[item.admissionBasis]}
                      </span>
                    </div>
                  </TableCell>

                  {/* Entry year */}
                  <TableCell className="text-center hidden lg:table-cell text-sm font-mono">
                    {item.entryYear}
                  </TableCell>

                  {/* ECTS */}
                  <TableCell className="text-center hidden md:table-cell text-sm font-mono">
                    {Number.isFinite(Number(item.totalEcts)) ? Number(item.totalEcts) : '—'}
                  </TableCell>

                  {/* Latest version */}
                  <TableCell className="hidden sm:table-cell">
                    {latestVersion ? (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={cn(
                            'text-xs font-medium',
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                          )}
                        >
                          v{latestVersion.versionNumber}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(latestVersion.approvalDate)}
                        </span>
                      </div>
                    ) : hasDraft ? (
                      <Badge
                        className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        Чернетка
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Немає версій</span>
                    )}
                  </TableCell>

                  {/* Groups count */}
                  <TableCell className="text-center hidden lg:table-cell text-sm text-muted-foreground">
                    {item._count?.groupAssignments ?? 0}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="hidden sm:table-cell">
                    {item.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                        Активний
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs">
                        Архівний
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>
    </div>
  )
}
