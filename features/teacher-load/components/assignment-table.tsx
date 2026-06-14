'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  RotateCcw,
  SplitSquareHorizontal,
  UserX,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeachers } from '@/features/teachers/api'
import { DEFAULT_FILTERS } from '@/features/teachers/types'
import { cn } from '@/lib/utils'

import {
  useAssignments,
  useGenerateAssignments,
  useSetDistributionMode,
  useUpdateLessonAssignment,
  useUpdateSubjectAssignment,
} from '../api'
import {
  LESSON_TYPE_LABELS,
  teacherRefShortName,
  type LessonAssignmentDto,
  type LessonType,
  type LoadDistributionMode,
  type SubjectAssignmentDto,
  type TeacherRefDto,
} from '../types'
import { useUser } from '@/store/auth.store'

import { ConfirmOrderDialog } from './confirm-order-dialog'
import { RevokeOrderDialog } from './revoke-order-dialog'

// ─── Dropdown dismiss hook ────────────────────────────────────────────────────

/** Закриває дропдаун при кліку поза ним або натисканні Esc. */
function useDismissable(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function onDocPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
  return ref
}

// ─── Sticky column layout ─────────────────────────────────────────────────────

const NUM_W = 32
const CODE_W = 52
const NAME_W = 220
const CODE_LEFT = NUM_W
const NAME_LEFT = NUM_W + CODE_W

// ─── Lesson type columns ──────────────────────────────────────────────────────

const LESSON_COLS: { type: LessonType; label: string; title: string }[] = [
  { type: 'LECTURE',      label: 'Лек.',   title: 'Лекції' },
  { type: 'PRACTICE',     label: 'Практ.', title: 'Практичні заняття' },
  { type: 'LAB',          label: 'Лаб.',   title: 'Лабораторні заняття' },
  { type: 'SEMINAR',      label: 'Семін.', title: 'Семінарські заняття' },
  { type: 'CONSULTATION', label: 'Конс.',  title: 'Консультації' },
  { type: 'SPRS',         label: 'СПРС',   title: 'Самостійна робота студентів' },
]

// ─── TH / TD primitives ───────────────────────────────────────────────────────

interface CellProps {
  children?: React.ReactNode
  className?: string
  colSpan?: number
  rowSpan?: number
  style?: React.CSSProperties
  onClick?: () => void
}

function TH({ children, className, colSpan, rowSpan, style }: CellProps) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={style}
      className={cn(
        'px-2 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap border-b border-border bg-card',
        className,
      )}
    >
      {children}
    </th>
  )
}

function TD({ children, className, colSpan, style, onClick }: CellProps) {
  return (
    <td
      colSpan={colSpan}
      style={style}
      onClick={onClick}
      className={cn('px-2 py-1.5 text-xs border-b border-border/50', className)}
    >
      {children}
    </td>
  )
}

const DASH = <span className="text-muted-foreground/30">—</span>

// ─── Grouping by componentId ──────────────────────────────────────────────────

interface ComponentGroup {
  key: string          // componentId
  componentId: string
  componentCode: string | null
  componentName: string
  /** Sorted semester numbers */
  semesters: number[]
  /** Sum of totalHours across all SAs */
  totalHours: number
  /** Sum of hours per lesson type (regular + first-subgroup when only subgroup rows exist) */
  hoursByType: Partial<Record<LessonType, number>>
  /** Whether any SA has subgroup lessons */
  hasSubgroups: boolean
  /** 'none' | 'assigned' | 'mixed' — teacher state across all semesters */
  teacherState: 'none' | 'assigned' | 'mixed'
  subjects: SubjectAssignmentDto[]
  representativeSubject: SubjectAssignmentDto
}

function getHoursForType(sa: SubjectAssignmentDto, type: LessonType): number {
  const all = sa.lessons.filter((l) => l.lessonType === type)
  if (all.length === 0) return 0
  const regular = all.find((l) => l.subgroupNumber === null)
  return regular !== undefined ? regular.hours : (all[0]?.hours ?? 0)
}

function buildGroups(subjects: SubjectAssignmentDto[]): ComponentGroup[] {
  const order: string[] = []
  const map = new Map<string, SubjectAssignmentDto[]>()

  for (const sa of subjects) {
    if (!map.has(sa.componentId)) {
      order.push(sa.componentId)
      map.set(sa.componentId, [])
    }
    map.get(sa.componentId)!.push(sa)
  }

  return order.map((componentId) => {
    const group = map.get(componentId)!
    const first = group[0]!
    const semesters = group.map((sa) => sa.semesterNumber).sort((a, b) => a - b)
    const totalHours = group.reduce((s, sa) => s + sa.totalHours, 0)

    const hoursByType: Partial<Record<LessonType, number>> = {}
    for (const col of LESSON_COLS) {
      const sum = group.reduce((s, sa) => s + getHoursForType(sa, col.type), 0)
      if (sum > 0) hoursByType[col.type] = sum
    }

    const hasSubgroups = group.some((sa) => sa.lessons.some((l) => l.subgroupNumber !== null))

    const primaryIds = [...new Set(group.map((sa) => sa.primaryTeacher?.id ?? null))]
    const teacherState: ComponentGroup['teacherState'] =
      primaryIds.length === 1
        ? primaryIds[0] === null ? 'none' : 'assigned'
        : 'mixed'

    return {
      key: componentId,
      componentId,
      componentCode: first.componentCode,
      componentName: first.componentName,
      semesters,
      totalHours,
      hoursByType,
      hasSubgroups,
      teacherState,
      subjects: group,
      representativeSubject: first,
    }
  })
}

/** Sort groups: by code (numeric) then by name. */
function sortGroups(groups: ComponentGroup[]): ComponentGroup[] {
  return [...groups].sort((a, b) => {
    const ca = a.componentCode ?? a.componentName
    const cb = b.componentCode ?? b.componentName
    return ca.localeCompare(cb, 'uk', { numeric: true })
  })
}

// ─── Teacher select cell ──────────────────────────────────────────────────────

function TeacherSelectCell({
  subjectId,
  workingCurriculumId,
  currentTeacher,
  disabled,
}: {
  subjectId: string
  workingCurriculumId: string
  currentTeacher: TeacherRefDto | null
  disabled: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useDismissable(open, () => {
    setOpen(false)
    setSearch('')
  })
  const { data: teachers = [] } = useTeachers(DEFAULT_FILTERS)
  const update = useUpdateSubjectAssignment()

  const filtered = teachers
    .filter((t) => {
      const full = `${t.lastName} ${t.firstName} ${t.middleName ?? ''}`.toLowerCase()
      return full.includes(search.toLowerCase())
    })
    .slice(0, 20)

  const currentLabel = currentTeacher !== null ? teacherRefShortName(currentTeacher) : null

  function assign(primaryTeacherId: string | null) {
    update.mutate({ id: subjectId, workingCurriculumId, primaryTeacherId })
    setOpen(false)
    setSearch('')
  }

  if (disabled) {
    return (
      <span className={cn('text-xs', currentLabel === null && 'text-muted-foreground/50 italic')}>
        {currentLabel ?? '—'}
      </span>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs w-full text-left transition-colors',
          currentLabel === null
            ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            : 'text-foreground hover:bg-muted/60',
        )}
      >
        <span className="flex-1 truncate min-w-0">
          {update.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin inline" />
          ) : (
            currentLabel ?? 'Не призначено'
          )}
        </span>
        <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground/50" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-0.5 w-64 rounded-md border border-border bg-popover shadow-lg">
          <div className="p-1 border-b border-border">
            <input
              autoFocus
              type="text"
              placeholder="Пошук викладача..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-0.5">
            {currentLabel !== null && (
              <li>
                <button
                  type="button"
                  onClick={() => assign(null)}
                  className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-left hover:bg-muted text-amber-600 dark:text-amber-400"
                >
                  <UserX className="w-3 h-3 shrink-0" />
                  Зняти призначення
                </button>
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-2 py-1.5 text-xs text-muted-foreground">Нікого не знайдено</li>
            )}
            {filtered.map((t) => {
              const label = `${t.lastName} ${t.firstName} ${t.middleName ?? ''}`.trim()
              const short = `${t.lastName} ${(t.firstName[0] ?? '')}.${t.middleName ? `${t.middleName[0]}.` : ''}`.trim()
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => assign(t.id)}
                    className={cn(
                      'w-full px-2 py-1 text-xs text-left hover:bg-muted',
                      t.id === currentTeacher?.id && 'bg-blue-50 dark:bg-blue-950/30 font-medium',
                    )}
                    title={label}
                  >
                    {short}
                    {t.positionName !== null && (
                      <span className="ml-1 text-[10px] text-muted-foreground">{t.positionName}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Lesson teacher select cell ───────────────────────────────────────────────

function LessonTeacherSelectCell({
  lesson,
  subjectAssignmentId,
  workingCurriculumId,
  disabled,
}: {
  lesson: LessonAssignmentDto
  subjectAssignmentId: string
  workingCurriculumId: string
  disabled: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useDismissable(open, () => {
    setOpen(false)
    setSearch('')
  })
  const { data: teachers = [] } = useTeachers(DEFAULT_FILTERS)
  const update = useUpdateLessonAssignment()

  const current = lesson.overrideTeacher ?? lesson.effectiveTeacher
  const isOverridden = lesson.overrideTeacher !== null

  const filtered = teachers
    .filter((t) => {
      const full = `${t.lastName} ${t.firstName} ${t.middleName ?? ''}`.toLowerCase()
      return full.includes(search.toLowerCase())
    })
    .slice(0, 20)

  const currentLabel = current !== null ? teacherRefShortName(current) : null

  function assign(overrideTeacherId: string | null) {
    update.mutate({ id: lesson.id, subjectAssignmentId, workingCurriculumId, overrideTeacherId })
    setOpen(false)
    setSearch('')
  }

  if (disabled) {
    return (
      <span className={cn('text-xs', currentLabel === null && 'text-muted-foreground/50 italic')}>
        {currentLabel ?? '—'}
      </span>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs w-full text-left transition-colors',
          currentLabel === null
            ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            : isOverridden
              ? 'text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30'
              : 'text-muted-foreground hover:bg-muted/60',
        )}
      >
        <span className="flex-1 truncate min-w-0">
          {update.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin inline" />
          ) : (
            currentLabel ?? 'Не призначено'
          )}
        </span>
        <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground/50" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-0.5 w-64 rounded-md border border-border bg-popover shadow-lg">
          <div className="p-1 border-b border-border">
            <input
              autoFocus
              type="text"
              placeholder="Пошук викладача..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-0.5">
            {isOverridden && (
              <li>
                <button
                  type="button"
                  onClick={() => assign(null)}
                  className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-left hover:bg-muted text-amber-600 dark:text-amber-400"
                >
                  <UserX className="w-3 h-3 shrink-0" />
                  Зняти заміну (основний)
                </button>
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-2 py-1.5 text-xs text-muted-foreground">Нікого не знайдено</li>
            )}
            {filtered.map((t) => {
              const label = `${t.lastName} ${t.firstName} ${t.middleName ?? ''}`.trim()
              const short = `${t.lastName} ${(t.firstName[0] ?? '')}.${t.middleName ? `${t.middleName[0]}.` : ''}`.trim()
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => assign(t.id)}
                    className={cn(
                      'w-full px-2 py-1 text-xs text-left hover:bg-muted',
                      t.id === current?.id && 'bg-blue-50 dark:bg-blue-950/30 font-medium',
                    )}
                    title={label}
                  >
                    {short}
                    {t.positionName !== null && (
                      <span className="ml-1 text-[10px] text-muted-foreground">{t.positionName}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Distribution mode toggle ─────────────────────────────────────────────────

/** Сегментований перемикач Потік / По групах для одного типу занять. */
function ModeSegmented({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: LoadDistributionMode
  disabled: boolean
  onChange: (mode: LoadDistributionMode) => void
}) {
  const opts: { mode: LoadDistributionMode; text: string }[] = [
    { mode: 'STREAM', text: 'Потік' },
    { mode: 'PER_GROUP', text: 'По групах' },
  ]
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <div className="inline-flex rounded-md border border-border overflow-hidden">
        {opts.map((o) => (
          <button
            key={o.mode}
            type="button"
            disabled={disabled || value === o.mode}
            onClick={() => onChange(o.mode)}
            className={cn(
              'px-2 py-0.5 text-[11px] transition-colors disabled:cursor-default',
              value === o.mode
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted disabled:opacity-100',
            )}
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Рядок керування режимом розподілу практик/лаб для ОК (у розгорнутому блоці). */
function DistributionModeRow({
  group,
  disabled,
}: {
  group: ComponentGroup
  disabled: boolean
}) {
  const rep = group.representativeSubject
  const setMode = useSetDistributionMode()
  const hasPractice = (group.hoursByType.PRACTICE ?? 0) > 0
  const hasLab = (group.hoursByType.LAB ?? 0) > 0
  if (!hasPractice && !hasLab) return null

  const pending = setMode.isPending

  return (
    <tr className="bg-muted/30">
      <TD colSpan={13} className="px-3 py-1.5">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <span className="font-medium text-muted-foreground">Режим розподілу:</span>
          {hasPractice && (
            <ModeSegmented
              label="Практичні"
              value={rep.practiceMode}
              disabled={disabled || pending}
              onChange={(practiceMode) =>
                setMode.mutate({
                  workingCurriculumId: rep.workingCurriculumId,
                  curriculumComponentTermId: rep.curriculumComponentTermId,
                  practiceMode,
                })
              }
            />
          )}
          {hasLab && (
            <ModeSegmented
              label="Лабораторні"
              value={rep.labMode}
              disabled={disabled || pending}
              onChange={(labMode) =>
                setMode.mutate({
                  workingCurriculumId: rep.workingCurriculumId,
                  curriculumComponentTermId: rep.curriculumComponentTermId,
                  labMode,
                })
              }
            />
          )}
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
      </TD>
    </tr>
  )
}

// ─── Component group row ──────────────────────────────────────────────────────

function ComponentGroupRow({
  rowNumber,
  group,
  expanded,
  onToggleExpand,
  isConfirmed,
}: {
  rowNumber: number
  group: ComponentGroup
  expanded: boolean
  onToggleExpand: () => void
  isConfirmed: boolean
}) {
  const isMixed = group.teacherState === 'mixed'
  const hasPracLab = (group.hoursByType.PRACTICE ?? 0) > 0 || (group.hoursByType.LAB ?? 0) > 0
  const canExpand =
    group.subjects.length > 1 || isMixed || group.hasSubgroups || (hasPracLab && !isConfirmed)
  const isUnassigned = group.teacherState === 'none' && !isConfirmed
  const rep = group.representativeSubject

  const rowClass = cn(
    'group transition-colors',
    isUnassigned
      ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20'
      : 'hover:bg-muted/20',
  )
  const stickyBg = isUnassigned
    ? 'bg-amber-50/30 dark:bg-amber-950/10 group-hover:bg-amber-50/60 dark:group-hover:bg-amber-950/20'
    : 'bg-background group-hover:bg-muted/20'

  return (
    <>
      <tr className={rowClass}>
        {/* № sticky */}
        <TD
          className={cn('sticky z-[1] text-center text-muted-foreground transition-colors border-r border-border/30', stickyBg)}
          style={{ left: 0, width: NUM_W }}
        >
          {rowNumber}
        </TD>

        {/* Код sticky */}
        <TD
          className={cn('sticky z-[1] font-mono text-muted-foreground transition-colors border-r border-border/30', stickyBg)}
          style={{ left: CODE_LEFT, width: CODE_W }}
        >
          {group.componentCode ?? DASH}
        </TD>

        {/* Назва ОК sticky */}
        <TD
          className={cn('sticky z-[1] transition-colors border-r border-border/30', stickyBg)}
          style={{ left: NAME_LEFT, minWidth: NAME_W }}
        >
          <span className="font-medium">{group.componentName}</span>
          {group.hasSubgroups && !expanded && (
            <span className="ml-1.5 text-[10px] text-violet-500 font-medium">пг</span>
          )}
        </TD>

        {/* Семестри */}
        <TD className="text-center font-mono text-muted-foreground whitespace-nowrap">
          {group.semesters.join(', ')}
        </TD>

        {/* Годин (сума) */}
        <TD className="text-center font-mono font-semibold">{group.totalHours}</TD>

        {/* Lesson type columns */}
        {LESSON_COLS.map(({ type }) => {
          const hours = group.hoursByType[type]
          const hasSubgroups = group.subjects.some((sa) =>
            sa.lessons.some((l) => l.lessonType === type && l.subgroupNumber !== null),
          )
          return (
            <TD key={type} className="text-center font-mono text-muted-foreground">
              {hours !== undefined ? (
                <span className={cn(hasSubgroups && 'text-violet-600 dark:text-violet-400')}>
                  {hours}
                </span>
              ) : (
                DASH
              )}
            </TD>
          )
        })}

        {/* Основний викладач */}
        <TD className="min-w-[160px]">
          <div className="flex items-center gap-1 min-w-0">
            <div className="flex-1 min-w-0">
              <TeacherSelectCell
                subjectId={rep.id}
                workingCurriculumId={rep.workingCurriculumId}
                currentTeacher={rep.primaryTeacher}
                disabled={isConfirmed}
              />
            </div>
            {isMixed && (
              <span title="Різні викладачі по семестрах — розгорніть для редагування">
                <SplitSquareHorizontal className="w-3 h-3 shrink-0 text-amber-500" />
              </span>
            )}
          </div>
        </TD>

        {/* Expand button */}
        <TD className="text-center p-0 w-6">
          {canExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              title={expanded ? 'Згорнути' : group.hasSubgroups ? 'Розгорнути підгрупи' : 'Розгорнути по семестрах'}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </TD>
      </tr>

      {/* ── Expanded: mode toggle + per-semester rows + subgroup lesson rows ── */}
      {expanded && !isConfirmed && <DistributionModeRow group={group} disabled={isConfirmed} />}
      {expanded &&
        group.subjects.map((sa) => {
          const subgroupLessons = sa.lessons.filter((l) => l.subgroupNumber !== null)
          const isSubUnassigned = sa.primaryTeacher === null && !isConfirmed

          return (
            <React.Fragment key={sa.id}>
              {/* Per-semester subject row */}
              <tr
                className={cn(
                  'group transition-colors',
                  isSubUnassigned
                    ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20'
                    : 'bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/20',
                )}
              >
                <TD
                  className={cn(
                    'sticky z-[1] transition-colors border-r border-border/30',
                    isSubUnassigned
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 group-hover:bg-amber-50/60 dark:group-hover:bg-amber-950/20'
                      : 'bg-blue-50/20 dark:bg-blue-950/10 group-hover:bg-blue-50/40 dark:group-hover:bg-blue-950/20',
                  )}
                  style={{ left: 0, width: NUM_W }}
                />
                <TD
                  className={cn(
                    'sticky z-[1] transition-colors border-r border-border/30',
                    isSubUnassigned
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 group-hover:bg-amber-50/60 dark:group-hover:bg-amber-950/20'
                      : 'bg-blue-50/20 dark:bg-blue-950/10 group-hover:bg-blue-50/40 dark:group-hover:bg-blue-950/20',
                  )}
                  style={{ left: CODE_LEFT, width: CODE_W }}
                />
                <TD
                  className={cn(
                    'sticky z-[1] pl-7 text-muted-foreground transition-colors border-r border-border/30',
                    isSubUnassigned
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 group-hover:bg-amber-50/60 dark:group-hover:bg-amber-950/20'
                      : 'bg-blue-50/20 dark:bg-blue-950/10 group-hover:bg-blue-50/40 dark:group-hover:bg-blue-950/20',
                  )}
                  style={{ left: NAME_LEFT, minWidth: NAME_W }}
                >
                  └ {sa.semesterNumber} семестр
                  {sa.groupName !== null && (
                    <span className="ml-1.5 text-[10px] text-blue-600 dark:text-blue-400">
                      {sa.groupName}
                    </span>
                  )}
                </TD>

                <TD className="text-center font-mono text-muted-foreground">{sa.semesterNumber}</TD>
                <TD className="text-center font-mono font-semibold">{sa.totalHours}</TD>

                {LESSON_COLS.map(({ type }) => {
                  const hours = getHoursForType(sa, type)
                  const hasSubgroups = sa.lessons.some(
                    (l) => l.lessonType === type && l.subgroupNumber !== null,
                  )
                  return (
                    <TD key={type} className="text-center font-mono text-muted-foreground">
                      {hours > 0 ? (
                        <span className={cn(hasSubgroups && 'text-violet-600 dark:text-violet-400')}>
                          {hours}
                        </span>
                      ) : (
                        DASH
                      )}
                    </TD>
                  )
                })}

                <TD className="min-w-[160px]" colSpan={2}>
                  <TeacherSelectCell
                    subjectId={sa.id}
                    workingCurriculumId={sa.workingCurriculumId}
                    currentTeacher={sa.primaryTeacher}
                    disabled={isConfirmed}
                  />
                </TD>
              </tr>

              {/* Subgroup lesson rows */}
              {subgroupLessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="bg-violet-50/20 dark:bg-violet-950/10 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 group transition-colors"
                >
                  <TD
                    className="sticky z-[1] border-r border-border/30 bg-violet-50/20 dark:bg-violet-950/10 group-hover:bg-violet-50/40 dark:group-hover:bg-violet-950/20 transition-colors"
                    style={{ left: 0, width: NUM_W }}
                  />
                  <TD
                    className="sticky z-[1] border-r border-border/30 bg-violet-50/20 dark:bg-violet-950/10 group-hover:bg-violet-50/40 dark:group-hover:bg-violet-950/20 transition-colors"
                    style={{ left: CODE_LEFT, width: CODE_W }}
                  />
                  <TD
                    className="sticky z-[1] border-r border-border/30 bg-violet-50/20 dark:bg-violet-950/10 group-hover:bg-violet-50/40 dark:group-hover:bg-violet-950/20 transition-colors pl-12 text-violet-700 dark:text-violet-300"
                    style={{ left: NAME_LEFT, minWidth: NAME_W }}
                  >
                    └─ {LESSON_TYPE_LABELS[lesson.lessonType as LessonType]} · пг.{lesson.subgroupNumber}
                  </TD>
                  <TD className="text-center font-mono text-muted-foreground">{sa.semesterNumber}</TD>
                  <TD className="text-center font-mono text-violet-700 dark:text-violet-300">{lesson.hours}</TD>
                  {LESSON_COLS.map(({ type }) => (
                    <TD key={type} className="text-center font-mono">
                      {lesson.lessonType === type ? (
                        <span className="text-violet-600 dark:text-violet-400">{lesson.hours}</span>
                      ) : (
                        DASH
                      )}
                    </TD>
                  ))}
                  <TD className="min-w-[160px]">
                    <LessonTeacherSelectCell
                      lesson={lesson}
                      subjectAssignmentId={sa.id}
                      workingCurriculumId={sa.workingCurriculumId}
                      disabled={isConfirmed}
                    />
                  </TD>
                  <TD className="w-6" />
                </tr>
              ))}
            </React.Fragment>
          )
        })}
    </>
  )
}

// ─── Semester filter ──────────────────────────────────────────────────────────

function extractSemesters(items: SubjectAssignmentDto[]): number[] {
  return [...new Set(items.map((sa) => sa.semesterNumber))].sort((a, b) => a - b)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AssignmentTable({
  workingCurriculumId,
}: {
  workingCurriculumId: string
}) {
  const { data: assignments, isLoading, error } = useAssignments(workingCurriculumId)
  const generateMut = useGenerateAssignments()
  const user = useUser()
  const canRevoke = !!user && (user.role === 'DIRECTOR' || user.role === 'ADMINISTRATOR')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [filterSemester, setFilterSemester] = useState<number | null>(null)

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const availableSemesters = assignments !== undefined ? extractSemesters(assignments) : []

  const filtered =
    assignments !== undefined
      ? filterSemester !== null
        ? assignments.filter((sa) => sa.semesterNumber === filterSemester)
        : assignments
      : []

  const groups = sortGroups(buildGroups(filtered))

  const hasRows = groups.length > 0
  const isDraft = assignments?.some((a) => a.status === 'DRAFT') ?? false
  const isConfirmed = (assignments?.length ?? 0) > 0 && !isDraft

  // Count groups with no teacher assigned across all their semesters
  const unassignedCount = groups.filter((g) => g.teacherState === 'none').length

  const confirmedRecord = assignments?.find((a) => a.status === 'CONFIRMED')

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (error !== null) {
    return (
      <div className="p-4 text-sm text-destructive">
        Помилка завантаження розподілу навантаження
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border bg-muted/30 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {availableSemesters.length > 1 && (
            <select
              value={filterSemester ?? ''}
              onChange={(e) => {
                setFilterSemester(e.target.value === '' ? null : Number(e.target.value))
                setExpandedKeys(new Set())
              }}
              className="h-7 text-xs rounded-md border border-border bg-background px-2 pr-6 cursor-pointer"
            >
              <option value="">Усі семестри</option>
              {availableSemesters.map((s) => (
                <option key={s} value={s}>
                  {s} семестр
                </option>
              ))}
            </select>
          )}

          {filterSemester !== null && (
            <button
              type="button"
              onClick={() => { setFilterSemester(null); setExpandedKeys(new Set()) }}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md border border-border bg-background"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status */}
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {hasRows ? (
            isConfirmed ? (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Підтверджено наказом
                {confirmedRecord?.orderNumber !== null && confirmedRecord !== undefined && (
                  <span className="font-normal text-muted-foreground">
                    №{confirmedRecord.orderNumber}
                    {confirmedRecord.orderDate !== null && (
                      <> від {new Date(confirmedRecord.orderDate).toLocaleDateString('uk-UA')}</>
                    )}
                  </span>
                )}
              </span>
            ) : (
              <span>
                {groups.length} позицій ·{' '}
                {unassignedCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    {unassignedCount} без викладача
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">
                    всі викладачі призначені
                  </span>
                )}
              </span>
            )
          ) : (
            <span>Розподіл ще не згенеровано</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isConfirmed && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => generateMut.mutate(workingCurriculumId)}
              disabled={generateMut.isPending}
            >
              {generateMut.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {hasRows ? 'Перегенерувати' : 'Згенерувати розподіл'}
            </Button>
          )}

          {isDraft && hasRows && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setConfirmOpen(true)}
              disabled={unassignedCount > 0}
              title={unassignedCount > 0 ? `Призначте викладача для ${unassignedCount} ОК` : undefined}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Підтвердити наказом
            </Button>
          )}

          {isConfirmed && canRevoke && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => setRevokeOpen(true)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Скасувати наказ
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {hasRows && (
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-20">
              <tr>
                <TH
                  rowSpan={2}
                  className="sticky z-30 text-center border-r border-border"
                  style={{ left: 0, width: NUM_W }}
                >
                  №
                </TH>
                <TH
                  rowSpan={2}
                  className="sticky z-30 border-r border-border"
                  style={{ left: CODE_LEFT, width: CODE_W }}
                >
                  Код
                </TH>
                <TH
                  rowSpan={2}
                  className="sticky z-30 border-r border-border"
                  style={{ left: NAME_LEFT, minWidth: NAME_W }}
                >
                  Назва ОК
                </TH>
                <TH rowSpan={2} className="text-center">Сем.</TH>
                <TH rowSpan={2} className="text-center">Год.</TH>
                <TH colSpan={6} className="text-center border-x border-border/50 border-b-0">
                  Розподіл годин
                </TH>
                <TH rowSpan={2} className="min-w-[160px]">Основний викладач</TH>
                <TH rowSpan={2} className="w-6" />
              </tr>
              <tr>
                {LESSON_COLS.map(({ label, title }) => (
                  <TH key={label} className="text-center">
                    <span title={title} className="cursor-default">{label}</span>
                  </TH>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group, idx) => (
                <ComponentGroupRow
                  key={group.key}
                  rowNumber={idx + 1}
                  group={group}
                  expanded={expandedKeys.has(group.key)}
                  onToggleExpand={() => toggleExpand(group.key)}
                  isConfirmed={isConfirmed}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmOrderDialog
        open={confirmOpen}
        workingCurriculumId={workingCurriculumId}
        onClose={() => setConfirmOpen(false)}
      />

      <RevokeOrderDialog
        open={revokeOpen}
        workingCurriculumId={workingCurriculumId}
        orderNumber={confirmedRecord?.orderNumber ?? null}
        onClose={() => setRevokeOpen(false)}
      />
    </div>
  )
}
