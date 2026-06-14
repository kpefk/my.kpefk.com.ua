'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  BookMarked,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCurrentAcademicYear } from '@/lib/academic-year'
import { cn } from '@/lib/utils'

import {
  useMyBlocks,
  useMySelectionsV2,
  useStudentCancelSelectionV2,
  useStudentSelectV2,
} from '../api'
import type {
  CatalogStatus,
  ElectiveBlockSeasonDto,
  ElectiveOfferingDto,
  SelectionStatus,
  StudentElectiveSelectionDto,
  TermControlForm,
} from '../types'
import { CATALOG_STATUS_LABELS, CONTROL_FORM_LABELS } from '../types'

interface Props {
  academicYear?: string
}

const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear()

// ── Status banner ─────────────────────────────────────────────────────────────

function StatusBanner({ status }: { status: CatalogStatus }) {
  if (status === 'DRAFT') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle size={15} className="shrink-0" />
        Каталог ВК ще не опубліковано. Очікуйте до 1 квітня.
      </div>
    )
  }
  if (status === 'OPEN') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
        <CheckCircle2 size={15} className="shrink-0" />
        Вибір відкрито до 15 травня. Оберіть по одному ВК на кожен семестр.
      </div>
    )
  }
  if (status === 'LATE') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
        <AlertCircle size={15} className="shrink-0" />
        Продовжений вибір за поважних причин — до 1 червня. Зверніться до адміністрації.
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      <AlertCircle size={15} className="shrink-0" />
      Вибір ВК завершено. Ваш вибір зафіксовано.
    </div>
  )
}

// ── cfLabel helper ────────────────────────────────────────────────────────────

function cfLabel(cf: TermControlForm | null | undefined): string | null {
  if (!cf) return null
  return CONTROL_FORM_LABELS[cf]
}

// ── Single block section ──────────────────────────────────────────────────────

function BlockSection({
  season,
  mySelection,
  search,
  canSelectGlobally,
  pendingId,
  onSelect,
  onCancel,
}: {
  season: ElectiveBlockSeasonDto
  mySelection: StudentElectiveSelectionDto | undefined
  search: string
  canSelectGlobally: boolean
  pendingId: string | null
  onSelect: (offering: ElectiveOfferingDto, season: ElectiveBlockSeasonDto) => void
  onCancel: (selection: StudentElectiveSelectionDto) => void
}) {
  const offerings = season.offerings ?? []
  const canSelect = canSelectGlobally && (season.catalogStatus === 'OPEN' || season.catalogStatus === 'LATE')
  const semesterNumber = season.block.semesterNumber

  const filtered = offerings.filter(o => {
    const q = search.toLowerCase()
    return !q || o.component.name.toLowerCase().includes(q)
  })

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Block header */}
      <div className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{season.block.name}</span>
          <Badge variant="secondary" className="text-xs font-mono">{semesterNumber} сем.</Badge>
          <StatusBadgeInline status={season.catalogStatus} />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          Оберіть {season.block.minSelections === season.block.maxSelections
            ? season.block.minSelections
            : `${season.block.minSelections}–${season.block.maxSelections}`} ВК
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead>Назва дисципліни</TableHead>
            <TableHead className="w-24 hidden md:table-cell text-center">ЄКТС / год.</TableHead>
            <TableHead className="w-24 hidden sm:table-cell">Силабус</TableHead>
            <TableHead className="w-32 text-right">Вибір</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offerings.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                <div className="flex flex-col items-center gap-2">
                  <BookMarked size={28} className="text-muted-foreground/40" />
                  <span className="text-sm">Дисциплін ще немає</span>
                </div>
              </TableCell>
            </TableRow>
          )}

          {filtered.length === 0 && offerings.length > 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">
                Не знайдено за пошуком
              </TableCell>
            </TableRow>
          )}

          {filtered.map(offering => {
            const term = offering.component.terms.find(t => t.semesterNumber === semesterNumber)
            const isSelected =
              mySelection?.componentId === offering.componentId &&
              mySelection?.status !== 'CANCELLED'
            const isPending = pendingId === offering.componentId
            const selectionConfirmed = mySelection?.status === 'CONFIRMED'

            return (
              <TableRow
                key={offering.id}
                className={cn(
                  'transition-colors',
                  isSelected && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                )}
              >
                {/* Name */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{offering.component.name}</span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 size={11} />
                        {selectionConfirmed ? 'Підтверджено' : 'Вибрано'}
                        {mySelection?.method === 'ASSIGNED' && ' (наказом)'}
                      </span>
                    )}
                    {offering.isHigherEd && (
                      <Badge variant="outline" className="text-[10px] w-fit mt-0.5">
                        Вища освіта
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* ECTS / hours */}
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col items-center gap-0.5">
                    {term ? (
                      <>
                        <span className="text-sm font-mono text-muted-foreground">{term.ects} кр.</span>
                        <span className="text-[10px] text-muted-foreground/70 text-center leading-tight">
                          {term.hours} год.
                          {cfLabel(term.controlForm) && ` · ${cfLabel(term.controlForm)}`}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Syllabus */}
                <TableCell className="hidden sm:table-cell">
                  {offering.syllabusUrl ? (
                    <a
                      href={offering.syllabusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                      Силабус
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">—</span>
                  )}
                </TableCell>

                {/* Action */}
                <TableCell className="text-right">
                  {isSelected && season.catalogStatus === 'OPEN' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => mySelection && onCancel(mySelection)}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 size={12} className="animate-spin" /> : 'Скасувати'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={
                        !canSelect ||
                        isPending ||
                        isSelected ||
                        (!!mySelection && mySelection.status !== 'CANCELLED' && !isSelected)
                      }
                      onClick={() => onSelect(offering, season)}
                      title={
                        mySelection && mySelection.status !== 'CANCELLED' && !isSelected
                          ? 'Ви вже обрали ВК у цьому блоці. Спочатку скасуйте попередній.'
                          : !canSelect
                            ? CATALOG_STATUS_LABELS[season.catalogStatus]
                            : undefined
                      }
                    >
                      {isPending
                        ? <Loader2 size={12} className="animate-spin" />
                        : isSelected
                          ? <CheckCircle2 size={12} />
                          : 'Обрати'}
                    </Button>
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

function StatusBadgeInline({ status }: { status: CatalogStatus }) {
  const styles: Record<CatalogStatus, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return (
    <Badge className={cn('text-[10px] font-medium hover:opacity-100 h-4 px-1.5', styles[status])}>
      {CATALOG_STATUS_LABELS[status]}
    </Badge>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ElectiveCatalogClient({ academicYear = CURRENT_ACADEMIC_YEAR }: Props) {
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current) }
  }, [search])

  const { data: seasons = [], isLoading: seasonsLoading } = useMyBlocks(academicYear)
  const { data: mySelections = [], isLoading: selectionsLoading } = useMySelectionsV2(academicYear)
  const selectMutation = useStudentSelectV2()
  const cancelMutation = useStudentCancelSelectionV2()

  // Map seasonId → my active selection (non-cancelled)
  const selectionBySeason = new Map<string, StudentElectiveSelectionDto>()
  for (const sel of mySelections) {
    if (sel.status !== 'CANCELLED') {
      selectionBySeason.set(sel.seasonId, sel)
    }
  }

  // Overall catalog window: use the most "open" status across all seasons
  const statuses: CatalogStatus[] = seasons.map(s => s.catalogStatus)
  const overallStatus: CatalogStatus = statuses.includes('OPEN')
    ? 'OPEN'
    : statuses.includes('LATE')
      ? 'LATE'
      : statuses.includes('CLOSED')
        ? 'CLOSED'
        : 'DRAFT'

  const canSelectGlobally = overallStatus === 'OPEN' || overallStatus === 'LATE'

  const handleSelect = async (offering: ElectiveOfferingDto, season: ElectiveBlockSeasonDto) => {
    setPendingId(offering.componentId)
    try {
      await selectMutation.mutateAsync({
        seasonId: season.id,
        componentId: offering.componentId,
      })
      toast.success(`ВК «${offering.component.name}» вибрано`)
    } finally {
      setPendingId(null)
    }
  }

  const handleCancel = async (selection: StudentElectiveSelectionDto) => {
    setPendingId(selection.componentId)
    try {
      await cancelMutation.mutateAsync(selection.id)
      toast.success('Вибір скасовано')
    } finally {
      setPendingId(null)
    }
  }

  const isLoading = seasonsLoading || selectionsLoading

  return (
    <div className="space-y-4">
      {/* Top banner — based on overall window */}
      {!isLoading && <StatusBanner status={overallStatus} />}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук за назвою ВК..."
            className="pl-9 bg-background"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch('')}
            className="gap-1.5"
          >
            <X size={14} />
            Скинути
          </Button>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/40 px-4 py-2.5 flex items-center gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-4 px-4 py-3 border-t border-border">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16 hidden md:block" />
                  <Skeleton className="h-4 w-14 hidden sm:block" />
                  <Skeleton className="h-7 w-20 rounded-md ml-auto" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && seasons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <BookMarked size={48} className="text-muted-foreground/40" />
          <div>
            <p className="font-semibold text-foreground">Каталог ВК ще не опубліковано</p>
            <p className="text-sm text-muted-foreground mt-1">Очікуйте публікації до 1 квітня</p>
          </div>
        </div>
      )}

      {/* One section per block/season */}
      {!isLoading && seasons.map(season => (
        <BlockSection
          key={season.id}
          season={season}
          mySelection={selectionBySeason.get(season.id)}
          search={debouncedSearch}
          canSelectGlobally={canSelectGlobally}
          pendingId={pendingId}
          onSelect={handleSelect}
          onCancel={handleCancel}
        />
      ))}
    </div>
  )
}
