'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CheckCircle, Clock, Plus, Trash2, Users } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  useApproveWorkingCurriculum,
  useDeleteWorkingCurriculum,
  useInitializeWorkingCurriculumTerms,
  useUpdateWorkingComponentTerm,
  useWorkingCurriculum,
  useWorkingCurricula,
} from '../api'
import {
  COMPONENT_TYPE_LABELS,
  CONTROL_FORM_SHORT,
  type WorkingComponentTermDto,
  type WorkingCurriculumSummaryDto,
} from '../types'
import { CreateWorkingCurriculumDialog } from './create-working-curriculum-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftRow {
  lectureHours: string
  practicalHours: string
  labHours: string
  seminarHours: string
  independentHours: string
  consultationHours: string
  weeklyLectureHours: string
  weeklyPracticalHours: string
}

type RowStatus = 'empty' | 'partial' | 'complete' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toStr(v: number): string {
  return v === 0 ? '' : String(v)
}

function initDraft(t: WorkingComponentTermDto): DraftRow {
  return {
    lectureHours: toStr(t.lectureHours),
    practicalHours: toStr(t.practicalHours),
    labHours: toStr(t.labHours),
    seminarHours: toStr(t.seminarHours),
    independentHours: toStr(t.independentHours),
    consultationHours: toStr(t.consultationHours),
    weeklyLectureHours: t.weeklyLectureHours ?? '',
    weeklyPracticalHours: t.weeklyPracticalHours ?? '',
  }
}

function draftSum(d: DraftRow): number {
  return (
    (parseInt(d.lectureHours) || 0) +
    (parseInt(d.practicalHours) || 0) +
    (parseInt(d.labHours) || 0) +
    (parseInt(d.seminarHours) || 0) +
    (parseInt(d.independentHours) || 0) +
    (parseInt(d.consultationHours) || 0)
  )
}

function rowStatus(canonical: number, d: DraftRow): RowStatus {
  const sum = draftSum(d)
  if (sum === 0) return 'empty'
  if (sum > canonical) return 'error'
  if (sum === canonical) return 'complete'
  return 'partial'
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: RowStatus }) {
  return (
    <span
      title={
        status === 'complete'
          ? 'Розподіл заповнено повністю'
          : status === 'partial'
            ? 'Розподіл заповнено частково'
            : status === 'error'
              ? 'Сума перевищує норму'
              : 'Розподіл не заповнено'
      }
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full shrink-0',
        status === 'complete' && 'bg-emerald-500',
        status === 'partial' && 'bg-amber-400',
        status === 'error' && 'bg-red-500',
        status === 'empty' && 'bg-muted-foreground/30',
      )}
    />
  )
}

// ─── Editable cell ────────────────────────────────────────────────────────────

interface EditCellProps {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  disabled: boolean
  invalid?: boolean
  isDecimal?: boolean
}

function EditCell({ value, onChange, onBlur, disabled, invalid = false, isDecimal = false }: EditCellProps) {
  return (
    <td
      className={cn(
        'px-1 py-1 text-center',
        invalid && 'bg-red-50 dark:bg-red-950/20',
      )}
    >
      <input
        type={isDecimal ? 'text' : 'number'}
        inputMode={isDecimal ? 'decimal' : 'numeric'}
        min={isDecimal ? undefined : '0'}
        step={isDecimal ? undefined : '1'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(
          'w-14 text-center font-mono text-xs bg-transparent outline-none rounded',
          'border border-transparent',
          !disabled && 'hover:border-input focus:border-ring focus:ring-1 focus:ring-ring',
          disabled && 'cursor-default text-foreground',
          invalid && 'text-red-600 dark:text-red-400',
        )}
      />
    </td>
  )
}

// ─── Hour distribution table ──────────────────────────────────────────────────

function HourDistributionTable({
  workingId,
  canEdit,
}: {
  workingId: string
  canEdit: boolean
}) {
  const { data: wc, isLoading } = useWorkingCurriculum(workingId)
  const updateTerm = useUpdateWorkingComponentTerm()
  const initTerms = useInitializeWorkingCurriculumTerms()

  // Local draft state: term id → current input values
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({})

  // Sync: add newly-loaded terms that aren't in drafts yet
  useEffect(() => {
    if (!wc) return
    setDrafts((prev) => {
      const next = { ...prev }
      let changed = false
      for (const t of wc.componentTerms) {
        if (!(t.id in next)) {
          next[t.id] = initDraft(t)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [wc])

  const setField = useCallback(
    (termId: string, field: keyof DraftRow, value: string) => {
      setDrafts((prev) => {
        const current = prev[termId]
        if (!current) return prev
        return { ...prev, [termId]: { ...current, [field]: value } }
      })
    },
    [],
  )

  const handleBlur = useCallback(
    (termId: string) => {
      if (!wc) return
      const draft = drafts[termId]
      const server = wc.componentTerms.find((t) => t.id === termId)
      if (!draft || !server) return

      // Parse weekly hours draft string → number | null for the backend DTO.
      // Backend UpdateWorkingComponentTermDto expects number | null, not string.
      const parseWeekly = (s: string): number | null => {
        const trimmed = s.trim()
        if (!trimmed) return null
        const n = parseFloat(trimmed)
        return isNaN(n) || n === 0 ? null : n
      }

      // Normalize the server value (Prisma Decimal serializes as string via JSON)
      // to the same number | null type for a type-safe comparison.
      const parseServerWeekly = (s: string | null | undefined): number | null =>
        s ? (parseFloat(s) || null) : null

      const next = {
        lectureHours: parseInt(draft.lectureHours) || 0,
        practicalHours: parseInt(draft.practicalHours) || 0,
        labHours: parseInt(draft.labHours) || 0,
        seminarHours: parseInt(draft.seminarHours) || 0,
        independentHours: parseInt(draft.independentHours) || 0,
        consultationHours: parseInt(draft.consultationHours) || 0,
        weeklyLectureHours: parseWeekly(draft.weeklyLectureHours),
        weeklyPracticalHours: parseWeekly(draft.weeklyPracticalHours),
      }

      const changed =
        next.lectureHours !== server.lectureHours ||
        next.practicalHours !== server.practicalHours ||
        next.labHours !== server.labHours ||
        next.seminarHours !== server.seminarHours ||
        next.independentHours !== server.independentHours ||
        next.consultationHours !== server.consultationHours ||
        next.weeklyLectureHours !== parseServerWeekly(server.weeklyLectureHours) ||
        next.weeklyPracticalHours !== parseServerWeekly(server.weeklyPracticalHours)

      if (!changed) return

      updateTerm.mutate({
        termId,
        workingCurriculumId: wc.id,
        data: next,
      })
    },
    [drafts, wc, updateTerm],
  )

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  // ── Empty (no component terms created yet) ────────────────────────────────
  if (!wc || wc.componentTerms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <CalendarDays size={40} className="text-muted-foreground/30" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Розподіл годин ще не внесено</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Натисніть кнопку, щоб створити рядки розподілу для всіх компонентів цього плану.
            Дія безпечна — її можна виконати повторно.
          </p>
        </div>
        {canEdit && (
          <Button
            size="sm"
            className="gap-2 mt-1"
            disabled={initTerms.isPending}
            onClick={() => initTerms.mutate(workingId)}
          >
            {initTerms.isPending ? (
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Plus size={14} />
            )}
            Ініціалізувати розподіл годин
          </Button>
        )}
        {!canEdit && (
          <p className="text-xs text-muted-foreground italic">
            Недостатньо прав для ініціалізації
          </p>
        )}
      </div>
    )
  }

  const isReadOnly = !canEdit || wc.isApproved

  // Sort by semester → component name
  const sorted = [...wc.componentTerms].sort(
    (a, b) =>
      a.componentTerm.semesterNumber - b.componentTerm.semesterNumber ||
      a.componentTerm.component.name.localeCompare(b.componentTerm.component.name, 'uk'),
  )

  // Compute column totals from drafts
  const totalLecture = sorted.reduce((s, t) => s + (parseInt(drafts[t.id]?.lectureHours ?? '') || 0), 0)
  const totalPractical = sorted.reduce((s, t) => s + (parseInt(drafts[t.id]?.practicalHours ?? '') || 0), 0)
  const totalLab = sorted.reduce((s, t) => s + (parseInt(drafts[t.id]?.labHours ?? '') || 0), 0)
  const totalSeminar = sorted.reduce((s, t) => s + (parseInt(drafts[t.id]?.seminarHours ?? '') || 0), 0)
  const totalIndependent = sorted.reduce((s, t) => s + (parseInt(drafts[t.id]?.independentHours ?? '') || 0), 0)
  const totalConsultation = sorted.reduce((s, t) => s + (parseInt(drafts[t.id]?.consultationHours ?? '') || 0), 0)
  const totalAll = totalLecture + totalPractical + totalLab + totalSeminar + totalIndependent + totalConsultation
  const totalCanonical = sorted.reduce((s, t) => s + t.componentTerm.hours, 0)

  return (
    <div className="relative overflow-x-auto">
      {/* Saving indicator */}
      {updateTerm.isPending && (
        <div className="absolute top-2 right-3 text-xs text-muted-foreground animate-pulse z-10">
          Збереження…
        </div>
      )}

      {/* Legend */}
      {!isReadOnly && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/10 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <StatusDot status="complete" /> Заповнено
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot status="partial" /> Частково
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot status="error" /> Перевищено
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot status="empty" /> Не заповнено
          </span>
          <span className="ml-auto italic">
            Год.* — загальний обсяг за навчальним планом (не редагується)
          </span>
        </div>
      )}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/40 text-xs text-muted-foreground">
            {/* Readonly info */}
            <th className="text-left px-3 py-2 font-medium whitespace-nowrap min-w-[180px]">
              Компонент
            </th>
            <th className="text-center px-2 py-2 font-medium whitespace-nowrap">Сем.</th>
            <th className="text-center px-2 py-2 font-medium whitespace-nowrap">
              Год.*
            </th>
            <th className="text-center px-2 py-2 font-medium whitespace-nowrap">ЄКТС</th>
            <th className="text-center px-2 py-2 font-medium whitespace-nowrap">Контр.</th>
            {/* Separator */}
            <th className="w-px bg-border" />
            {/* Editable distribution */}
            <th className="text-center px-1 py-2 font-medium whitespace-nowrap">Лекц.</th>
            <th className="text-center px-1 py-2 font-medium whitespace-nowrap">Практ.</th>
            <th className="text-center px-1 py-2 font-medium whitespace-nowrap">Лаб.</th>
            <th className="text-center px-1 py-2 font-medium whitespace-nowrap">Семін.</th>
            <th className="text-center px-1 py-2 font-medium whitespace-nowrap">СРС</th>
            <th className="text-center px-1 py-2 font-medium whitespace-nowrap">Конс.</th>
            {/* Computed total */}
            <th className="text-center px-2 py-2 font-medium whitespace-nowrap">Разом</th>
            {/* Remainder to canonical */}
            <th
              className="text-center px-2 py-2 font-medium whitespace-nowrap text-muted-foreground/70"
              title="Залишок до нормативного обсягу (норматив − розподілено)"
            >
              Залиш.
            </th>
            {/* Weekly hours */}
            <th className="text-center px-1 py-2 font-medium whitespace-nowrap text-muted-foreground/70">
              Тижд.Л
            </th>
            <th className="text-center px-1 py-2 font-medium whitespace-nowrap text-muted-foreground/70">
              Тижд.П
            </th>
            {/* Status */}
            <th className="px-2 py-2 w-6" />
          </tr>
        </thead>

        <tbody>
          {sorted.map((t) => {
            const draft = drafts[t.id]
            const canonical = t.componentTerm.hours
            const status = draft ? rowStatus(canonical, draft) : 'empty'
            const sum = draft ? draftSum(draft) : 0
            const isOver = sum > canonical

            return (
              <tr
                key={t.id}
                className={cn(
                  'border-t border-border/60 hover:bg-muted/20',
                  isOver && 'bg-red-50/50 dark:bg-red-950/10',
                )}
              >
                {/* Component name */}
                <td className="px-3 py-1.5 max-w-[220px]">
                  <div className="flex flex-col gap-0">
                    {t.componentTerm.component.code && (
                      <span className="font-mono text-xs text-muted-foreground leading-none">
                        {t.componentTerm.component.code}
                      </span>
                    )}
                    <span className="text-sm truncate leading-snug">
                      {t.componentTerm.component.name}
                    </span>
                    {t.componentTerm.component.componentType !== 'DISCIPLINE' && (
                      <span className="text-xs text-muted-foreground/70 italic leading-none">
                        {COMPONENT_TYPE_LABELS[t.componentTerm.component.componentType]}
                      </span>
                    )}
                  </div>
                </td>

                {/* Semester (readonly) */}
                <td className="px-2 py-1.5 text-center font-mono text-sm text-muted-foreground">
                  {t.componentTerm.semesterNumber}
                </td>

                {/* Canonical hours (readonly) */}
                <td className="px-2 py-1.5 text-center font-mono text-sm font-medium text-muted-foreground">
                  {canonical}
                </td>

                {/* ECTS (readonly) */}
                <td className="px-2 py-1.5 text-center font-mono text-sm text-muted-foreground">
                  {t.componentTerm.ects}
                </td>

                {/* Control form (readonly) */}
                <td className="px-2 py-1.5 text-center text-xs text-muted-foreground">
                  {t.componentTerm.controlForm
                    ? CONTROL_FORM_SHORT[t.componentTerm.controlForm]
                    : '—'}
                </td>

                {/* Separator */}
                <td className="w-px bg-border/40" />

                {/* Editable: lecture */}
                {draft ? (
                  <>
                    <EditCell
                      value={draft.lectureHours}
                      onChange={(v) => setField(t.id, 'lectureHours', v)}
                      onBlur={() => handleBlur(t.id)}
                      disabled={isReadOnly}
                      invalid={isOver}
                    />
                    <EditCell
                      value={draft.practicalHours}
                      onChange={(v) => setField(t.id, 'practicalHours', v)}
                      onBlur={() => handleBlur(t.id)}
                      disabled={isReadOnly}
                      invalid={isOver}
                    />
                    <EditCell
                      value={draft.labHours}
                      onChange={(v) => setField(t.id, 'labHours', v)}
                      onBlur={() => handleBlur(t.id)}
                      disabled={isReadOnly}
                      invalid={isOver}
                    />
                    <EditCell
                      value={draft.seminarHours}
                      onChange={(v) => setField(t.id, 'seminarHours', v)}
                      onBlur={() => handleBlur(t.id)}
                      disabled={isReadOnly}
                      invalid={isOver}
                    />
                    <EditCell
                      value={draft.independentHours}
                      onChange={(v) => setField(t.id, 'independentHours', v)}
                      onBlur={() => handleBlur(t.id)}
                      disabled={isReadOnly}
                      invalid={isOver}
                    />
                    <EditCell
                      value={draft.consultationHours}
                      onChange={(v) => setField(t.id, 'consultationHours', v)}
                      onBlur={() => handleBlur(t.id)}
                      disabled={isReadOnly}
                      invalid={isOver}
                    />
                  </>
                ) : (
                  // Draft not yet initialized — show placeholder cells
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <td key={i} className="px-1 py-1 text-center font-mono text-xs text-muted-foreground/40">—</td>
                    ))}
                  </>
                )}

                {/* Computed sum */}
                <td
                  className={cn(
                    'px-2 py-1.5 text-center font-mono text-sm font-semibold',
                    isOver && 'text-red-600 dark:text-red-400',
                    !isOver && sum > 0 && sum === canonical && 'text-emerald-600 dark:text-emerald-400',
                    sum === 0 && 'text-muted-foreground/40',
                  )}
                >
                  {sum > 0 ? sum : '—'}
                  {isOver && (
                    <span className="ml-1 text-xs font-normal">
                      (+{sum - canonical})
                    </span>
                  )}
                </td>

                {/* Remainder to canonical: canonical − sum */}
                {(() => {
                  const rem = canonical - sum
                  return (
                    <td
                      className="px-2 py-1.5 text-center font-mono text-xs"
                      title={`Залишок: ${rem} год. до нормативу ${canonical} год.`}
                    >
                      {sum === 0 ? (
                        // Haven't started — show full canonical in gray
                        <span className="text-muted-foreground/40">{canonical}</span>
                      ) : rem === 0 ? (
                        // Fully distributed
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓</span>
                      ) : rem > 0 ? (
                        // Partial — hours still to distribute
                        <span className="text-amber-600 dark:text-amber-400">{rem}</span>
                      ) : (
                        // Over canonical
                        <span className="text-red-600 dark:text-red-400 font-semibold">{rem}</span>
                      )}
                    </td>
                  )
                })()}

                {/* Weekly lecture hours */}
                {draft ? (
                  <>
                    <EditCell
                      value={draft.weeklyLectureHours}
                      onChange={(v) => setField(t.id, 'weeklyLectureHours', v)}
                      onBlur={() => handleBlur(t.id)}
                      disabled={isReadOnly}
                      isDecimal
                    />
                    <EditCell
                      value={draft.weeklyPracticalHours}
                      onChange={(v) => setField(t.id, 'weeklyPracticalHours', v)}
                      onBlur={() => handleBlur(t.id)}
                      disabled={isReadOnly}
                      isDecimal
                    />
                  </>
                ) : (
                  <>
                    <td className="px-1 py-1 text-center text-muted-foreground/40 text-xs">—</td>
                    <td className="px-1 py-1 text-center text-muted-foreground/40 text-xs">—</td>
                  </>
                )}

                {/* Status dot */}
                <td className="px-2 py-1.5 text-center">
                  <StatusDot status={status} />
                </td>
              </tr>
            )
          })}
        </tbody>

        {/* Footer totals */}
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/40 font-semibold text-sm">
            <td className="px-3 py-2" colSpan={2}>
              Всього
            </td>
            <td className="px-2 py-2 text-center font-mono text-muted-foreground">
              {totalCanonical}
            </td>
            <td colSpan={3} />
            <td className="px-1 py-2 text-center font-mono">{totalLecture || '—'}</td>
            <td className="px-1 py-2 text-center font-mono">{totalPractical || '—'}</td>
            <td className="px-1 py-2 text-center font-mono">{totalLab || '—'}</td>
            <td className="px-1 py-2 text-center font-mono">{totalSeminar || '—'}</td>
            <td className="px-1 py-2 text-center font-mono">{totalIndependent || '—'}</td>
            <td className="px-1 py-2 text-center font-mono">{totalConsultation || '—'}</td>
            <td className="px-2 py-2 text-center font-mono font-bold">{totalAll || '—'}</td>
            {/* Footer remainder: total canonical − total distributed */}
            <td className="px-2 py-2 text-center font-mono text-xs">
              {totalAll === 0 ? (
                <span className="text-muted-foreground/40">{totalCanonical}</span>
              ) : totalAll === totalCanonical ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              ) : totalAll < totalCanonical ? (
                <span className="text-amber-600 dark:text-amber-400">{totalCanonical - totalAll}</span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-bold">{totalCanonical - totalAll}</span>
              )}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

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
        <span>Семестри: {wc.semesterNumbers.join(', ')}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Users size={11} />
          {wc._count?.groupAssignments ?? 0} груп
        </span>
      </div>
    </button>
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
  const deleteWorking = useDeleteWorkingCurriculum()

  // Auto-select first when data loads
  const effectiveSelected = selectedId ?? workingCurricula[0]?.id ?? null
  const selectedWc = workingCurricula.find((w) => w.id === effectiveSelected)

  // After delete: clear selection so auto-select picks next available
  const handleDelete = (id: string) => {
    deleteWorking.mutate(id, {
      onSuccess: () => setSelectedId(null),
    })
  }

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
              {/* Actions bar */}
              {canManage && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20 flex-wrap">
                  {/* Approve */}
                  {selectedWc?.isApproved === false && (() => {
                    // isEmpty: use backend field if available, fallback to count proxy
                    const isEmpty = selectedWc.isEmpty ?? (selectedWc._count.componentTerms === 0)
                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={approveWorking.isPending || isEmpty}
                          title={
                            isEmpty
                              ? 'Неможливо затвердити порожній план — спочатку внесіть розподіл годин'
                              : undefined
                          }
                          onClick={() => approveWorking.mutate(effectiveSelected)}
                        >
                          <CheckCircle size={14} />
                          Затвердити
                        </Button>
                        {isEmpty && (
                          <span className="text-xs text-muted-foreground">
                            Розподіл годин не внесено
                          </span>
                        )}
                      </div>
                    )
                  })()}

                  {/* Approved label */}
                  {selectedWc?.isApproved && (
                    <span className="text-xs text-muted-foreground">
                      Затверджений план — редагування заблоковано
                    </span>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Delete — only for empty unapproved plans */}
                  {selectedWc && !selectedWc.isApproved && (selectedWc.isEmpty ?? (selectedWc._count.componentTerms === 0)) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deleteWorking.isPending}
                        >
                          <Trash2 size={14} />
                          Видалити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Видалити робочий план?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Робочий план за <strong>{selectedWc.academicYear}</strong> буде
                            безповоротно видалено. Це можливо лише поки план порожній і не
                            введений в роботу.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(effectiveSelected)}
                          >
                            Видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}

              <HourDistributionTable
                workingId={effectiveSelected}
                canEdit={canManage && !(selectedWc?.isApproved ?? false)}
              />
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
