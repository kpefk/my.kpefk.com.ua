'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
} from '../api'
import {
  COMPONENT_TYPE_LABELS,
  CONTROL_FORM_SHORT,
  SECTION_TYPE_LABELS,
  type ComponentType,
  type ControlForm,
  type CurriculumComponentDto,
  type CurriculumComponentTermDto,
  type CurriculumSectionDto,
  type CurriculumVersionDetailDto,
  type TimeBudgetEntryDto,
} from '../types'
import { ComponentDialog } from './component-dialog'
import { ComponentTermDialog } from './component-term-dialog'
import { SectionDialog } from './section-dialog'

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
  | null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSemesterCount(sections: CurriculumSectionDto[]): number {
  let max = 0
  for (const section of sections) {
    for (const component of section.components) {
      for (const term of component.terms) {
        if (term.semesterNumber > max) max = term.semesterNumber
      }
    }
  }
  // Always show at least 8 columns so empty cells remain clickable after adding the first term.
  return Math.max(max, 8)
}

function safeEcts(val: string | number | null | undefined): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val ?? ''))
  return Number.isFinite(n) ? n : 0
}

function getSectionHeaderClass(sectionType: CurriculumSectionDto['sectionType']): string {
  const base = 'font-semibold text-xs uppercase tracking-wide'
  switch (sectionType) {
    case 'SECONDARY_EDUCATION':
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

function getComponentRowClass(componentType: ComponentType): string {
  switch (componentType) {
    case 'PRACTICE':
      return 'bg-emerald-50/40 dark:bg-emerald-950/10'
    case 'DIPLOMA_PROJECT':
    case 'QUALIFICATION_WORK_DEFENSE':
    case 'QUALIFICATION_EXAM':
    case 'STATE_EXAM':
      return 'bg-violet-50/40 dark:bg-violet-950/10 font-medium'
    case 'COURSE_WORK':
    case 'COURSE_PROJECT':
      return 'bg-sky-50/30 dark:bg-sky-950/10'
    default:
      return ''
  }
}

function ControlFormCell({ form }: { form: ControlForm }) {
  const label = CONTROL_FORM_SHORT[form]
  if (form === 'NONE' || !form) return <span className="text-muted-foreground/50">—</span>

  const colorClass =
    form === 'EXAM'
      ? 'text-red-600 dark:text-red-400 font-medium'
      : form === 'DIFFERENTIATED_TEST'
        ? 'text-amber-600 dark:text-amber-400'
        : form === 'COURSE_WORK' || form === 'COURSE_PROJECT'
          ? 'text-sky-600 dark:text-sky-400'
          : 'text-foreground'

  return <span className={colorClass}>{label}</span>
}

// ─── Column header / cell ─────────────────────────────────────────────────────

const TH = ({
  children,
  className,
  colSpan,
}: {
  children?: React.ReactNode
  className?: string
  colSpan?: number
}) => (
  <th
    colSpan={colSpan}
    className={cn(
      'px-2 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap border-b border-border text-right',
      className,
    )}
  >
    {children}
  </th>
)

const TD = ({
  children,
  className,
  colSpan,
  onClick,
}: {
  children?: React.ReactNode
  className?: string
  colSpan?: number
  onClick?: () => void
}) => (
  <td
    colSpan={colSpan}
    onClick={onClick}
    className={cn('px-2 py-1.5 text-xs border-b border-border/50', className)}
  >
    {children}
  </td>
)

// ─── Section block ────────────────────────────────────────────────────────────

interface SectionBlockProps {
  section: CurriculumSectionDto
  semesterCount: number
  colSpan: number
  canEdit: boolean
  onAddComponent: () => void
  onDeleteSection: () => void
  onEditComponent: (component: CurriculumComponentDto) => void
  onDeleteComponent: (component: CurriculumComponentDto) => void
  onAddTerm: (component: CurriculumComponentDto, semesterNumber: number) => void
  onEditTerm: (term: CurriculumComponentTermDto, component: CurriculumComponentDto) => void
}

function SectionBlock({
  section,
  semesterCount,
  colSpan,
  canEdit,
  onAddComponent,
  onDeleteSection,
  onEditComponent,
  onDeleteComponent,
  onAddTerm,
  onEditTerm,
}: SectionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const headerClass = getSectionHeaderClass(section.sectionType)

  const sectionTotalEcts = section.components.reduce((sum, c) => sum + safeEcts(c.totalEcts), 0)
  const sectionTotalHours = section.components.reduce((sum, c) => sum + c.totalHours, 0)

  return (
    <>
      {/* Section header row */}
      <tr>
        <td
          colSpan={colSpan}
          className={cn('px-3 py-2 text-left border-b border-border', headerClass)}
        >
          <div className="flex items-center justify-between gap-2">
            {/* Left: chevron + name */}
            <span className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Згорнути розділ' : 'Розгорнути розділ'}
                className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
              >
                <ChevronDown
                  size={14}
                  className={cn('transition-transform duration-200', !isExpanded && '-rotate-90')}
                />
              </button>
              <span className="truncate">
                {section.code && (
                  <span className="font-mono mr-2 opacity-60">{section.code}</span>
                )}
                {section.name}
                {section.sectionType && (
                  <span className="ml-2 text-xs font-normal opacity-60">
                    ({SECTION_TYPE_LABELS[section.sectionType]})
                  </span>
                )}
              </span>
            </span>

            {/* Right: edit actions */}
            {canEdit && (
              <span className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddComponent() }}
                  title="Додати компонент"
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <Plus size={13} />
                </button>
                {section.components.length === 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSection() }}
                    title="Видалити розділ"
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </span>
            )}
          </div>
        </td>
      </tr>

      {/* Component rows — hidden when collapsed */}
      {isExpanded && section.components.map((component) => (
        <ComponentRow
          key={component.id}
          component={component}
          semesterCount={semesterCount}
          sectionType={section.sectionType}
          canEdit={canEdit}
          onEdit={() => onEditComponent(component)}
          onDelete={() => onDeleteComponent(component)}
          onAddTerm={(s) => onAddTerm(component, s)}
          onEditTerm={(term) => onEditTerm(term, component)}
        />
      ))}

      {/* Section subtotal — hidden when collapsed */}
      {isExpanded && section.components.length > 1 && (
        <tr className="bg-muted/30 font-medium">
          <TD className="pl-3 text-xs text-muted-foreground italic" />
          <TD className="text-left text-xs text-muted-foreground">Всього по розділу</TD>
          <TD className="text-right font-mono">{sectionTotalEcts.toFixed(1)}</TD>
          <TD className="text-right font-mono">{sectionTotalHours}</TD>
          <TD />
          {Array.from({ length: semesterCount }).map((_, i) => (
            <TD key={i} className="text-center" />
          ))}
          {canEdit && <TD />}
        </tr>
      )}
    </>
  )
}

// ─── Component row ────────────────────────────────────────────────────────────

interface ComponentRowProps {
  component: CurriculumComponentDto
  semesterCount: number
  sectionType: CurriculumSectionDto['sectionType']
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
  onAddTerm: (semesterNumber: number) => void
  onEditTerm: (term: CurriculumComponentTermDto) => void
}

function ComponentRow({
  component,
  semesterCount,
  sectionType,
  canEdit,
  onEdit,
  onDelete,
  onAddTerm,
  onEditTerm,
}: ComponentRowProps) {
  const isSecondaryEdu = sectionType === 'SECONDARY_EDUCATION'
  const rowClass = getComponentRowClass(component.componentType)
  const termByS = new Map(component.terms.map((t) => [t.semesterNumber, t]))

  const controlForms = component.terms
    .filter((t) => t.controlForm !== 'NONE')
    .map((t) => `${CONTROL_FORM_SHORT[t.controlForm]}(${t.semesterNumber})`)
    .join(', ')

  return (
    <tr className={cn('hover:bg-muted/20 transition-colors group', rowClass)}>
      {/* Code */}
      <TD className="text-center font-mono text-muted-foreground pl-3">
        {component.code ?? '—'}
      </TD>

      {/* Name */}
      <TD className="max-w-[280px] min-w-[180px]">
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              'text-sm leading-tight',
              !component.isMandatory && 'text-amber-700 dark:text-amber-400',
            )}
          >
            {component.name}
          </span>
          {component.componentType !== 'DISCIPLINE' && (
            <span className="text-xs text-muted-foreground/70 italic">
              {COMPONENT_TYPE_LABELS[component.componentType]}
              {component.practiceType === 'EDUCATIONAL' && ' — навчальна'}
              {component.practiceType === 'TECHNOLOGICAL' && ' — технологічна'}
              {component.practiceType === 'PRE_GRADUATION' && ' — переддипломна'}
            </span>
          )}
        </div>
      </TD>

      {/* Total ECTS */}
      <TD className="text-right font-mono text-sm">
        {isSecondaryEdu ? (
          <span className="text-muted-foreground/50">—</span>
        ) : (
          safeEcts(component.totalEcts).toFixed(1)
        )}
      </TD>

      {/* Total hours */}
      <TD className="text-right font-mono text-sm">{component.totalHours}</TD>

      {/* Control forms summary */}
      <TD className="text-center text-xs min-w-[60px]">
        {controlForms || <span className="text-muted-foreground/50">—</span>}
      </TD>

      {/* Semester cells */}
      {Array.from({ length: semesterCount }).map((_, idx) => {
        const s = idx + 1
        const term = termByS.get(s)
        if (!term) {
          return canEdit ? (
            <TD
              key={s}
              className="text-center text-muted-foreground/20 cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={() => onAddTerm(s)}
            >
              <Plus size={12} className="mx-auto opacity-0 group-hover:opacity-60 transition-opacity" />
            </TD>
          ) : (
            <TD key={s} className="text-center text-muted-foreground/30">·</TD>
          )
        }
        return (
          <TD
            key={s}
            className={cn(
              'text-center min-w-[64px]',
              canEdit && 'cursor-pointer hover:bg-primary/5 transition-colors',
            )}
            onClick={canEdit ? () => onEditTerm(term) : undefined}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-xs leading-tight font-medium">
                {isSecondaryEdu ? (
                  <span className="text-muted-foreground/50">—</span>
                ) : (
                  safeEcts(term.ects).toFixed(1)
                )}
              </span>
              <span className="text-xs text-muted-foreground/70 leading-tight">
                {term.hours}год
              </span>
              <ControlFormCell form={term.controlForm} />
              {(term.hasCourseWork || term.hasCourseProject) && (
                <span className="text-xs text-sky-500">
                  {term.hasCourseWork ? 'КР' : 'КП'}
                </span>
              )}
            </div>
          </TD>
        )
      })}

      {/* Edit/delete actions */}
      {canEdit && (
        <TD className="text-center whitespace-nowrap">
          <span className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              title="Редагувати"
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={onDelete}
              title="Видалити"
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </span>
        </TD>
      )}
    </tr>
  )
}

// ─── Time Budget Table ────────────────────────────────────────────────────────

function TimeBudgetBlock({ entries }: { entries: TimeBudgetEntryDto[] }) {
  if (!entries.length) return null
  return (
    <div className="mt-6 px-4 sm:px-6">
      <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide text-xs">
        Зведені дані за бюджетом часу
      </h3>
      <div className="rounded-lg border border-border overflow-hidden w-fit">
        <table className="text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Вид</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                Годин
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                ЄКТС
              </th>
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

// ─── Grand total row ──────────────────────────────────────────────────────────

function GrandTotalRow({
  sections,
  semesterCount,
  canEdit,
}: {
  sections: CurriculumSectionDto[]
  semesterCount: number
  canEdit: boolean
}) {
  const totalEcts = sections
    .flatMap((s) => s.components)
    .filter((c) => {
      const sec = sections.find((s) => s.components.some((comp) => comp.id === c.id))
      return sec?.sectionType !== 'SECONDARY_EDUCATION'
    })
    .reduce((sum, c) => sum + safeEcts(c.totalEcts), 0)

  const totalHours = sections
    .flatMap((s) => s.components)
    .reduce((sum, c) => sum + c.totalHours, 0)

  const semesterTotals = Array.from({ length: semesterCount }, (_, idx) => {
    const s = idx + 1
    const ects = sections
      .flatMap((sec) =>
        sec.sectionType !== 'SECONDARY_EDUCATION'
          ? sec.components.flatMap((c) => c.terms)
          : [],
      )
      .filter((t) => t.semesterNumber === s)
      .reduce((sum, t) => sum + safeEcts(t.ects), 0)
    const hours = sections
      .flatMap((sec) => sec.components)
      .flatMap((c) => c.terms)
      .filter((t) => t.semesterNumber === s)
      .reduce((sum, t) => sum + t.hours, 0)
    return { ects, hours }
  })

  return (
    <tr className="bg-muted/60 font-semibold border-t-2 border-border">
      <TD className="text-center text-muted-foreground" />
      <TD className="text-left pl-3 text-sm">ВСЬОГО по плану</TD>
      <TD className="text-right font-mono text-sm">{totalEcts.toFixed(1)}</TD>
      <TD className="text-right font-mono text-sm">{totalHours}</TD>
      <TD />
      {semesterTotals.map((st, i) => (
        <TD key={i} className="text-center">
          <div className="flex flex-col items-center">
            <span className="font-mono text-xs font-semibold">{st.ects.toFixed(1)}</span>
            <span className="font-mono text-xs text-muted-foreground">{st.hours}год</span>
          </div>
        </TD>
      ))}
      {canEdit && <TD />}
    </tr>
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
  const semesterCount = useMemo(
    () => getSemesterCount(version?.sections ?? []),
    [version?.sections],
  )
  const totalCols = 5 + semesterCount + (canEdit ? 1 : 0)

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<DialogState>(null)
  const closeDialog = () => setDialog(null)

  // ── Mutations ──────────────────────────────────────────────────────────────
  const versionId = version?.id ?? ''

  const createSection = useCreateSection()
  const updateSection = useUpdateSection()
  const deleteSection = useDeleteSection()
  const createComponent = useCreateComponent()
  const updateComponent = useUpdateComponent()
  const deleteComponent = useDeleteComponent()
  const createTerm = useCreateComponentTerm()
  const updateTerm = useUpdateComponentTerm()
  const deleteTerm = useDeleteComponentTerm()

  const anyPending =
    createSection.isPending ||
    updateSection.isPending ||
    deleteSection.isPending ||
    createComponent.isPending ||
    updateComponent.isPending ||
    deleteComponent.isPending ||
    createTerm.isPending ||
    updateTerm.isPending ||
    deleteTerm.isPending

  // ── Helpers ────────────────────────────────────────────────────────────────
  const nextSectionOrder = (version?.sections.length ?? 0)
  const nextComponentOrder = (section: CurriculumSectionDto) => section.components.length

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
      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <colgroup>
            <col style={{ width: 48 }} />
            <col style={{ minWidth: 200 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 80 }} />
            {Array.from({ length: semesterCount }).map((_, i) => (
              <col key={i} style={{ width: 72 }} />
            ))}
            {canEdit && <col style={{ width: 56 }} />}
          </colgroup>

          <thead className="sticky top-0 z-10 bg-card">
            {/* Semester group header */}
            <tr>
              <TH colSpan={5} className="text-left pl-3 border-r border-border">
                Освітній компонент
              </TH>
              <TH colSpan={semesterCount + (canEdit ? 1 : 0)} className="text-center border-border">
                Розподіл за семестрами
              </TH>
            </tr>

            {/* Column headers */}
            <tr className="bg-muted/30">
              <TH className="text-center pl-3 w-12">Код</TH>
              <TH className="text-left pl-2 min-w-[180px]">Назва</TH>
              <TH className="whitespace-nowrap">ЄКТС</TH>
              <TH className="whitespace-nowrap">Годин</TH>
              <TH className="whitespace-nowrap text-center">Контроль</TH>
              {Array.from({ length: semesterCount }).map((_, i) => (
                <TH key={i} className="text-center font-semibold text-foreground">
                  С{i + 1}
                </TH>
              ))}
              {canEdit && <TH className="text-center">Дії</TH>}
            </tr>
          </thead>

          <tbody>
            {version.sections
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  semesterCount={semesterCount}
                  colSpan={totalCols}
                  canEdit={canEdit}
                  onAddComponent={() => setDialog({ kind: 'addComponent', section })}
                  onDeleteSection={() => setDialog({ kind: 'deleteSection', section })}
                  onEditComponent={(component) => setDialog({ kind: 'editComponent', component })}
                  onDeleteComponent={(component) =>
                    setDialog({ kind: 'deleteComponent', component })
                  }
                  onAddTerm={(component, semesterNumber) =>
                    setDialog({ kind: 'addTerm', component, semesterNumber })
                  }
                  onEditTerm={(term, component) => setDialog({ kind: 'editTerm', term, component })}
                />
              ))}

            <GrandTotalRow
              sections={version.sections}
              semesterCount={semesterCount}
              canEdit={canEdit}
            />
          </tbody>
        </table>
      </div>

      {/* Add section button */}
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

      {/* Time budget summary */}
      <TimeBudgetBlock entries={version.timeBudgetEntries} />

      {/* Legend */}
      <div className="px-4 sm:px-6 py-4 mt-2 border-t border-border/50">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-red-600 dark:text-red-400">Е</span> — Екзамен
          </span>
          <span>
            <span className="font-medium">З</span> — Залік
          </span>
          <span>
            <span className="font-medium text-amber-600 dark:text-amber-400">ДЗ</span> — Диф. залік
          </span>
          <span>
            <span className="font-medium text-sky-600 dark:text-sky-400">КР</span> — Курсова робота
          </span>
          <span>
            <span className="font-medium text-sky-600 dark:text-sky-400">КП</span> — Курсовий проект
          </span>
          <span>
            <span className="italic text-amber-700 dark:text-amber-400">Назва курсивом</span> —
            Вибірковий
          </span>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}

      {/* Add / Edit section */}
      <SectionDialog
        open={dialog?.kind === 'addSection' || dialog?.kind === 'editSection'}
        onOpenChange={(open) => !open && closeDialog()}
        defaultOrderIndex={nextSectionOrder}
        initialData={dialog?.kind === 'editSection' ? dialog.section : undefined}
        isPending={createSection.isPending || updateSection.isPending}
        onSubmit={(data) => {
          if (dialog?.kind === 'editSection') {
            updateSection.mutate(
              { sectionId: dialog.section.id, versionId, data },
              { onSuccess: closeDialog },
            )
          } else {
            createSection.mutate({ versionId, data }, { onSuccess: closeDialog })
          }
        }}
      />

      {/* Add / Edit component */}
      {(dialog?.kind === 'addComponent' || dialog?.kind === 'editComponent') && (
        <ComponentDialog
          open
          onOpenChange={(open) => !open && closeDialog()}
          sectionName={dialog.kind === 'addComponent' ? dialog.section.name : ''}
          sectionType={
            dialog.kind === 'addComponent'
              ? dialog.section.sectionType
              : version.sections.find((s) =>
                  s.components.some((c) => c.id === dialog.component.id),
                )?.sectionType
          }
          defaultOrderIndex={
            dialog.kind === 'addComponent' ? nextComponentOrder(dialog.section) : 0
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

      {/* Add / Edit term */}
      {(dialog?.kind === 'addTerm' || dialog?.kind === 'editTerm') && (() => {
        const comp = dialog.component
        const editingTermId = dialog.kind === 'editTerm' ? dialog.term.id : null
        const allocatedHours = comp.terms
          .filter((t) => t.id !== editingTermId)
          .reduce((sum, t) => sum + t.hours, 0)
        return (
        <ComponentTermDialog
          open
          onOpenChange={(open) => !open && closeDialog()}
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
              updateTerm.mutate(
                { termId: dialog.term.id, versionId, data },
                { onSuccess: closeDialog },
              )
            } else {
              createTerm.mutate(
                {
                  componentId: dialog.component.id,
                  versionId,
                  data: { semesterNumber: dialog.semesterNumber, ...data },
                },
                { onSuccess: closeDialog },
              )
            }
          }}
          onDelete={
            dialog.kind === 'editTerm'
              ? () =>
                  deleteTerm.mutate(
                    { termId: dialog.term.id, versionId },
                    { onSuccess: closeDialog },
                  )
              : undefined
          }
        />
        )
      })()}

      {/* Delete section confirm */}
      <Dialog
        open={dialog?.kind === 'deleteSection'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Видалити розділ?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'deleteSection' && (
                <>Розділ &laquo;{dialog.section.name}&raquo; буде видалено. Відновити неможливо.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              disabled={anyPending}
              onClick={() => {
                if (dialog?.kind !== 'deleteSection') return
                deleteSection.mutate(
                  { sectionId: dialog.section.id, versionId },
                  { onSuccess: closeDialog },
                )
              }}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete component confirm */}
      <Dialog
        open={dialog?.kind === 'deleteComponent'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Видалити компонент?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'deleteComponent' && (
                <>
                  Компонент &laquo;{dialog.component.name}&raquo; та всі його семестри будуть
                  видалені. Відновити неможливо.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Скасувати
            </Button>
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
    </div>
  )
}
