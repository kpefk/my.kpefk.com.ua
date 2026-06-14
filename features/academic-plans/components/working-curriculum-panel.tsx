'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  useApproveWorkingCurriculum,
  useAssignTeacherToTerm,
  useDeleteWorkingCurriculum,
  useInitializeWorkingCurriculumTerms,
  useUpdateWorkingComponentTerm,
  useWorkingCurriculum,
  useWorkingCurricula,
} from '../api'
import { useTeachers } from '../../teachers/api'
import { DEFAULT_FILTERS } from '../../teachers/types'
import {
  COMPONENT_TYPE_LABELS,
  type ComponentType,
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
    <td className={cn('border border-gray-300 p-0 text-center align-middle', invalid && 'bg-red-50/40 dark:bg-red-950/10')}>
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
          'w-full text-center font-mono text-[11px] bg-transparent outline-none py-1.5 px-0.5',
          !disabled && 'focus:bg-blue-50/30 dark:focus:bg-blue-950/10',
          disabled && 'cursor-default',
          invalid && 'text-red-600 dark:text-red-400',
        )}
      />
    </td>
  )
}

// ─── Teacher cell (per-component row) ────────────────────────────────────────

/**
 * Клітинка вибору викладача для рядка компонента.
 * Показує прізвище+ініціали або "—". При натисканні відкриває пошук.
 * Використовує перший термін компонента для запису (teacherId однаковий для всіх термів компонента;
 * якщо ні — показує перший знайдений).
 */
function TeacherCell({
  termIds,
  currentTeacher,
  workingCurriculumId,
  disabled,
}: {
  termIds: string[]          // всі term.id компонента (для масового оновлення)
  currentTeacher: { id: string; firstName: string; lastName: string; middleName: string | null } | null
  workingCurriculumId: string
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const assign = useAssignTeacherToTerm()
  const { data: teachers } = useTeachers(DEFAULT_FILTERS)

  const filtered = (teachers ?? []).filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.lastName.toLowerCase().includes(q) ||
      t.firstName.toLowerCase().includes(q) ||
      (t.middleName ?? '').toLowerCase().includes(q)
    )
  }).slice(0, 20)

  function shortName(t: { firstName: string; lastName: string; middleName: string | null }): string {
    const i = t.firstName[0] ?? ''
    const p = t.middleName?.[0] ?? ''
    return `${t.lastName} ${i}.${p ? `${p}.` : ''}`
  }

  function handleSelect(teacherId: string | null) {
    const firstId = termIds[0]
    if (firstId === undefined) return
    assign.mutate({ termId: firstId, workingCurriculumId, teacherId })
    setOpen(false)
    setSearch('')
  }

  if (disabled) {
    return (
      <td className="border border-gray-300 px-1 py-1.5 text-center align-middle text-[10px] text-gray-600 whitespace-nowrap">
        {currentTeacher !== null ? shortName(currentTeacher) : '—'}
      </td>
    )
  }

  return (
    <td className="border border-gray-300 px-0.5 py-1 align-middle relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch('') }}
        className={cn(
          'w-full text-left text-[10px] px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
          currentTeacher !== null ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 italic',
        )}
      >
        {currentTeacher !== null ? shortName(currentTeacher) : 'призначити…'}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-0.5 w-56 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow-lg text-[11px]">
          <div className="p-1 border-b border-gray-200 dark:border-gray-700">
            <input
              autoFocus
              type="text"
              placeholder="Пошук…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-transparent outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {currentTeacher !== null && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="w-full text-left px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Зняти призначення
                </button>
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-2 py-1 text-gray-400 italic">Нікого не знайдено</li>
            )}
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  className={cn(
                    'w-full text-left px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-950/20',
                    currentTeacher?.id === t.id && 'font-semibold bg-blue-50/50 dark:bg-blue-950/10',
                  )}
                >
                  {shortName(t)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
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

  // Backend delivers rows in curriculum plan order: section.orderIndex → component.orderIndex → semesterNumber.
  // No client-side reordering — preserving the plan sequence from the server.
  const sorted = [...wc.componentTerms]

  // ── Per-semester totals (footer) and component-grouped rows ─────────────────

  type SemTotal = {
    audTotal: number; lecture: number; practicalLab: number; seminar: number
    srsTotal: number; sprs: number; prep: number
  }

  const semesters = wc.semesterNumbers
  const nSems = semesters.length
  const totalCanonical = sorted.reduce((s, t) => s + t.componentTerm.hours, 0)
  const totalEctsAll = sorted.reduce((s, t) => s + parseFloat(t.componentTerm.ects), 0)

  const semTotals = new Map<number, SemTotal>(
    semesters.map((s) => [s, { audTotal: 0, lecture: 0, practicalLab: 0, seminar: 0, srsTotal: 0, sprs: 0, prep: 0 }]),
  )
  for (const t of sorted) {
    const entry = semTotals.get(t.componentTerm.semesterNumber)
    if (entry === undefined) continue
    const d = drafts[t.id]
    if (d === undefined) continue
    const lec = parseInt(d.lectureHours) || 0
    const prac = parseInt(d.practicalHours) || 0
    const lab_ = parseInt(d.labHours) || 0
    const sem_ = parseInt(d.seminarHours) || 0
    const ind = parseInt(d.independentHours) || 0
    const con = parseInt(d.consultationHours) || 0
    entry.audTotal += lec + prac + lab_ + sem_
    entry.lecture += lec; entry.practicalLab += prac + lab_; entry.seminar += sem_
    entry.srsTotal += ind + con; entry.sprs += ind; entry.prep += con
  }

  // Group terms by component, preserving curriculum section/component order
  type ComponentRow = {
    componentId: string
    code: string | null
    name: string
    componentType: ComponentType
    termsBySemester: Map<number, WorkingComponentTermDto>
  }
  const rows: ComponentRow[] = []
  const rowMap = new Map<string, ComponentRow>()
  for (const t of sorted) {
    const cid = t.componentTerm.component.id
    const existing = rowMap.get(cid)
    if (existing !== undefined) {
      existing.termsBySemester.set(t.componentTerm.semesterNumber, t)
    } else {
      const row: ComponentRow = {
        componentId: cid,
        code: t.componentTerm.component.code,
        name: t.componentTerm.component.name,
        componentType: t.componentTerm.component.componentType,
        termsBySemester: new Map([[t.componentTerm.semesterNumber, t]]),
      }
      rowMap.set(cid, row)
      rows.push(row)
    }
  }

  // Roman ordinals for semester labels
  const ORDINAL: Record<number, string> = {
    1: 'І', 2: 'ІІ', 3: 'ІІІ', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII',
  }

  return (
    <div className="relative overflow-x-auto">
      {updateTerm.isPending && (
        <div className="absolute top-1 right-2 text-[10px] text-gray-500 animate-pulse z-10">
          Збереження…
        </div>
      )}

      {!isReadOnly && (
        <div className="flex items-center gap-3 px-3 py-1 border-b border-gray-300 bg-gray-50 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><StatusDot status="complete" /> Заповнено</span>
          <span className="flex items-center gap-1"><StatusDot status="partial" /> Частково</span>
          <span className="flex items-center gap-1"><StatusDot status="error" /> Перевищено</span>
          <span className="flex items-center gap-1"><StatusDot status="empty" /> Не заповнено</span>
        </div>
      )}

      {/*
        Left (7): Код | Назва | Екз | Зал | КП/КР | ЄКТС | Год
        Per-semester (8 × n): AudΣ | Лекц | Практ | Лаб | Семін | СрсΣ | СПРС | Підгот
        Weekly (n): Год/тижд per semester
        Status (1): ●
        Total: 8 + 9n
      */}
      <table className="w-full text-[11px] border-collapse">
        <thead className="text-center text-[10px] font-semibold bg-gray-100">

          {/* ── Row 1: top-level group headers ── */}
          <tr>
            <th rowSpan={3} className="border border-gray-400 px-0.5 py-0.5 align-middle w-10">
              Код
            </th>
            <th rowSpan={3} className="border border-gray-400 px-1 py-0.5 text-left align-middle min-w-[120px] w-[120px]">
              Назва освітнього компонента /<br />навчального предмета
            </th>
            <th colSpan={3} className="border border-gray-400 px-0.5 py-0.5 leading-tight">
              Розподіл за<br />семестрами
            </th>
            <th rowSpan={3} className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-7 whitespace-nowrap">
              Кредити ЄКТС
            </th>
            <th rowSpan={3} className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-8 whitespace-nowrap" title="Загальний нормативний обсяг годин">
              Години
            </th>
            {semesters.map((sem) => (
              <th key={sem} colSpan={7} className="border border-gray-400 px-0.5 py-0.5 leading-tight">
                {ORDINAL[sem] ?? String(sem)} семестр — Кількість годин
              </th>
            ))}
            <th colSpan={nSems} className="border border-gray-400 px-0.5 py-0.5 leading-tight font-normal text-gray-600">
              Розподіл навч.<br />роботи
            </th>
            <th rowSpan={4} className="border border-gray-400 p-0.5 align-middle text-left min-w-[80px] w-[80px] font-normal text-gray-700 leading-tight whitespace-nowrap">
              Викладач
            </th>
            <th rowSpan={4} className="border border-gray-400 w-5" />
          </tr>

          {/* ── Row 2: sub-group headers ── */}
          <tr>
            <th rowSpan={2} className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-7 font-normal">Екзамени</th>
            <th rowSpan={2} className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-7 font-normal">Заліки</th>
            <th rowSpan={2} className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-7 font-normal">КП / КР</th>
            {semesters.map((sem) => (
              <Fragment key={sem}>
                <th colSpan={4} className="border border-gray-400 px-0.5 py-0.5">Аудиторних</th>
                <th colSpan={3} className="border border-gray-400 px-0.5 py-0.5">Самостійної роботи</th>
              </Fragment>
            ))}
            {semesters.map((sem) => (
              <th key={sem} rowSpan={2} className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-7 font-normal text-gray-600">
                {ORDINAL[sem] ?? String(sem)} сем. год/тижд
              </th>
            ))}
          </tr>

          {/* ── Row 3: leaf column headers ── */}
          <tr>
            {semesters.map((sem) => (
              <Fragment key={sem}>
                <th className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-8 font-bold">Всього</th>
                <th className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-8">Лекції</th>
                <th className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-8">Практ./Лаб.</th>
                <th className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-8">Семінарські</th>
                <th className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-8 font-bold">Всього</th>
                <th className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-8">СПРС</th>
                <th className="border border-gray-400 p-0.5 align-bottom [writing-mode:vertical-rl] rotate-180 w-8">Підготовка до іспиту</th>
              </Fragment>
            ))}
          </tr>

          {/* ── Row 4: column numbers ── */}
          <tr className="font-normal text-gray-400 text-[9px]">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <td key={n} className="border border-gray-400 py-0.5 text-center">{n}</td>
            ))}
            {semesters.flatMap((sem, si) =>
              [8, 9, 10, 11, 12, 13, 14].map((base) => (
                <td key={`${sem}-${base}`} className="border border-gray-400 py-0.5 text-center">
                  {base + si * 7}
                </td>
              )),
            )}
            {semesters.map((_, si) => (
              <td key={si} className="border border-gray-400 py-0.5 text-center">
                {8 + nSems * 7 + si}
              </td>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const allTerms = semesters.flatMap((s) => {
              const t = row.termsBySemester.get(s)
              return t !== undefined ? [t] : []
            })

            const totalRowEcts = allTerms.reduce((s, t) => s + parseFloat(t.componentTerm.ects), 0)
            const totalRowHours = allTerms.reduce((s, t) => s + t.componentTerm.hours, 0)
            const ectsDisplay =
              totalRowEcts % 1 === 0 ? String(Math.round(totalRowEcts)) : totalRowEcts.toFixed(1)

            const examSems = allTerms
              .filter((t) => t.componentTerm.controlForm === 'EXAM')
              .map((t) => t.componentTerm.semesterNumber)
            const creditSems = allTerms
              .filter((t) => t.componentTerm.controlForm === 'TEST' || t.componentTerm.controlForm === 'DIFFERENTIATED_TEST')
              .map((t) => t.componentTerm.semesterNumber)
            const courseSems = allTerms
              .filter((t) => t.componentTerm.controlForm === 'COURSE_WORK' || t.componentTerm.controlForm === 'COURSE_PROJECT')
              .map((t) => t.componentTerm.semesterNumber)

            const termStatuses = allTerms.map((t) => {
              const d = drafts[t.id]
              return d !== undefined ? rowStatus(t.componentTerm.hours, d) : ('empty' as RowStatus)
            })
            const rowSt: RowStatus = termStatuses.includes('error')
              ? 'error'
              : termStatuses.every((s) => s === 'complete')
                ? 'complete'
                : termStatuses.every((s) => s === 'empty')
                  ? 'empty'
                  : 'partial'

            return (
              <tr key={row.componentId} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">

                {/* ── Left block ── */}
                <td className="border border-gray-300 px-1 py-1.5 text-center font-mono align-middle whitespace-nowrap">
                  {row.code ?? ''}
                </td>
                <td className="border border-gray-300 px-1.5 py-1.5 align-middle w-[120px] min-w-[120px]">
                  {row.name}
                  {row.componentType !== 'DISCIPLINE' && (
                    <span className="text-[10px] text-gray-400 italic ml-1">
                      ({COMPONENT_TYPE_LABELS[row.componentType]})
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-0.5 py-1.5 text-center font-mono align-middle text-gray-700">
                  {examSems.join(',')}
                </td>
                <td className="border border-gray-300 px-0.5 py-1.5 text-center font-mono align-middle text-gray-700">
                  {creditSems.join(',')}
                </td>
                <td className="border border-gray-300 px-0.5 py-1.5 text-center font-mono align-middle text-gray-700">
                  {courseSems.join(',')}
                </td>
                <td className="border border-gray-300 px-0.5 py-1.5 text-center font-mono align-middle">
                  {ectsDisplay}
                </td>
                <td className="border border-gray-300 px-0.5 py-1.5 text-center font-mono align-middle font-semibold">
                  {totalRowHours}
                </td>

                {/* ── Per-semester column groups ── */}
                {semesters.map((sem) => {
                  const term = row.termsBySemester.get(sem)
                  if (term === undefined) {
                    return (
                      <Fragment key={sem}>
                        {Array.from({ length: 7 }, (_, i) => (
                          <td key={i} className="border border-gray-300 px-0.5 py-1.5 text-center text-gray-200 align-middle bg-gray-50/50">—</td>
                        ))}
                      </Fragment>
                    )
                  }
                  const d = drafts[term.id]
                  const lec = d !== undefined ? (parseInt(d.lectureHours) || 0) : term.lectureHours
                  const prac = d !== undefined ? (parseInt(d.practicalHours) || 0) : term.practicalHours
                  const lab_ = d !== undefined ? (parseInt(d.labHours) || 0) : term.labHours
                  const semH = d !== undefined ? (parseInt(d.seminarHours) || 0) : term.seminarHours
                  const ind = d !== undefined ? (parseInt(d.independentHours) || 0) : term.independentHours
                  const con = d !== undefined ? (parseInt(d.consultationHours) || 0) : term.consultationHours
                  const audTotal = lec + prac + lab_ + semH
                  const srsTotal = ind + con
                  const isOver = audTotal + srsTotal > term.componentTerm.hours
                  return (
                    <Fragment key={sem}>
                      {/* Аудиторних Всього — computed display */}
                      <td className={cn(
                        'border border-gray-300 px-0.5 py-1.5 text-center font-mono font-semibold align-middle',
                        isOver ? 'text-red-600 dark:text-red-400' : audTotal > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-gray-300',
                      )}>
                        {audTotal > 0 ? audTotal : '—'}
                      </td>
                      {d !== undefined ? (
                        <>
                          <EditCell value={d.lectureHours} onChange={(v) => setField(term.id, 'lectureHours', v)} onBlur={() => handleBlur(term.id)} disabled={isReadOnly} invalid={isOver} />
                          <EditCell value={toStr(prac + lab_)} onChange={(v) => { setField(term.id, 'practicalHours', v); setField(term.id, 'labHours', '0') }} onBlur={() => handleBlur(term.id)} disabled={isReadOnly} invalid={isOver} />
                          <EditCell value={d.seminarHours} onChange={(v) => setField(term.id, 'seminarHours', v)} onBlur={() => handleBlur(term.id)} disabled={isReadOnly} invalid={isOver} />
                        </>
                      ) : (
                        Array.from({ length: 3 }, (_, i) => (
                          <td key={i} className="border border-gray-300 px-0.5 py-1.5 text-center text-gray-300 align-middle">—</td>
                        ))
                      )}
                      {/* Самостійної Всього — computed display */}
                      <td className={cn(
                        'border border-gray-300 px-0.5 py-1.5 text-center font-mono font-semibold align-middle',
                        srsTotal === 0 ? 'text-gray-300' : '',
                      )}>
                        {srsTotal > 0 ? srsTotal : '—'}
                      </td>
                      {d !== undefined ? (
                        <>
                          <EditCell value={d.independentHours} onChange={(v) => setField(term.id, 'independentHours', v)} onBlur={() => handleBlur(term.id)} disabled={isReadOnly} />
                          <EditCell value={d.consultationHours} onChange={(v) => setField(term.id, 'consultationHours', v)} onBlur={() => handleBlur(term.id)} disabled={isReadOnly} />
                        </>
                      ) : (
                        Array.from({ length: 2 }, (_, i) => (
                          <td key={i} className="border border-gray-300 px-0.5 py-1.5 text-center text-gray-300 align-middle">—</td>
                        ))
                      )}
                    </Fragment>
                  )
                })}

                {/* ── Розподіл навч. роботи: Год/тижд per semester ── */}
                {semesters.map((sem) => {
                  const term = row.termsBySemester.get(sem)
                  if (term === undefined) {
                    return <td key={sem} className="border border-gray-300 px-0.5 py-1.5 text-center text-gray-200 align-middle bg-gray-50/50">—</td>
                  }
                  const d = drafts[term.id]
                  if (d === undefined) {
                    return <td key={sem} className="border border-gray-300 px-0.5 py-1.5 text-center text-gray-300 align-middle">—</td>
                  }
                  return (
                    <EditCell key={sem} value={d.weeklyLectureHours} onChange={(v) => setField(term.id, 'weeklyLectureHours', v)} onBlur={() => handleBlur(term.id)} disabled={isReadOnly} isDecimal />
                  )
                })}

                {/* ── Викладач ── */}
                <TeacherCell
                  termIds={allTerms.map((t) => t.id)}
                  currentTeacher={allTerms[0]?.teacher ?? null}
                  workingCurriculumId={wc.id}
                  disabled={isReadOnly}
                />

                {/* ── Status ── */}
                <td className="border border-gray-300 px-1 py-1.5 text-center align-middle">
                  <StatusDot status={rowSt} />
                </td>
              </tr>
            )
          })}
        </tbody>

        <tfoot>
          <tr className="bg-gray-100 font-semibold text-[11px] border-t-2 border-gray-400">
            <td colSpan={2} className="border border-gray-400 px-1 py-0.5 font-bold">Разом</td>
            <td colSpan={3} className="border border-gray-400" />
            <td className="border border-gray-400 p-0 text-center font-mono text-gray-600">
              {totalEctsAll % 1 === 0 ? String(Math.round(totalEctsAll)) : totalEctsAll.toFixed(1)}
            </td>
            <td className="border border-gray-400 p-0 text-center font-mono text-gray-600">{totalCanonical}</td>
            {semesters.map((sem) => {
              const t = semTotals.get(sem)
              if (t === undefined) {
                return (
                  <Fragment key={sem}>
                    {Array.from({ length: 7 }, (_, i) => <td key={i} className="border border-gray-400" />)}
                  </Fragment>
                )
              }
              return (
                <Fragment key={sem}>
                  <td className="border border-gray-400 p-0 text-center font-mono font-bold">{t.audTotal || '—'}</td>
                  <td className="border border-gray-400 p-0 text-center font-mono">{t.lecture || '—'}</td>
                  <td className="border border-gray-400 p-0 text-center font-mono">{t.practicalLab || '—'}</td>
                  <td className="border border-gray-400 p-0 text-center font-mono">{t.seminar || '—'}</td>
                  <td className="border border-gray-400 p-0 text-center font-mono font-bold">{t.srsTotal || '—'}</td>
                  <td className="border border-gray-400 p-0 text-center font-mono">{t.sprs || '—'}</td>
                  <td className="border border-gray-400 p-0 text-center font-mono">{t.prep || '—'}</td>
                </Fragment>
              )
            })}
            <td colSpan={nSems + 2} className="border border-gray-400" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── Working plan tab (compact selector) ─────────────────────────────────────

interface WorkingTabProps {
  wc: WorkingCurriculumSummaryDto
  isSelected: boolean
  onClick: () => void
}

function WorkingTab({ wc, isSelected, onClick }: WorkingTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      )}
    >
      <span className="font-mono">{wc.academicYear}</span>
      {wc.isApproved ? (
        <CheckCircle size={12} className={cn(isSelected ? 'text-primary-foreground/70' : 'text-emerald-500')} />
      ) : (
        <Clock size={12} className="opacity-50" />
      )}
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

  const effectiveSelected = selectedId ?? workingCurricula[0]?.id ?? null
  const selectedWc = workingCurricula.find((w) => w.id === effectiveSelected)

  const handleDelete = (id: string) => {
    deleteWorking.mutate(id, { onSuccess: () => setSelectedId(null) })
  }

  return (
    <div className="flex flex-col gap-0">

      {/* ── Toolbar row 1: plan tabs + create ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-3 border-b border-border bg-muted/20">
        {/* Plan selector tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {isLoading && (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-md" />
            ))
          )}
          {!isLoading && workingCurricula.length === 0 && (
            <span className="text-sm text-muted-foreground">Немає робочих планів</span>
          )}
          {!isLoading && workingCurricula.map((wc) => (
            <WorkingTab
              key={wc.id}
              wc={wc}
              isSelected={effectiveSelected === wc.id}
              onClick={() => setSelectedId(wc.id)}
            />
          ))}
        </div>

        <div className="flex-1" />

        {canManage && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus size={14} />
            Новий план
          </Button>
        )}
      </div>

      {/* ── Toolbar row 2: selected plan info + actions ── */}
      {effectiveSelected && selectedWc && (
        <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-2 border-b border-border text-sm">
          {/* Info */}
          <span className="text-muted-foreground text-xs">
            Семестри:&nbsp;{selectedWc.semesterNumbers.join(', ')}
          </span>
          <span className="text-border text-xs">·</span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <Users size={11} />
            {selectedWc.activeGroupCount ?? 0} груп
          </span>

          <div className="flex-1" />

          {/* Actions */}
          {canManage && (() => {
            const isEmpty = selectedWc.isEmpty ?? (selectedWc._count.componentTerms === 0)

            if (selectedWc.isApproved) {
              return (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle size={13} />
                  Затверджено
                </span>
              )
            }

            return (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={approveWorking.isPending || isEmpty}
                  title={isEmpty ? 'Спочатку внесіть розподіл годин' : undefined}
                  onClick={() => approveWorking.mutate(effectiveSelected)}
                >
                  <CheckCircle size={14} />
                  Затвердити
                </Button>

                {isEmpty && (
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
            )
          })()}
        </div>
      )}

      {/* ── Full-width hour distribution table ── */}
      {effectiveSelected ? (
        <HourDistributionTable
          workingId={effectiveSelected}
          canEdit={canManage && !(selectedWc?.isApproved ?? false)}
        />
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <CalendarDays size={36} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {workingCurricula.length === 0
                ? 'Створіть перший робочий план для цієї версії'
                : 'Оберіть робочий план зі списку'}
            </p>
            {canManage && workingCurricula.length === 0 && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDialogOpen(true)}>
                <Plus size={13} />
                Створити
              </Button>
            )}
          </div>
        )
      )}

      <CreateWorkingCurriculumDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        versionId={versionId}
        maxSemesters={maxSemesters}
      />
    </div>
  )
}
