'use client'

import { useMemo } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { useDiploma } from '../api'
import { GRADE_LABELS, type DiplomaGrade, type DiplomaSummary } from '../types'

// ── Grade cell ─────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<DiplomaGrade, string> = {
  EXCELLENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  GOOD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  SATISFACTORY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  PASSED: 'bg-muted text-muted-foreground',
}

const GRADE_ABBR: Record<DiplomaGrade, string> = {
  EXCELLENT: 'Від.',
  GOOD: 'Доб.',
  SATISFACTORY: 'Зад.',
  PASSED: 'Зар.',
}

function GradeCell({ grade }: { grade: DiplomaGrade | null }) {
  if (!grade) return <td className="px-1 py-1.5 text-center text-xs text-muted-foreground/40">—</td>
  return (
    <td className="px-1 py-1.5 text-center">
      <span
        className={cn('inline-block rounded px-1 py-0.5 text-xs font-medium', GRADE_COLORS[grade])}
        title={GRADE_LABELS[grade]}
      >
        {GRADE_ABBR[grade]}
      </span>
    </td>
  )
}

// ── Row — loads individual diploma data ────────────────────────────────────────

function DiplomaRow({
  diploma,
  columnCount,
  onClick,
}: {
  diploma: DiplomaSummary
  columnCount: number
  onClick: () => void
}) {
  const { data: detail } = useDiploma(diploma.componentCount > 0 ? diploma.id : null)

  return (
    <tr
      onClick={onClick}
      className="border-t border-border/60 hover:bg-muted/20 cursor-pointer text-xs"
    >
      <td className="px-2 py-1.5 font-medium whitespace-nowrap sticky left-0 bg-card z-10 border-r border-border/40">
        {diploma.lastNameUk} {diploma.firstNameUk}
      </td>
      {detail
        ? detail.components.map((c) => <GradeCell key={c.id} grade={c.grade} />)
        : Array.from({ length: columnCount }).map((_, i) => (
            <td key={i} className="px-1 py-1.5 text-center text-muted-foreground/20">·</td>
          ))}
    </tr>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  batchId: string
  diplomas: DiplomaSummary[]
  isLoading: boolean
  onDiplomaClick?: (id: string) => void
}

export function GradeSheetView({ diplomas, isLoading, onDiplomaClick }: Props) {
  // Use the first diploma with components to determine the component list
  const referenceId = useMemo(
    () => diplomas.find((d) => d.componentCount > 0)?.id ?? null,
    [diplomas],
  )
  const { data: reference, isLoading: refLoading } = useDiploma(referenceId)

  if (isLoading || refLoading) {
    return <Skeleton className="h-[420px] w-full" />
  }

  if (diplomas.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
        У партії немає дипломів
      </div>
    )
  }

  if (!reference || reference.components.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        Призначте шаблон та виставте оцінки, щоб побачити зведену відомість.
      </div>
    )
  }

  const components = reference.components

  return (
    <div className="rounded-lg border border-border overflow-auto max-h-[70vh]">
      <table className="text-xs border-collapse min-w-max">
        <thead className="bg-muted/50 sticky top-0 z-20">
          <tr>
            <th className="text-left px-2 py-1.5 font-medium min-w-[180px] sticky left-0 bg-muted/50 z-30 border-r border-border/40 border-b border-border">
              Студент
            </th>
            {components.map((c, i) => (
              <th
                key={c.id}
                className="px-1 py-1.5 font-medium text-center border-b border-border min-w-[52px] max-w-[72px]"
                title={c.nameUk}
              >
                <div className="truncate max-w-[68px] text-muted-foreground">
                  {c.code ?? `${i + 1}`}
                </div>
              </th>
            ))}
          </tr>
          <tr className="bg-muted/30">
            <th className="sticky left-0 bg-muted/30 z-30 border-r border-border/40 border-b border-border/60 px-2 py-1 text-left text-muted-foreground font-normal">
              Назва ОК
            </th>
            {components.map((c) => (
              <th
                key={c.id}
                className="px-1 py-1 text-center border-b border-border/60 min-w-[52px]"
              >
                <div
                  className="truncate max-w-[68px] text-[10px] text-muted-foreground font-normal leading-tight"
                  title={c.nameUk}
                >
                  {c.nameUk.length > 14 ? c.nameUk.slice(0, 12) + '…' : c.nameUk}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diplomas.map((d) => (
            <DiplomaRow
              key={d.id}
              diploma={d}
              columnCount={components.length}
              onClick={() => onDiplomaClick?.(d.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
