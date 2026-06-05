'use client'

import { useState } from 'react'
import { CalendarDays, CheckCircle, Clock, Plus, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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

import { useApproveWorkingCurriculum, useWorkingCurriculum, useWorkingCurricula } from '../api'
import {
  COMPONENT_TYPE_LABELS,
  CONTROL_FORM_SHORT,
  type WorkingCurriculumSummaryDto,
} from '../types'
import { CreateWorkingCurriculumDialog } from './create-working-curriculum-dialog'

// ─── Working curriculum card ──────────────────────────────────────────────────

interface WorkingCardProps {
  wc: WorkingCurriculumSummaryDto
  isSelected: boolean
  onClick: () => void
}

function WorkingCard({ wc, isSelected, onClick }: WorkingCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border px-4 py-3 transition-colors',
        isSelected
          ? 'border-primary bg-primary-light dark:bg-primary-light'
          : 'border-border hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-muted-foreground shrink-0" />
          <span className="font-mono font-semibold">{wc.academicYear}</span>
        </div>

        {wc.isApproved ? (
          <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle size={11} className="mr-1" />
            Затверджений
          </Badge>
        ) : (
          <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock size={11} className="mr-1" />
            Чернетка
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span>
          Семестри: {wc.semesterNumbers.join(', ')}
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Users size={11} />
          {wc._count?.groupAssignments ?? 0} груп
        </span>
      </div>
    </button>
  )
}

// ─── Hour breakdown table ─────────────────────────────────────────────────────

function HourBreakdownTable({ workingId }: { workingId: string }) {
  const { data: wc, isLoading } = useWorkingCurriculum(workingId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (!wc || wc.componentTerms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CalendarDays size={36} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">Розподіл годин ще не внесено</p>
        <p className="text-xs text-muted-foreground mt-1">
          Використовуйте API для заповнення розподілу
        </p>
      </div>
    )
  }

  // Sort by semester, then by component name
  const sorted = [...wc.componentTerms].sort(
    (a, b) =>
      a.componentTerm.semesterNumber - b.componentTerm.semesterNumber ||
      a.componentTerm.component.name.localeCompare(b.componentTerm.component.name, 'uk'),
  )

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="whitespace-nowrap">Компонент</TableHead>
            <TableHead className="text-center whitespace-nowrap">Сем.</TableHead>
            <TableHead className="text-center whitespace-nowrap">Лекції</TableHead>
            <TableHead className="text-center whitespace-nowrap">Практ.</TableHead>
            <TableHead className="text-center whitespace-nowrap">Лаб.</TableHead>
            <TableHead className="text-center whitespace-nowrap">Сем.зан.</TableHead>
            <TableHead className="text-center whitespace-nowrap">СР</TableHead>
            <TableHead className="text-center whitespace-nowrap">Всього</TableHead>
            <TableHead className="text-center whitespace-nowrap">Контроль</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((t) => {
            const total =
              t.lectureHours +
              t.practicalHours +
              t.labHours +
              t.seminarHours +
              t.independentHours +
              t.consultationHours
            return (
              <TableRow key={t.id} className="hover:bg-muted/30">
                <TableCell className="max-w-[200px]">
                  <div className="flex flex-col gap-0.5">
                    {t.componentTerm.component.code && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {t.componentTerm.component.code}
                      </span>
                    )}
                    <span className="text-sm truncate">
                      {t.componentTerm.component.name}
                    </span>
                    {t.componentTerm.component.componentType !== 'DISCIPLINE' && (
                      <span className="text-xs text-muted-foreground/70 italic">
                        {COMPONENT_TYPE_LABELS[t.componentTerm.component.componentType]}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {t.componentTerm.semesterNumber}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {t.lectureHours || '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {t.practicalHours || '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {t.labHours || '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {t.seminarHours || '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {t.independentHours || '—'}
                </TableCell>
                <TableCell className="text-center font-mono text-sm font-medium">
                  {total}
                </TableCell>
                <TableCell className="text-center text-xs">
                  {CONTROL_FORM_SHORT[t.componentTerm.controlForm]}
                </TableCell>
              </TableRow>
            )
          })}
          {/* Summary row */}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell colSpan={2} className="text-sm">
              Всього
            </TableCell>
            <TableCell className="text-center font-mono text-sm">
              {sorted.reduce((s, t) => s + t.lectureHours, 0)}
            </TableCell>
            <TableCell className="text-center font-mono text-sm">
              {sorted.reduce((s, t) => s + t.practicalHours, 0)}
            </TableCell>
            <TableCell className="text-center font-mono text-sm">
              {sorted.reduce((s, t) => s + t.labHours, 0)}
            </TableCell>
            <TableCell className="text-center font-mono text-sm">
              {sorted.reduce((s, t) => s + t.seminarHours, 0)}
            </TableCell>
            <TableCell className="text-center font-mono text-sm">
              {sorted.reduce((s, t) => s + t.independentHours, 0)}
            </TableCell>
            <TableCell className="text-center font-mono text-sm">
              {sorted.reduce(
                (s, t) =>
                  s +
                  t.lectureHours +
                  t.practicalHours +
                  t.labHours +
                  t.seminarHours +
                  t.independentHours +
                  t.consultationHours,
                0,
              )}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WorkingCurriculumPanelProps {
  versionId: string
  canManage: boolean
  maxSemesters?: number
}

export function WorkingCurriculumPanel({
  versionId,
  canManage,
  maxSemesters = 8,
}: WorkingCurriculumPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: workingCurricula = [], isLoading } = useWorkingCurricula({ versionId })
  const approveWorking = useApproveWorkingCurriculum()

  // Auto-select first when data loads
  const effectiveSelected = selectedId ?? workingCurricula[0]?.id ?? null

  return (
    <div className="flex flex-col gap-0">
      {/* Panel header */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-base">Робочі навчальні плани</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? 'Завантаження...'
              : `${workingCurricula.length} ${workingCurricula.length === 1 ? 'план' : 'плани'}`}
          </p>
        </div>

        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus size={14} />
            Новий робочий план
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row min-h-[400px]">
        {/* Left: list of working curricula */}
        <div className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col gap-2">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}

          {!isLoading && workingCurricula.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <CalendarDays size={32} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Немає робочих планів</p>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="mt-1 gap-1.5"
                >
                  <Plus size={13} />
                  Створити
                </Button>
              )}
            </div>
          )}

          {!isLoading &&
            workingCurricula.map((wc) => (
              <WorkingCard
                key={wc.id}
                wc={wc}
                isSelected={effectiveSelected === wc.id}
                onClick={() => setSelectedId(wc.id)}
              />
            ))}
        </div>

        {/* Right: detail */}
        <div className="flex-1 min-w-0">
          {effectiveSelected ? (
            <div className="flex flex-col gap-0">
              {/* Selected working curriculum actions */}
              {canManage && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
                  {workingCurricula.find((w) => w.id === effectiveSelected)?.isApproved ===
                    false && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={approveWorking.isPending}
                      onClick={() => approveWorking.mutate(effectiveSelected)}
                    >
                      <CheckCircle size={14} />
                      Затвердити
                    </Button>
                  )}
                </div>
              )}

              <HourBreakdownTable workingId={effectiveSelected} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full py-16 text-sm text-muted-foreground">
              Оберіть робочий план зі списку
            </div>
          )}
        </div>
      </div>

      <CreateWorkingCurriculumDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        versionId={versionId}
        maxSemesters={maxSemesters}
      />
    </div>
  )
}
