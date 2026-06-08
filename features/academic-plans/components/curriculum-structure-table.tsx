'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Link, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
  useCreateComponentTerm,
  useUpdateComponentTerm,
  useDeleteComponentTerm,
  useCreateProjection,
  useDeleteProjection,
} from '../api'
import {
  SECTION_TYPE_LABELS,
  isSecondaryEducationSection,
  type CurriculumComponentDto,
  type CurriculumComponentTermDto,
  type CurriculumSectionDto,
  type CurriculumSectionType,
  type CurriculumVersionDetailDto,
  type TimeBudgetEntryDto,
} from '../types'
import { ComponentDialog } from './component-dialog'
import { ComponentTermDialog } from './component-term-dialog'
import { SectionDialog } from './section-dialog'

// ─── Component-code auto-suggestion ──────────────────────────────────────────
//
// When creating a new component in a supported section we pre-fill the code
// field with the next sequential value (e.g. "ОК3").  The user can edit or
// clear the suggestion freely — it is never forced on save.
//
// Drag-and-drop reordering only changes `orderIndex`, so these codes are safe.

// ELECTIVE sections use ВК (вибіркові компоненти).
// Every other section that carries components uses ОК.
const CODE_SUGGESTION_PREFIX: Partial<Record<CurriculumSectionType, string>> = {
  SECONDARY_EDUCATION: 'ОК',
  BASIC_OPP: 'ОК',
  ELECTIVE_OPP: 'ОК',
  OPTIONAL_COURSES: 'ОК',
  GENERAL_COMPETENCY: 'ОК',
  PROFESSIONAL_COMPETENCY: 'ОК',
  ELECTIVE: 'ВК',
  PRACTICE: 'ОК',
  ATTESTATION: 'ОК',
  CFP: 'ОК',
}

/**
 * Returns the next sequential code for a section, e.g. "ОК4" when the
 * highest existing code in the section that matches `^PREFIX\d+$` is "ОК3".
 * Gaps (deleted codes) are ignored — we always use max+1.
 * Returns undefined if the section type has no configured prefix.
 */
function suggestNextCode(
  components: CurriculumComponentDto[],
  sectionType: CurriculumSectionType,
): string | undefined {
  const prefix = CODE_SUGGESTION_PREFIX[sectionType]
  if (!prefix) return undefined
  const re = new RegExp(`^${prefix}(\\d+)$`)
  const nums = components
    .map((c) => {
      if (!c.code) return null
      const m = c.code.trim().match(re)
      return m ? parseInt(m[1] ?? '', 10) : null
    })
    .filter((n): n is number => n !== null && Number.isFinite(n))
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `${prefix}${max + 1}`
}

// ─── Dialog state ─────────────────────────────────────────────────────────────

type DialogState =
  | { kind: 'addSection' }
  | { kind: 'editSection'; section: CurriculumSectionDto }
  | { kind: 'addComponent'; section: CurriculumSectionDto }
  | { kind: 'editComponent'; component: CurriculumComponentDto }
  | { kind: 'deleteSection'; section: CurriculumSectionDto }
  | { kind: 'deleteComponent'; component: CurriculumComponentDto }
  | { kind: 'addTerm'; component: CurriculumComponentDto; semesterNumber: number }
  | { kind: 'editTerm'; term: CurriculumComponentTermDto; component: CurriculumComponentDto }
  // Projection management
  | { kind: 'addProjection'; component: CurriculumComponentDto }
  | { kind: 'deleteProjection'; projectionId: string; componentName: string }
  | null

// ─── Column definitions ───────────────────────────────────────────────────────

const HOURS_BREAKDOWN = [
  { key: 'lectureHours' as const, label: 'Лекц.' },
  { key: 'practicalHours' as const, label: 'Практ.' },
  { key: 'seminarHours' as const, label: 'Семін.' },
  { key: 'labHours' as const, label: 'Лаб.' },
  { key: 'selfStudyHours' as const, label: 'СР' },
  { key: 'otherHours' as const, label: 'Інші' },
] as const

// Sticky column left offsets (px)
const NUM_W = 32
const CODE_W = 52
const NAME_W = 220
const CODE_LEFT = NUM_W
const NAME_LEFT = NUM_W + CODE_W

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getSemesterCount(sections: CurriculumSectionDto[]): number {
  let max = 0
  for (const s of sections)
    for (const c of s.components)
      for (const t of c.terms)
        if (t.semesterNumber > max) max = t.semesterNumber
  return Math.max(max, 8)
}

function safeEcts(val: string | number | null | undefined): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val ?? ''))
  return Number.isFinite(n) ? n : 0
}

/**
 * Format an ECTS value for a table cell.
 * Returns the formatted string (e.g. "6.0", "0.0") for any finite stored value,
 * including 0 — null / undefined / non-parseable → null (caller renders DASH).
 * Unlike `safeEcts`, this distinguishes between "missing" and "stored as 0".
 */
function formatEctsValue(val: string | number | null | undefined): string | null {
  if (val == null) return null
  // Defensive guard: Prisma Decimal objects leak as {d,e,s} if the backend
  // interceptor is missing. Detect and log loudly instead of silently showing —.
  if (typeof val === 'object') {
    console.error('[formatEctsValue] received a Decimal object instead of a primitive — backend DecimalSerializerInterceptor may not be running', val)
    return null
  }
  const n = typeof val === 'number' ? val : parseFloat(String(val))
  return Number.isFinite(n) ? n.toFixed(1) : null
}

function safeInt(val: number | null | undefined): number {
  return val != null && Number.isFinite(val) ? val : 0
}

/**
 * Flatten section components so children immediately follow their parent, ordered by orderIndex.
 *
 * Projected rows always carry the canonical component's `parentComponentId`.
 * When a projected child is rendered in a section where its parent is absent,
 * we treat it as a top-level row rather than silently dropping it.
 * The `isProjected` flag on the row signals the caller to render it differently.
 */
function orderedComponents(components: CurriculumComponentDto[]): CurriculumComponentDto[] {
  const sorted = [...components].sort((a, b) => a.orderIndex - b.orderIndex)
  const presentIds = new Set(sorted.map((c) => c.id))

  const byParent = new Map<string, CurriculumComponentDto[]>()
  for (const c of sorted) {
    // Only treat as a child when the parent actually exists in this section's component list.
    // Projected rows may carry a parentComponentId whose parent lives in a different section —
    // in that case we promote the row to top-level so it is never silently dropped.
    if (c.parentComponentId && presentIds.has(c.parentComponentId)) {
      const arr = byParent.get(c.parentComponentId) ?? []
      arr.push(c)
      byParent.set(c.parentComponentId, arr)
    }
  }

  const result: CurriculumComponentDto[] = []
  for (const c of sorted) {
    // Skip children that were placed under a present parent (they'll be appended below).
    if (c.parentComponentId && presentIds.has(c.parentComponentId)) continue
    result.push(c)
    const children = byParent.get(c.id)
    if (children) result.push(...children)
  }
  return result
}

function getSectionHeaderClass(sectionType: CurriculumSectionDto['sectionType']): string {
  const base = 'text-xs font-semibold uppercase tracking-wide'
  switch (sectionType) {
    case 'SECONDARY_EDUCATION':
    case 'BASIC_OPP':
    case 'ELECTIVE_OPP':
    case 'OPTIONAL_COURSES':
      return cn(base, 'bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300')
    case 'GENERAL_COMPETENCY':
      return cn(base, 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300')
    case 'PROFESSIONAL_COMPETENCY':
      return cn(base, 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300')
    case 'ELECTIVE':
      return cn(base, 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300')
    case 'PRACTICE':
      return cn(base, 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300')
    case 'ATTESTATION':
      return cn(base, 'bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300')
    default:
      return cn(base, 'bg-muted/60 text-muted-foreground')
  }
}

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

// ─── Component row ────────────────────────────────────────────────────────────

interface ComponentRowProps {
  rowNumber: number
  component: CurriculumComponentDto
  sectionType: CurriculumSectionDto['sectionType']
  semesterCount: number
  hoursExpanded: boolean
  showZnoCol: boolean
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
  onAddProjection?: () => void
  onAddTerm: (s: number) => void
  onEditTerm: (t: CurriculumComponentTermDto) => void
}

function ComponentRow({
  rowNumber,
  component,
  sectionType,
  semesterCount,
  hoursExpanded,
  showZnoCol,
  canEdit,
  onEdit,
  onDelete,
  onAddProjection,
  onAddTerm,
  onEditTerm,
}: ComponentRowProps) {
  const isSecEdu = isSecondaryEducationSection(sectionType)
  const isChild = !!component.parentComponentId
  const isElectiveGroup = component.componentKind === 'ELECTIVE_GROUP'
  const isProjected = component.isProjected === true
  const termByS = new Map(component.terms.map((t) => [t.semesterNumber, t]))

  const rowClass = cn(
    'group transition-colors',
    isProjected
      ? 'bg-sky-50/20 dark:bg-sky-950/10 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 opacity-80'
      : isElectiveGroup
        ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20'
        : isChild
          ? 'hover:bg-muted/10'
          : 'hover:bg-muted/20',
  )

  const stickyBg = isProjected
    ? 'bg-sky-50/20 dark:bg-sky-950/10 group-hover:bg-sky-50/40 dark:group-hover:bg-sky-950/20'
    : isElectiveGroup
      ? 'bg-amber-50/30 dark:bg-amber-950/10 group-hover:bg-amber-50/60 dark:group-hover:bg-amber-950/20'
      : isChild
        ? 'bg-background group-hover:bg-muted/10'
        : 'bg-background group-hover:bg-muted/20'

  return (
    <tr className={rowClass}>
      {/* № sticky */}
      <TD
        className={cn('sticky z-[1] text-center text-muted-foreground transition-colors', stickyBg)}
        style={{ left: 0, width: NUM_W }}
      >
        {isChild ? '' : rowNumber}
      </TD>

      {/* Код sticky */}
      <TD
        className={cn('sticky z-[1] text-center font-mono transition-colors', stickyBg)}
        style={{ left: CODE_LEFT, width: CODE_W }}
      >
        {component.code ?? component.groupCode ?? DASH}
      </TD>

      {/* Назва sticky */}
      <TD
        className={cn('sticky z-[1] transition-colors', stickyBg)}
        style={{ left: NAME_LEFT, minWidth: NAME_W }}
      >
        <span
          className={cn(
            'flex items-center gap-1 leading-tight',
            isChild && 'pl-5',
            isElectiveGroup && 'font-semibold',
            isProjected && 'text-muted-foreground',
          )}
        >
          {isProjected && (
            <span
              className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
              title={component.displayNote ?? 'Інтегрований компонент — відображається в цьому розділі без повторного обліку'}
            >
              {component.displayMarker ?? '*'}
            </span>
          )}
          <span className="block">{component.name}</span>
        </span>
      </TD>

      {/* Екз. — derived from term.controlForm === 'EXAM' */}
      {(() => {
        const examSems = component.terms
          .filter((t) => t.controlForm === 'EXAM')
          .map((t) => t.semesterNumber)
          .sort((a, b) => a - b)
        return (
          <TD className="text-center">
            {examSems.length ? (
              <span className="text-red-600 dark:text-red-400 font-medium">
                {examSems.join(', ')}
              </span>
            ) : (
              DASH
            )}
          </TD>
        )
      })()}

      {/* Зал. — CREDIT or GRADED_CREDIT */}
      {(() => {
        const creditSems = component.terms
          .filter((t) => t.controlForm === 'CREDIT' || t.controlForm === 'GRADED_CREDIT')
          .map((t) => t.semesterNumber)
          .sort((a, b) => a - b)
        return (
          <TD className="text-center">
            {creditSems.length ? creditSems.join(', ') : DASH}
          </TD>
        )
      })()}

      {/* КР — hasCourseWork || hasCourseProject */}
      {(() => {
        const krSems = component.terms
          .filter((t) => t.hasCourseWork || t.hasCourseProject)
          .map((t) => t.semesterNumber)
          .sort((a, b) => a - b)
        return (
          <TD className="text-center">
            {krSems.length ? (
              <span className="text-sky-600 dark:text-sky-400">{krSems.join(', ')}</span>
            ) : (
              DASH
            )}
          </TD>
        )
      })()}

      {/* Год. */}
      <TD className="text-right font-mono">{component.totalHours || DASH}</TD>

      {/* ЄКТС — source of truth: component.totalEcts from ComponentDialog */}
      <TD className="text-right font-mono">
        {isSecEdu ? DASH : (formatEctsValue(component.totalEcts) ?? DASH)}
      </TD>

      {/* Ауд. (always visible) */}
      <TD className="text-right font-mono">
        {component.auditoryHours != null ? component.auditoryHours : DASH}
      </TD>

      {/* Expanded breakdown columns */}
      {hoursExpanded &&
        HOURS_BREAKDOWN.map((col) => (
          <TD key={col.key} className="text-right font-mono">
            {component[col.key] != null ? component[col.key] : DASH}
          </TD>
        ))}
      {hoursExpanded && showZnoCol && (
        <TD className="text-right font-mono">
          {component.znoPreparationHours != null ? component.znoPreparationHours : DASH}
        </TD>
      )}

      {/* Semester columns */}
      {Array.from({ length: semesterCount }).map((_, idx) => {
        const s = idx + 1
        const term = termByS.get(s)
        if (!term) {
          return canEdit ? (
            <TD
              key={s}
              className="text-center cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => onAddTerm(s)}
            >
              <Plus
                size={11}
                className="mx-auto opacity-0 group-hover:opacity-40 transition-opacity"
              />
            </TD>
          ) : (
            <TD key={s} className="text-center text-muted-foreground/30">
              —
            </TD>
          )
        }
        const display =
          term.hoursPerWeek != null ? `${term.hours}/${term.hoursPerWeek}` : `${term.hours}`
        return (
          <TD
            key={s}
            className={cn(
              'text-center font-mono',
              canEdit && 'cursor-pointer hover:bg-primary/5 transition-colors',
            )}
            onClick={canEdit ? () => onEditTerm(term) : undefined}
          >
            {display}
          </TD>
        )
      })}

      {/* Actions */}
      {canEdit && (
        <TD className="text-center whitespace-nowrap">
          <span className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Edit button is hidden for projected rows — they are display-only. */}
            {!isProjected && (
              <button
                onClick={onEdit}
                title="Редагувати"
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Pencil size={11} />
              </button>
            )}
            {/* Show "also display in section" only for canonical (non-projected) rows */}
            {!isProjected && onAddProjection && (
              <button
                onClick={onAddProjection}
                title="Показати також в іншому розділі (інтеграційна проекція)"
                className="p-1 rounded hover:bg-sky-100 dark:hover:bg-sky-950/30 transition-colors text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400"
              >
                <Link size={11} />
              </button>
            )}
            <button
              onClick={onDelete}
              title={isProjected ? 'Видалити відображення з цього розділу' : 'Видалити'}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 size={11} />
            </button>
          </span>
        </TD>
      )}
    </tr>
  )
}

// ─── Section block ────────────────────────────────────────────────────────────

interface SectionBlockProps {
  section: CurriculumSectionDto
  startRowNumber: number
  semesterCount: number
  totalCols: number
  hoursExpanded: boolean
  showZnoCol: boolean
  canEdit: boolean
  onAddComponent: () => void
  onEditSection: () => void
  onDeleteSection: () => void
  onEditComponent: (c: CurriculumComponentDto) => void
  onDeleteComponent: (c: CurriculumComponentDto) => void
  onAddProjection: (c: CurriculumComponentDto) => void
  onAddTerm: (c: CurriculumComponentDto, s: number) => void
  onEditTerm: (t: CurriculumComponentTermDto, c: CurriculumComponentDto) => void
}

function SectionBlock({
  section,
  startRowNumber,
  semesterCount,
  totalCols,
  hoursExpanded,
  showZnoCol,
  canEdit,
  onAddComponent,
  onEditSection,
  onDeleteSection,
  onEditComponent,
  onDeleteComponent,
  onAddProjection,
  onAddTerm,
  onEditTerm,
}: SectionBlockProps) {
  const [expanded, setExpanded] = useState(true)
  const isSecEdu = isSecondaryEducationSection(section.sectionType)
  const headerClass = getSectionHeaderClass(section.sectionType)
  const comps = orderedComponents(section.components)

  // Section summary — projected (display-only) rows are excluded from all totals.
  const ownedComps = comps.filter((c) => c.countsInTotals)
  const sumHours = ownedComps.reduce((s, c) => s + c.totalHours, 0)
  const sumEcts = isSecEdu ? 0 : ownedComps.reduce((s, c) => s + safeEcts(c.totalEcts), 0)
  const sumAud = ownedComps.reduce((s, c) => s + safeInt(c.auditoryHours), 0)
  const sumBreakdown = Object.fromEntries(
    HOURS_BREAKDOWN.map((col) => [col.key, ownedComps.reduce((s, c) => s + safeInt(c[col.key]), 0)]),
  ) as Record<(typeof HOURS_BREAKDOWN)[number]['key'], number>
  const sumZno = ownedComps.reduce((s, c) => s + safeInt(c.znoPreparationHours), 0)
  const semHours = Array.from({ length: semesterCount }, (_, i) =>
    ownedComps.flatMap((c) => c.terms).filter((t) => t.semesterNumber === i + 1).reduce((s, t) => s + t.hours, 0),
  )

  let rowNum = startRowNumber

  return (
    <>
      {/* Section header */}
      <tr>
        <td colSpan={totalCols} className={cn('px-3 py-2 border-b border-border', headerClass)}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
              >
                <ChevronDown
                  size={14}
                  className={cn('transition-transform duration-200', !expanded && '-rotate-90')}
                />
              </button>
              <span className="truncate">
                {section.code && (
                  <span className="font-mono mr-2 opacity-60">{section.code}</span>
                )}
                {section.name}
                <span className="ml-2 font-normal opacity-60">
                  ({SECTION_TYPE_LABELS[section.sectionType]})
                </span>
              </span>
            </span>
            {canEdit && (
              <span className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onEditSection() }}
                  title="Редагувати розділ"
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddComponent() }}
                  title="Додати компонент"
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <Plus size={13} />
                </button>
                {section.components.filter((c) => c.countsInTotals).length === 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSection() }}
                    title="Видалити розділ"
                    className="p-1 rounded hover:bg-red-100/60 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </span>
            )}
          </div>
        </td>
      </tr>

      {/* Component rows */}
      {expanded &&
        comps.map((comp) => {
          const rn = comp.parentComponentId ? 0 : rowNum++
          return (
            <ComponentRow
              key={`${comp.id}-${comp.projectionId ?? 'canonical'}`}
              rowNumber={rn}
              component={comp}
              sectionType={section.sectionType}
              semesterCount={semesterCount}
              hoursExpanded={hoursExpanded}
              showZnoCol={showZnoCol}
              canEdit={canEdit}
              onEdit={() => onEditComponent(comp)}
              onDelete={() => onDeleteComponent(comp)}
              onAddProjection={!comp.isProjected ? () => onAddProjection(comp) : undefined}
              onAddTerm={(s) => onAddTerm(comp, s)}
              onEditTerm={(t) => onEditTerm(t, comp)}
            />
          )
        })}

      {/* Section summary row */}
      {expanded && comps.length > 0 && (
        <tr className="bg-muted/30 font-medium">
          <TD
            className="sticky z-[1] bg-muted/30 transition-colors"
            style={{ left: 0, width: NUM_W }}
          />
          <TD
            className="sticky z-[1] bg-muted/30 transition-colors"
            style={{ left: CODE_LEFT, width: CODE_W }}
          />
          <TD
            className="sticky z-[1] bg-muted/30 text-left text-muted-foreground italic transition-colors"
            style={{ left: NAME_LEFT, minWidth: NAME_W }}
          >
            Всього по розділу
          </TD>
          {/* Екз. Зал. КР */}
          <TD /><TD /><TD />
          {/* Год. */}
          <TD className="text-right font-mono font-semibold">{sumHours || DASH}</TD>
          {/* ЄКТС */}
          <TD className="text-right font-mono">
            {isSecEdu ? DASH : sumEcts.toFixed(1)}
          </TD>
          {/* Ауд. */}
          <TD className="text-right font-mono">{sumAud || DASH}</TD>
          {/* Breakdown */}
          {hoursExpanded &&
            HOURS_BREAKDOWN.map((col) => (
              <TD key={col.key} className="text-right font-mono">
                {sumBreakdown[col.key] || DASH}
              </TD>
            ))}
          {hoursExpanded && showZnoCol && (
            <TD className="text-right font-mono">{sumZno || DASH}</TD>
          )}
          {/* Semester sums */}
          {semHours.map((h, i) => (
            <TD key={i} className="text-center font-mono">
              {h || DASH}
            </TD>
          ))}
          {canEdit && <TD />}
        </tr>
      )}

      {/* Add component button at bottom of section */}
      {expanded && canEdit && (
        <tr>
          <td colSpan={totalCols} className="px-3 py-1.5 border-b border-border/30">
            <button
              onClick={onAddComponent}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus size={12} />
              Додати компонент до &laquo;{section.name}&raquo;
            </button>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Global footer ────────────────────────────────────────────────────────────

interface GlobalFooterProps {
  sections: CurriculumSectionDto[]
  semesterCount: number
  hoursExpanded: boolean
  showZnoCol: boolean
  canEdit: boolean
}

function GlobalFooter({ sections, semesterCount, hoursExpanded, showZnoCol, canEdit }: GlobalFooterProps) {
  // Projected (display-only) rows must be excluded from every aggregate.
  const allOwnedComps = sections.flatMap((s) => s.components.filter((c) => c.countsInTotals))
  const allOwnedTerms = allOwnedComps.flatMap((c) => c.terms)

  const totalHours = allOwnedComps.reduce((s, c) => s + c.totalHours, 0)
  const totalEcts = sections
    .flatMap((sec) =>
      isSecondaryEducationSection(sec.sectionType)
        ? []
        : sec.components.filter((c) => c.countsInTotals),
    )
    .reduce((s, c) => s + safeEcts(c.totalEcts), 0)
  const totalAud = allOwnedComps.reduce((s, c) => s + safeInt(c.auditoryHours), 0)
  const totalBreakdown = Object.fromEntries(
    HOURS_BREAKDOWN.map((col) => [col.key, allOwnedComps.reduce((s, c) => s + safeInt(c[col.key]), 0)]),
  ) as Record<(typeof HOURS_BREAKDOWN)[number]['key'], number>
  const totalZno = allOwnedComps.reduce((s, c) => s + safeInt(c.znoPreparationHours), 0)

  const semData = Array.from({ length: semesterCount }, (_, i) => {
    const s = i + 1
    const terms = allOwnedTerms.filter((t) => t.semesterNumber === s)
    return {
      hours: terms.reduce((acc, t) => acc + t.hours, 0),
      hoursPerWeek: terms.reduce((acc, t) => acc + safeInt(t.hoursPerWeek), 0),
      disciplines: allOwnedComps.filter(
        (c) => c.componentKind === 'REGULAR' && c.terms.some((t) => t.semesterNumber === s),
      ).length,
      exams: allOwnedTerms.filter((t) => t.semesterNumber === s && t.controlForm === 'EXAM').length,
      credits: allOwnedTerms.filter(
        (t) => t.semesterNumber === s && (t.controlForm === 'CREDIT' || t.controlForm === 'GRADED_CREDIT'),
      ).length,
      courseWorks: allOwnedTerms.filter(
        (t) => t.semesterNumber === s && (t.hasCourseWork || t.hasCourseProject),
      ).length,
    }
  })

  const stickyClass = 'sticky z-[1] bg-muted/50 font-semibold text-left pl-3 text-muted-foreground italic'

  const footerRows: { label: string; values: (number | string)[] }[] = [
    {
      label: 'Тижневе навантаження',
      values: semData.map((d) => d.hoursPerWeek || '—'),
    },
    {
      label: 'Кількість дисциплін',
      values: semData.map((d) => d.disciplines || '—'),
    },
    {
      label: 'Кількість екзаменів',
      values: semData.map((d) => d.exams || '—'),
    },
    {
      label: 'Кількість заліків',
      values: semData.map((d) => d.credits || '—'),
    },
    {
      label: 'Кількість КР/КП',
      values: semData.map((d) => d.courseWorks || '—'),
    },
  ]

  const hoursColCount = 1 + (hoursExpanded ? HOURS_BREAKDOWN.length + (showZnoCol ? 1 : 0) : 0)
  const controlCols = 3

  return (
    <tfoot>
      {/* Всього по плану */}
      <tr className="bg-muted/50 border-t-2 border-border font-semibold">
        <TD className="sticky z-[1] bg-muted/50" style={{ left: 0, width: NUM_W }} />
        <TD className="sticky z-[1] bg-muted/50" style={{ left: CODE_LEFT, width: CODE_W }} />
        <TD
          className="sticky z-[1] bg-muted/50 font-semibold pl-2"
          style={{ left: NAME_LEFT, minWidth: NAME_W }}
        >
          Всього по плану
        </TD>
        {/* Екз. Зал. КР */}
        <TD colSpan={controlCols} />
        {/* Год. */}
        <TD className="text-right font-mono font-bold text-foreground">{totalHours || DASH}</TD>
        {/* ЄКТС */}
        <TD className="text-right font-mono font-bold text-foreground">
          {totalEcts.toFixed(1)}
        </TD>
        {/* Ауд. */}
        <TD className="text-right font-mono">{totalAud || DASH}</TD>
        {/* Breakdown */}
        {hoursExpanded &&
          HOURS_BREAKDOWN.map((col) => (
            <TD key={col.key} className="text-right font-mono">
              {totalBreakdown[col.key] || DASH}
            </TD>
          ))}
        {hoursExpanded && showZnoCol && (
          <TD className="text-right font-mono">{totalZno || DASH}</TD>
        )}
        {/* Semester sums */}
        {semData.map((d, i) => (
          <TD key={i} className="text-center font-mono font-bold">
            {d.hours || DASH}
          </TD>
        ))}
        {canEdit && <TD />}
      </tr>

      {/* Extra footer rows */}
      {footerRows.map((row) => (
        <tr key={row.label} className="bg-muted/30">
          <TD className="sticky z-[1] bg-muted/30" style={{ left: 0, width: NUM_W }} />
          <TD className="sticky z-[1] bg-muted/30" style={{ left: CODE_LEFT, width: CODE_W }} />
          <TD
            className={cn('sticky z-[1] text-xs', stickyClass)}
            style={{ left: NAME_LEFT, minWidth: NAME_W }}
          >
            {row.label}
          </TD>
          <TD colSpan={controlCols} />
          <TD />{/* Год. */}
          <TD />{/* ЄКТС */}
          <TD colSpan={hoursColCount} />{/* hours group */}
          {row.values.map((v, i) => (
            <TD key={i} className="text-center font-mono text-xs">
              {v}
            </TD>
          ))}
          {canEdit && <TD />}
        </tr>
      ))}
    </tfoot>
  )
}

// ─── Time budget block ────────────────────────────────────────────────────────

function TimeBudgetBlock({ entries }: { entries: TimeBudgetEntryDto[] }) {
  if (!entries.length) return null
  return (
    <div className="mt-6 px-4 sm:px-6">
      <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
        Зведені дані за бюджетом часу
      </h3>
      <div className="rounded-lg border border-border overflow-hidden w-fit">
        <table className="text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Вид</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Годин</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">ЄКТС</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border/50">
                <td className="px-4 py-1.5 text-sm">{e.label}</td>
                <td className="px-4 py-1.5 text-right font-mono text-sm">{e.totalHours}</td>
                <td className="px-4 py-1.5 text-right font-mono text-sm text-muted-foreground">
                  {e.totalEcts ? Number(e.totalEcts).toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Add Projection Dialog ────────────────────────────────────────────────────

interface AddProjectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  component: CurriculumComponentDto
  availableSections: CurriculumSectionDto[]
  isPending: boolean
  onConfirm: (targetSectionId: string) => void
}

function AddProjectionDialog({
  open,
  onOpenChange,
  component,
  availableSections,
  isPending,
  onConfirm,
}: AddProjectionDialogProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) setSelectedSectionId('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Показати компонент в іншому розділі</DialogTitle>
          <DialogDescription>
            Компонент «{component.name}» відображатиметься в обраному розділі як інтегрований
            (позначка <span className="font-mono">*</span>). Дані, ЄКТС та семестри залишаються
            канонічними — без дублювання.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {availableSections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Немає доступних розділів для відображення. Компонент вже відображається в усіх інших розділах цієї версії.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Цільовий розділ</label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть розділ..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code ? `${s.code} — ` : ''}{s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button
            disabled={isPending || !selectedSectionId || availableSections.length === 0}
            onClick={() => onConfirm(selectedSectionId)}
          >
            Додати відображення
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CurriculumStructureTableProps {
  version: CurriculumVersionDetailDto | undefined
  isLoading: boolean
  canEdit?: boolean
}

export function CurriculumStructureTable({
  version,
  isLoading,
  canEdit = false,
}: CurriculumStructureTableProps) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [hoursExpanded, setHoursExpanded] = useState(false)
  const closeDialog = () => setDialog(null)

  const versionId = version?.id ?? ''
  const sections = useMemo(
    () =>
      (version?.sections ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex),
    [version?.sections],
  )

  const semesterCount = useMemo(() => getSemesterCount(sections), [sections])

  const showZnoCol = useMemo(
    () =>
      sections.some(
        (s) => s.sectionType === 'BASIC_OPP' || s.sectionType === 'ELECTIVE_OPP',
      ),
    [sections],
  )

  // Compute start row numbers per section
  const sectionStartRows = useMemo(() => {
    const map = new Map<string, number>()
    let counter = 1
    for (const s of sections) {
      map.set(s.id, counter)
      // Only top-level canonical (non-projected, non-child) components get row numbers.
      // Projected display-only rows are excluded — they carry no sequential number.
      counter += s.components.filter((c) => !c.parentComponentId && c.countsInTotals).length
    }
    return map
  }, [sections])

  // Total column count (for colspan calculations)
  const hoursColCount = 1 + (hoursExpanded ? HOURS_BREAKDOWN.length + (showZnoCol ? 1 : 0) : 0)
  const totalCols = 3 + 3 + 2 + hoursColCount + semesterCount + (canEdit ? 1 : 0)
  //                fixed  ctrl sum  hours       semesters      actions

  // Mutations
  const createSection = useCreateSection()
  const updateSection = useUpdateSection()
  const deleteSection = useDeleteSection()
  const createComponent = useCreateComponent()
  const updateComponent = useUpdateComponent()
  const deleteComponent = useDeleteComponent()
  const createTerm = useCreateComponentTerm()
  const updateTerm = useUpdateComponentTerm()
  const deleteTerm = useDeleteComponentTerm()
  const createProjection = useCreateProjection()
  const deleteProjection = useDeleteProjection()

  const anyPending =
    createSection.isPending || updateSection.isPending || deleteSection.isPending ||
    createComponent.isPending || updateComponent.isPending || deleteComponent.isPending ||
    createTerm.isPending || updateTerm.isPending || deleteTerm.isPending ||
    createProjection.isPending || deleteProjection.isPending

  const nextSectionOrder = sections.length
  const nextCompOrder = (s: CurriculumSectionDto) => s.components.length

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={cn('h-8', i % 3 === 0 ? 'w-full' : 'w-11/12')} />
        ))}
      </div>
    )
  }

  if (!version) return null

  return (
    <div className="flex flex-col gap-0">
      {/* ── Scrollable table ───────────────────────────────────────────────── */}
      <div>
        <table className="border-separate border-spacing-0 text-sm" style={{ minWidth: 'max-content', width: '100%' }}>
          <colgroup>
            <col style={{ width: NUM_W }} />
            <col style={{ width: CODE_W }} />
            <col style={{ minWidth: NAME_W }} />
            {/* Форми контролю */}
            <col style={{ width: 44 }} />
            <col style={{ width: 44 }} />
            <col style={{ width: 44 }} />
            {/* Загалом */}
            <col style={{ width: 60 }} />
            <col style={{ width: 56 }} />
            {/* Ауд. base */}
            <col style={{ width: 56 }} />
            {/* Breakdown when expanded */}
            {hoursExpanded &&
              HOURS_BREAKDOWN.map((col) => <col key={col.key} style={{ width: 48 }} />)}
            {hoursExpanded && showZnoCol && <col style={{ width: 44 }} />}
            {/* Semesters */}
            {Array.from({ length: semesterCount }).map((_, i) => (
              <col key={i} style={{ width: 64 }} />
            ))}
            {canEdit && <col style={{ width: 60 }} />}
          </colgroup>

          {/* ── Two-row sticky header ──────────────────────────────────────── */}
          <thead className="sticky top-0 z-20">
            {/* Row 1: group labels */}
            <tr className="bg-card border-b border-border">
              {/* Sticky cols span 2 rows */}
              <TH
                rowSpan={2}
                className="sticky text-center z-30"
                style={{ left: 0, width: NUM_W }}
              >
                №
              </TH>
              <TH
                rowSpan={2}
                className="sticky text-center z-30"
                style={{ left: CODE_LEFT, width: CODE_W }}
              >
                Код
              </TH>
              <TH
                rowSpan={2}
                className="sticky text-left pl-2 z-30 border-r border-border"
                style={{ left: NAME_LEFT, minWidth: NAME_W }}
              >
                Назва компонента
              </TH>

              {/* Форми контролю */}
              <TH colSpan={3} className="text-center border-l border-border/60">
                Форми контролю
              </TH>

              {/* Загалом */}
              <TH colSpan={2} className="text-center border-l border-border/60">
                Загалом
              </TH>

              {/* Hours group with toggle */}
              <TH
                colSpan={hoursColCount}
                className="text-center border-l border-border/60"
              >
                <button
                  onClick={() => setHoursExpanded((v) => !v)}
                  className="flex items-center gap-1 mx-auto text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {hoursExpanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  Аудиторні год.
                </button>
              </TH>

              {/* Semesters */}
              {semesterCount > 0 && (
                <TH colSpan={semesterCount} className="text-center border-l border-border/60">
                  ← Розподіл за семестрами →
                </TH>
              )}

              {/* Actions */}
              {canEdit && (
                <TH rowSpan={2} className="text-center border-l border-border/60">
                  Дії
                </TH>
              )}
            </tr>

            {/* Row 2: column names */}
            <tr className="bg-muted/20 border-b border-border">
              {/* Control forms */}
              <TH className="text-center border-l border-border/40 text-red-600 dark:text-red-400">
                Екз.
              </TH>
              <TH className="text-center">Зал.</TH>
              <TH className="text-center text-sky-600 dark:text-sky-400">КР</TH>

              {/* Summary */}
              <TH className="text-center border-l border-border/40">Год.</TH>
              <TH className="text-center">ЄКТС</TH>

              {/* Auditory base column */}
              <TH className="text-center border-l border-border/40">
                {hoursExpanded ? 'Всього ауд.' : 'Ауд.'}
              </TH>

              {/* Breakdown columns */}
              {hoursExpanded &&
                HOURS_BREAKDOWN.map((col) => (
                  <TH key={col.key} className="text-center">
                    {col.label}
                  </TH>
                ))}
              {hoursExpanded && showZnoCol && <TH className="text-center">ЗНО</TH>}

              {/* Semester column headers */}
              {Array.from({ length: semesterCount }).map((_, i) => (
                <TH
                  key={i}
                  className="text-center border-l border-border/30 font-semibold text-foreground"
                >
                  С{i + 1}
                </TH>
              ))}
            </tr>
          </thead>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <tbody>
            {sections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                startRowNumber={sectionStartRows.get(section.id) ?? 1}
                semesterCount={semesterCount}
                totalCols={totalCols}
                hoursExpanded={hoursExpanded}
                showZnoCol={showZnoCol}
                canEdit={canEdit}
                onAddComponent={() => setDialog({ kind: 'addComponent', section })}
                onEditSection={() => setDialog({ kind: 'editSection', section })}
                onDeleteSection={() => setDialog({ kind: 'deleteSection', section })}
                onEditComponent={(c) => setDialog({ kind: 'editComponent', component: c })}
                onDeleteComponent={(c) => {
                  if (c.isProjected && c.projectionId) {
                    setDialog({ kind: 'deleteProjection', projectionId: c.projectionId, componentName: c.name })
                  } else {
                    setDialog({ kind: 'deleteComponent', component: c })
                  }
                }}
                onAddProjection={(c) => setDialog({ kind: 'addProjection', component: c })}
                onAddTerm={(c, s) => setDialog({ kind: 'addTerm', component: c, semesterNumber: s })}
                onEditTerm={(t, c) => setDialog({ kind: 'editTerm', term: t, component: c })}
              />
            ))}
          </tbody>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <GlobalFooter
            sections={sections}
            semesterCount={semesterCount}
            hoursExpanded={hoursExpanded}
            showZnoCol={showZnoCol}
            canEdit={canEdit}
          />
        </table>
      </div>

      {/* Add section */}
      {canEdit && (
        <div className="px-4 py-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setDialog({ kind: 'addSection' })}
          >
            <Plus size={14} />
            Додати розділ
          </Button>
        </div>
      )}

      <TimeBudgetBlock entries={version.timeBudgetEntries} />

      {/* Legend */}
      <div className="px-4 sm:px-6 py-3 mt-1 border-t border-border/50">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span><span className="font-medium text-red-600 dark:text-red-400">Екз.</span> — номери семестрів з екзаменами</span>
          <span><span className="font-medium">Зал.</span> — заліки</span>
          <span><span className="font-medium text-sky-600 dark:text-sky-400">КР</span> — курсові роботи/проєкти</span>
          <span><span className="font-mono">34/2</span> — годин за семестр / годин на тиждень</span>
        </div>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}

      <SectionDialog
        open={dialog?.kind === 'addSection' || dialog?.kind === 'editSection'}
        onOpenChange={(o) => !o && closeDialog()}
        defaultOrderIndex={nextSectionOrder}
        initialData={dialog?.kind === 'editSection' ? dialog.section : undefined}
        isPending={createSection.isPending || updateSection.isPending}
        onSubmit={(data) => {
          if (dialog?.kind === 'editSection') {
            updateSection.mutate({ sectionId: dialog.section.id, versionId, data }, { onSuccess: closeDialog })
          } else {
            createSection.mutate({ versionId, data }, { onSuccess: closeDialog })
          }
        }}
      />

      {(dialog?.kind === 'addComponent' || dialog?.kind === 'editComponent') && (
        <ComponentDialog
          open
          onOpenChange={(o) => !o && closeDialog()}
          sectionName={dialog.kind === 'addComponent' ? dialog.section.name : ''}
          sectionType={
            dialog.kind === 'addComponent'
              ? dialog.section.sectionType
              // component.sectionId always points to the canonical section (true for
              // both canonical rows and projected rows which carry the canonical data).
              : sections.find((s) => s.id === dialog.component.sectionId)?.sectionType
          }
          defaultOrderIndex={
            dialog.kind === 'addComponent' ? nextCompOrder(dialog.section) : 0
          }
          suggestedCode={
            dialog.kind === 'addComponent'
              ? suggestNextCode(dialog.section.components, dialog.section.sectionType)
              : undefined
          }
          initialData={dialog.kind === 'editComponent' ? dialog.component : undefined}
          isPending={createComponent.isPending || updateComponent.isPending}
          onSubmit={(data) => {
            if (dialog.kind === 'editComponent') {
              updateComponent.mutate(
                { componentId: dialog.component.id, versionId, data },
                { onSuccess: closeDialog },
              )
            } else {
              createComponent.mutate(
                { sectionId: dialog.section.id, versionId, data },
                { onSuccess: closeDialog },
              )
            }
          }}
        />
      )}

      {(dialog?.kind === 'addTerm' || dialog?.kind === 'editTerm') &&
        (() => {
          const comp = dialog.component
          const editingTermId = dialog.kind === 'editTerm' ? dialog.term.id : null
          const allocatedHours = comp.terms
            .filter((t) => t.id !== editingTermId)
            .reduce((s, t) => s + t.hours, 0)
          return (
            <ComponentTermDialog
              open
              onOpenChange={(o) => !o && closeDialog()}
              componentName={comp.name}
              semesterNumber={
                dialog.kind === 'addTerm' ? dialog.semesterNumber : dialog.term.semesterNumber
              }
              totalHours={comp.totalHours}
              allocatedHours={allocatedHours}
              initialData={dialog.kind === 'editTerm' ? dialog.term : undefined}
              isPending={createTerm.isPending || updateTerm.isPending || deleteTerm.isPending}
              onSubmit={(data) => {
                if (dialog.kind === 'editTerm') {
                  updateTerm.mutate({ termId: dialog.term.id, versionId, data }, { onSuccess: closeDialog })
                } else {
                  createTerm.mutate(
                    {
                      componentId: comp.id,
                      versionId,
                      data: { semesterNumber: dialog.semesterNumber, ...data },
                    },
                    { onSuccess: closeDialog },
                  )
                }
              }}
              onDelete={
                dialog.kind === 'editTerm'
                  ? () => deleteTerm.mutate({ termId: dialog.term.id, versionId }, { onSuccess: closeDialog })
                  : undefined
              }
            />
          )
        })()}

      <Dialog
        open={dialog?.kind === 'deleteSection'}
        onOpenChange={(o) => !o && closeDialog()}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Видалити розділ?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'deleteSection' && (
                <>Розділ «{dialog.section.name}» буде видалено. Відновити неможливо.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Скасувати</Button>
            <Button
              variant="destructive"
              disabled={anyPending}
              onClick={() => {
                if (dialog?.kind !== 'deleteSection') return
                deleteSection.mutate({ sectionId: dialog.section.id, versionId }, { onSuccess: closeDialog })
              }}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.kind === 'deleteComponent'}
        onOpenChange={(o) => !o && closeDialog()}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Видалити компонент?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'deleteComponent' && (
                <>Компонент «{dialog.component.name}» та всі його семестри будуть видалені.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Скасувати</Button>
            <Button
              variant="destructive"
              disabled={anyPending}
              onClick={() => {
                if (dialog?.kind !== 'deleteComponent') return
                deleteComponent.mutate(
                  { componentId: dialog.component.id, versionId },
                  { onSuccess: closeDialog },
                )
              }}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add projection dialog ─────────────────────────────────────────────── */}
      {dialog?.kind === 'addProjection' && (() => {
        // Sections already projected to for this component
        const existingProjectedSectionIds = new Set(
          sections
            .filter((s) => s.components.some((c) => c.isProjected && c.id === dialog.component.id))
            .map((s) => s.id),
        )
        // Available target sections (exclude primary section and already-projected ones)
        const availableSections = sections.filter(
          (s) => s.id !== dialog.component.sectionId && !existingProjectedSectionIds.has(s.id),
        )
        return (
          <AddProjectionDialog
            open
            onOpenChange={(o) => !o && closeDialog()}
            component={dialog.component}
            availableSections={availableSections}
            isPending={createProjection.isPending}
            onConfirm={(targetSectionId) => {
              createProjection.mutate(
                {
                  versionId,
                  data: { componentId: dialog.component.id, targetSectionId, displayMarker: '*' },
                },
                { onSuccess: closeDialog },
              )
            }}
          />
        )
      })()}

      {/* ── Delete projection dialog ──────────────────────────────────────────── */}
      <Dialog
        open={dialog?.kind === 'deleteProjection'}
        onOpenChange={(o) => !o && closeDialog()}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Видалити відображення з розділу?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'deleteProjection' && (
                <>
                  Компонент «{dialog.componentName}» більше не відображатиметься в цьому розділі.
                  Канонічний компонент та його дані залишаться без змін.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Скасувати</Button>
            <Button
              variant="destructive"
              disabled={anyPending}
              onClick={() => {
                if (dialog?.kind !== 'deleteProjection') return
                deleteProjection.mutate(
                  { projectionId: dialog.projectionId, versionId },
                  { onSuccess: closeDialog },
                )
              }}
            >
              Видалити відображення
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
