'use client'

import { useCallback, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  Award,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GraduationCap,
  ListOrdered,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useUser } from '@/store/auth.store'

import {
  diplomaKeys,
  useBatchApplyTemplate,
  useBatches,
  useGradeSheet,
  useSetGrades,
  useSetTemplateComponents,
  useSyncEntryDocuments,
  useTemplate,
  useTemplates,
} from '../api'
import {
  COMPONENT_TYPE_LABELS,
  GRADE_LABELS,
  VARIANT_LABELS,
  isCreditScale,
  type DiplomaComponentType,
  type DiplomaControlForm,
  type DiplomaGrade,
  type GradeSheetColumn,
  type GradeSheetData,
  type GradeSheetGroup,
  type GradeSheetRow,
  type TemplateComponent,
} from '../types'

// ── Grade scales & keyboard mapping ─────────────────────────────────────────────

// Диференційована шкала: 5 → Відмінно, 4 → Добре, 3 → Задовільно.
const DIFF_KEY_TO_GRADE: Record<string, DiplomaGrade> = {
  '5': 'EXCELLENT',
  '4': 'GOOD',
  '3': 'SATISFACTORY',
}
// Зараховано: клавіші «з»/«z»/«+».
const CREDIT_KEYS = new Set(['з', 'З', 'z', 'Z', '+'])
const CLEAR_KEYS = new Set(['0', 'Backspace', 'Delete'])

/** Клік по комірці циклічно змінює оцінку у межах шкали ОК. */
function cycleGrade(current: DiplomaGrade | null, credit: boolean): DiplomaGrade | null {
  if (credit) return current ? null : 'PASSED'
  const order: (DiplomaGrade | null)[] = [null, 'EXCELLENT', 'GOOD', 'SATISFACTORY']
  return order[(order.indexOf(current) + 1) % order.length] ?? null
}

const GRADE_CELL_STYLE: Record<DiplomaGrade, string> = {
  EXCELLENT:    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  GOOD:         'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  SATISFACTORY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  PASSED:       'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
}
const GRADE_ABBR: Record<DiplomaGrade, string> = {
  EXCELLENT: '5', GOOD: '4', SATISFACTORY: '3', PASSED: 'Зар',
}

type LocalGrades = Record<string, Record<number, DiplomaGrade | null>>

// ── Grade cell ─────────────────────────────────────────────────────────────────

function GradeCell({
  grade,
  credit,
  onClick,
  onKeyDown,
  cellId,
  rowIdx,
  colIdx,
  pending,
}: {
  grade: DiplomaGrade | null
  credit: boolean
  onClick: () => void
  onKeyDown: (e: KeyboardEvent<HTMLTableCellElement>, rowIdx: number, colIdx: number) => void
  cellId: string
  rowIdx: number
  colIdx: number
  pending?: boolean
}) {
  return (
    <td
      tabIndex={0}
      data-cell={cellId}
      onClick={pending ? undefined : onClick}
      onKeyDown={(e) => onKeyDown(e, rowIdx, colIdx)}
      className={cn(
        'text-center px-0.5 py-1 border-b border-border/40 select-none outline-none',
        'focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-primary/5',
        credit && 'bg-violet-50/40 dark:bg-violet-950/10',
        !pending && 'cursor-pointer hover:bg-muted/40',
      )}
    >
      {grade ? (
        <span
          className={cn(
            'inline-block rounded px-1 py-0.5 text-[10px] font-medium leading-tight',
            GRADE_CELL_STYLE[grade],
          )}
        >
          {GRADE_ABBR[grade]}
        </span>
      ) : (
        <span className="text-muted-foreground/30 text-[10px]">—</span>
      )}
    </td>
  )
}

// ── Column header ──────────────────────────────────────────────────────────────

function ColHeader({ col, onFill }: { col: GradeSheetColumn; onFill: () => void }) {
  const credit = isCreditScale(col.controlForm)
  return (
    <th className="px-0.5 py-1 border-b border-border font-medium w-12 min-w-[44px]">
      <button
        type="button"
        onClick={onFill}
        className={cn(
          'w-full text-[10px] leading-tight text-center hover:text-primary cursor-pointer',
          credit ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground',
        )}
        title={
          col.nameUk +
          (col.nameEn ? `\n${col.nameEn}` : '') +
          (col.ects ? `\n${col.ects} кред.` : '') +
          `\nШкала: ${credit ? 'зараховано/не зараховано' : 'диференційована'}` +
          `\n\nКлік: заповнити колонку (${credit ? 'Зараховано' : 'Відмінно'})`
        }
      >
        {col.code ?? COMPONENT_TYPE_LABELS[col.type]}
      </button>
    </th>
  )
}

// ── One group's grade table ──────────────────────────────────────────────────────

function GradeTable({
  sheetKey,
  columns,
  rows,
  localGrades,
  pendingIds,
  onToggle,
  onCellKeyDown,
  onFillColumn,
}: {
  sheetKey: string
  columns: GradeSheetColumn[]
  rows: GradeSheetRow[]
  localGrades: LocalGrades
  pendingIds: Set<string>
  onToggle: (diplomaId: string, col: GradeSheetColumn) => void
  onCellKeyDown: (e: KeyboardEvent<HTMLTableCellElement>, rowIdx: number, colIdx: number) => void
  onFillColumn: (col: GradeSheetColumn) => void
}) {
  return (
    <div className="overflow-auto rounded-lg border border-border max-h-[calc(100vh-260px)]">
      <table className="text-xs border-collapse min-w-max">
        <thead className="sticky top-0 z-20 bg-card">
          <tr>
            <th className="sticky left-0 z-30 bg-card text-left px-3 py-1.5 font-medium min-w-[210px] border-b border-border border-r border-border/40">
              Студент
            </th>
            {columns.map((c) => (
              <ColHeader key={c.orderIndex} col={c} onFill={() => onFillColumn(c)} />
            ))}
          </tr>
          <tr className="bg-muted/30">
            <th className="sticky left-0 z-30 bg-muted/30 px-3 py-1 text-left text-muted-foreground font-normal border-b border-border/60 border-r border-border/40">
              <span className="text-[10px]">Кредити / шкала</span>
            </th>
            {columns.map((c) => (
              <th key={c.orderIndex} className="px-0.5 py-1 border-b border-border/60 text-center">
                <div className="text-[9px] text-muted-foreground font-normal leading-tight">
                  {c.ects != null ? `${c.ects}` : '—'}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const rowGrades = localGrades[row.diplomaId] ?? {}
            return (
              <tr key={row.diplomaId} className={cn('hover:bg-muted/10', idx % 2 === 0 && 'bg-card')}>
                <td className="sticky left-0 z-10 bg-inherit border-b border-border/40 border-r border-border/40 px-3 py-1.5 whitespace-nowrap">
                  <span className="text-muted-foreground/60 mr-1.5 tabular-nums">{idx + 1}.</span>
                  <span className="font-medium">{row.lastNameUk} {row.firstNameUk}</span>
                  {row.isHonors && <Award className="inline w-3 h-3 ml-1 text-amber-500" />}
                  {pendingIds.has(row.diplomaId) && (
                    <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-muted-foreground" />
                  )}
                </td>
                {columns.map((col, colIdx) => {
                  const cell = row.grades[col.orderIndex]
                  const grade: DiplomaGrade | null =
                    rowGrades[col.orderIndex] !== undefined
                      ? (rowGrades[col.orderIndex] ?? null)
                      : (cell?.grade ?? null)
                  return (
                    <GradeCell
                      key={col.orderIndex}
                      grade={grade}
                      credit={isCreditScale(col.controlForm)}
                      cellId={`${sheetKey}:${idx}:${colIdx}`}
                      rowIdx={idx}
                      colIdx={colIdx}
                      pending={pendingIds.has(row.diplomaId)}
                      onClick={() => onToggle(row.diplomaId, col)}
                      onKeyDown={onCellKeyDown}
                    />
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── ОК structure editor (per group) ─────────────────────────────────────────────

type OkRow = {
  _key: string
  code: string
  nameUk: string
  nameEn: string
  ects: string
  type: DiplomaComponentType
  controlForm: DiplomaControlForm
}

function toOkRows(components: TemplateComponent[]): OkRow[] {
  return components.map((c, i) => ({
    _key: c.id ?? `row-${i}`,
    code: c.code ?? '',
    nameUk: c.nameUk,
    nameEn: c.nameEn ?? '',
    ects: c.ects != null ? String(c.ects) : '',
    type: c.type,
    controlForm: c.controlForm ?? 'EXAM',
  }))
}

function OkEditorSection({
  batchId,
  groupName,
  templateId,
}: {
  batchId: string
  groupName: string
  templateId: string | null
}) {
  const [open, setOpen] = useState(false)
  const [localTemplateId, setLocalTemplateId] = useState<string>(templateId ?? '')
  const [rows, setRows] = useState<OkRow[]>([])
  const [isDirty, setIsDirty] = useState(false)

  const { data: templates = [] } = useTemplates()
  const { data: template } = useTemplate(localTemplateId || null)
  const setComponentsMut = useSetTemplateComponents()
  const applyTemplateMut = useBatchApplyTemplate()

  // Синхронізація серверних даних у локальний редагований стан — під час рендеру,
  // а не в ефекті (React-патерн «adjust state during render»).
  const [prevTemplateId, setPrevTemplateId] = useState(templateId)
  if (templateId !== prevTemplateId) {
    setPrevTemplateId(templateId)
    setLocalTemplateId(templateId ?? '')
  }

  const [seedSource, setSeedSource] = useState<TemplateComponent[] | null>(null)
  if (template && template.components !== seedSource) {
    setSeedSource(template.components)
    setRows(toOkRows(template.components))
    setIsDirty(false)
  } else if (!localTemplateId && seedSource !== null) {
    setSeedSource(null)
    setRows([])
    setIsDirty(false)
  }

  async function handleChangeTemplate(newId: string) {
    setLocalTemplateId(newId)
    await applyTemplateMut.mutateAsync({ batchId, templateId: newId, groupName })
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { _key: `new-${Date.now()}`, code: '', nameUk: '', nameEn: '', ects: '', type: 'REGULAR', controlForm: 'EXAM' },
    ])
    setIsDirty(true)
  }
  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r._key !== key))
    setIsDirty(true)
  }
  function updateRow(key: string, patch: Partial<Omit<OkRow, '_key'>>) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)))
    setIsDirty(true)
  }

  async function handleSaveAndApply() {
    if (!localTemplateId) return
    const components: TemplateComponent[] = rows
      .filter((r) => r.nameUk.trim())
      .map((r, i) => ({
        code: r.code.trim() || null,
        nameUk: r.nameUk.trim(),
        nameEn: r.nameEn.trim() || null,
        ects: r.ects.trim() ? Number(r.ects.replace(',', '.')) : null,
        type: r.type,
        controlForm: r.controlForm,
        orderIndex: i,
      }))
    await setComponentsMut.mutateAsync({ id: localTemplateId, components })
    await applyTemplateMut.mutateAsync({ batchId, templateId: localTemplateId, groupName })
    setIsDirty(false)
  }

  const isBusy = setComponentsMut.isPending || applyTemplateMut.isPending
  const selectedTemplate = templates.find((t) => t.id === localTemplateId)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/40 bg-muted/20 transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-muted-foreground" />
          Структура ОК групи
          {selectedTemplate ? (
            <Badge variant="secondary" className="text-xs font-normal">
              {selectedTemplate.name} · {VARIANT_LABELS[selectedTemplate.variant]}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-400/50 text-xs">
              шаблон не призначено
            </Badge>
          )}
          {isDirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-400/50 text-xs">незбережено</Badge>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 flex flex-col gap-4 border-t border-border bg-card">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Шаблон диплому</label>
            <Select value={localTemplateId || undefined} onValueChange={(v) => void handleChangeTemplate(v)} disabled={isBusy}>
              <SelectTrigger className="h-8 w-64 text-sm">
                <SelectValue placeholder="— Оберіть шаблон —" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} · {VARIANT_LABELS[t.variant]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {applyTemplateMut.isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {localTemplateId && (
            <>
              <div className="overflow-auto rounded border border-border max-h-72">
                <table className="w-full text-xs min-w-[760px]">
                  <thead className="bg-muted/40 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-8">#</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-16">Код</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Назва (укр.)</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Назва (англ.)</th>
                      <th className="px-2 py-1.5 text-center font-medium text-muted-foreground w-14">Кред.</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-24">Тип</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row._key} className="border-t border-border/40 hover:bg-muted/10">
                        <td className="px-2 py-1 text-muted-foreground text-center">{i + 1}</td>
                        <td className="px-1 py-1">
                          <input value={row.code} onChange={(e) => updateRow(row._key, { code: e.target.value })}
                            className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-ring rounded px-1" placeholder="ОК1" />
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.nameUk} onChange={(e) => updateRow(row._key, { nameUk: e.target.value })}
                            className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-ring rounded px-1" placeholder="Назва українською" />
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.nameEn} onChange={(e) => updateRow(row._key, { nameEn: e.target.value })}
                            className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-ring rounded px-1" placeholder="Name in English" />
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.ects} onChange={(e) => updateRow(row._key, { ects: e.target.value })}
                            className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 text-center" placeholder="0" />
                        </td>
                        <td className="px-1 py-1">
                          <select value={row.type} onChange={(e) => updateRow(row._key, { type: e.target.value as DiplomaComponentType })}
                            className="w-full text-xs bg-background border border-input rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring">
                            {(Object.keys(COMPONENT_TYPE_LABELS) as DiplomaComponentType[]).map((t) => (
                              <option key={t} value={t}>{COMPONENT_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-1 py-1 text-center">
                          <button type="button" onClick={() => removeRow(row._key)}
                            className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground text-xs">Додайте освітні компоненти</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addRow} disabled={isBusy}>
                  <Plus className="w-4 h-4 mr-1.5" /> Додати ОК
                </Button>
                <Button size="sm" onClick={() => void handleSaveAndApply()} disabled={!isDirty || isBusy}>
                  {isBusy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Зберегти і застосувати
                </Button>
                {rows.length > 0 && <span className="text-xs text-muted-foreground">{rows.length} компонентів</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── One group section (heading + ОК editor + table) ─────────────────────────────

function GroupSection({
  group,
  index,
  batchId,
  localGrades,
  pendingIds,
  applyGrade,
  onSaveGroup,
}: {
  group: GradeSheetGroup
  index: number
  batchId: string
  localGrades: LocalGrades
  pendingIds: Set<string>
  applyGrade: (diplomaId: string, orderIndex: number, grade: DiplomaGrade | null) => void
  onSaveGroup: (rows: GradeSheetRow[]) => void | Promise<void>
}) {
  const sheetKey = `g${index}`
  const { columns, rows } = group

  const currentGrade = (row: GradeSheetRow, col: GradeSheetColumn): DiplomaGrade | null => {
    const local = localGrades[row.diplomaId]?.[col.orderIndex]
    if (local !== undefined) return local
    return row.grades[col.orderIndex]?.grade ?? null
  }

  function handleToggle(diplomaId: string, col: GradeSheetColumn) {
    const row = rows.find((r) => r.diplomaId === diplomaId)
    if (!row) return
    applyGrade(diplomaId, col.orderIndex, cycleGrade(currentGrade(row, col), isCreditScale(col.controlForm)))
  }

  function handleFillColumn(col: GradeSheetColumn) {
    const fill = isCreditScale(col.controlForm) ? 'PASSED' : 'EXCELLENT'
    for (const row of rows) {
      if (row.grades[col.orderIndex]) applyGrade(row.diplomaId, col.orderIndex, fill)
    }
  }

  function handleCellKeyDown(e: KeyboardEvent<HTMLTableCellElement>, rowIdx: number, colIdx: number) {
    const col = columns[colIdx]
    const row = rows[rowIdx]
    if (!col || !row) return
    const credit = isCreditScale(col.controlForm)

    const focus = (r: number, c: number) => {
      const tr = Math.max(0, Math.min(rows.length - 1, r))
      const tc = Math.max(0, Math.min(columns.length - 1, c))
      document.querySelector<HTMLElement>(`[data-cell="${sheetKey}:${tr}:${tc}"]`)?.focus()
    }

    const key = e.key
    if (CLEAR_KEYS.has(key)) {
      e.preventDefault(); applyGrade(row.diplomaId, col.orderIndex, null); focus(rowIdx + 1, colIdx); return
    }
    switch (key) {
      case 'ArrowDown': case 'Enter': e.preventDefault(); focus(rowIdx + 1, colIdx); return
      case 'ArrowUp': e.preventDefault(); focus(rowIdx - 1, colIdx); return
      case 'ArrowLeft': e.preventDefault(); focus(rowIdx, colIdx - 1); return
      case 'ArrowRight': e.preventDefault(); focus(rowIdx, colIdx + 1); return
    }
    if (credit) {
      if (CREDIT_KEYS.has(key) || key === ' ') {
        e.preventDefault(); applyGrade(row.diplomaId, col.orderIndex, 'PASSED'); focus(rowIdx + 1, colIdx)
      } else if (key in DIFF_KEY_TO_GRADE) {
        e.preventDefault(); toast.error('Цей ОК оцінюється «зараховано/не зараховано» — натисніть «з»')
      }
    } else {
      if (key in DIFF_KEY_TO_GRADE) {
        e.preventDefault(); applyGrade(row.diplomaId, col.orderIndex, DIFF_KEY_TO_GRADE[key]!); focus(rowIdx + 1, colIdx)
      } else if (CREDIT_KEYS.has(key)) {
        e.preventDefault(); toast.error('Цей ОК — диференційована шкала: натисніть 3, 4 або 5')
      }
    }
  }

  const dirtyRows = rows.filter((r) => localGrades[r.diplomaId])
  const groupSaving = dirtyRows.some((r) => pendingIds.has(r.diplomaId))
  const filledStudents = rows.filter((r) =>
    columns.some((c) => currentGrade(r, c) !== null),
  ).length

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border p-4 bg-card/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Група {group.groupName}
            <Badge variant="secondary" className="font-normal">{group.specialityName ?? '—'}</Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rows.length} студ. · {columns.length} ОК · заповнено {filledStudents}/{rows.length}
          </p>
        </div>
        {dirtyRows.length > 0 && (
          <Button size="sm" onClick={() => void onSaveGroup(dirtyRows)} disabled={groupSaving}>
            {groupSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Зберегти відомість ({dirtyRows.length})
          </Button>
        )}
      </div>

      <OkEditorSection batchId={batchId} groupName={group.groupName} templateId={group.templateId} />

      {columns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
          Немає ОК — призначте шаблон і додайте компоненти у «Структурі ОК групи».
        </div>
      ) : (
        <>
          <GradeTable
            sheetKey={sheetKey}
            columns={columns}
            rows={rows}
            localGrades={localGrades}
            pendingIds={pendingIds}
            onToggle={handleToggle}
            onCellKeyDown={handleCellKeyDown}
            onFillColumn={handleFillColumn}
          />
        </>
      )}
    </section>
  )
}

// ── Main client ────────────────────────────────────────────────────────────────

const MANAGE_ROLES = ['DIRECTOR', 'DEPUTY_DIRECTOR', 'ADMINISTRATOR']

export function GradeSheetClient() {
  const user = useUser()
  const canManage = !!user && MANAGE_ROLES.includes(user.role)

  const [batchId, setBatchId] = useState('')
  const [localGrades, setLocalGrades] = useState<LocalGrades>({})
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const qc = useQueryClient()
  const { data: batches = [], isLoading: batchesLoading } = useBatches()
  // Авто-вибір першої партії без setState-в-ефекті.
  const selectedBatchId = batchId || batches[0]?.id || ''
  const { data: sheet, isLoading: sheetLoading } = useGradeSheet(selectedBatchId || undefined)
  const gradesMut = useSetGrades()
  const syncMut = useSyncEntryDocuments()

  function changeBatch(id: string) {
    setBatchId(id)
    setLocalGrades({})
  }

  const allRows: GradeSheetRow[] = sheet ? sheet.groups.flatMap((g) => g.rows) : []

  const applyGrade = useCallback(
    (diplomaId: string, orderIndex: number, grade: DiplomaGrade | null) => {
      setLocalGrades((prev) => {
        const rowGrades = prev[diplomaId] ?? {}
        return { ...prev, [diplomaId]: { ...rowGrades, [orderIndex]: grade } }
      })
    },
    [],
  )

  const handleSaveRow = useCallback(
    async (row: GradeSheetRow) => {
      const overrides = localGrades[row.diplomaId]
      if (!overrides) return
      const grades = Object.entries(overrides)
        .map(([orderIdx, grade]) => {
          const cell = row.grades[Number(orderIdx)]
          return cell ? { componentId: cell.componentId, grade } : null
        })
        .filter((g): g is { componentId: string; grade: DiplomaGrade | null } => g !== null)
      if (grades.length === 0) return

      setPendingIds((prev) => new Set(prev).add(row.diplomaId))
      try {
        await gradesMut.mutateAsync({ id: row.diplomaId, data: { grades } })
        // Записуємо збережені оцінки у кеш зведеної відомості, щоб вони лишились
        // видимими після очищення localGrades (інакше комірка читає стару порожню відомість).
        const savedById = new Map(grades.map((g) => [g.componentId, g.grade]))
        qc.setQueryData<GradeSheetData>(diplomaKeys.gradeSheet(selectedBatchId), (old) =>
          old
            ? {
                groups: old.groups.map((g) => ({
                  ...g,
                  rows: g.rows.map((r) =>
                    r.diplomaId !== row.diplomaId
                      ? r
                      : {
                          ...r,
                          grades: Object.fromEntries(
                            Object.entries(r.grades).map(([oi, cell]) => [
                              oi,
                              savedById.has(cell.componentId)
                                ? { ...cell, grade: savedById.get(cell.componentId) ?? null }
                                : cell,
                            ]),
                          ),
                        },
                  ),
                })),
              }
            : old,
        )
        setLocalGrades((prev) => {
          const next = { ...prev }
          delete next[row.diplomaId]
          return next
        })
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(row.diplomaId)
          return next
        })
      }
    },
    [localGrades, gradesMut, qc, selectedBatchId],
  )

  const handleSaveGroup = useCallback(
    async (rows: GradeSheetRow[]) => {
      for (const row of rows) {
        if (localGrades[row.diplomaId]) await handleSaveRow(row)
      }
    },
    [localGrades, handleSaveRow],
  )

  async function handleSaveAll() {
    await handleSaveGroup(allRows)
  }

  const dirtyCount = Object.keys(localGrades).length

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
        <p className="font-semibold">Доступ обмежено</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            Зведені відомості
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Окрема відомість на групу. У комірці: <kbd className="px-1 rounded bg-muted text-[10px]">3/4/5</kbd> — оцінка,{' '}
            <kbd className="px-1 rounded bg-muted text-[10px]">з</kbd> — зараховано,{' '}
            <kbd className="px-1 rounded bg-muted text-[10px]">0</kbd> — очистити, стрілки/Enter — навігація.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/diplomas/generate">Генерація дипломів <ChevronRight className="w-4 h-4 ml-1" /></Link>
          </Button>
          {selectedBatchId && (
            <Button variant="outline" size="sm" onClick={() => syncMut.mutate(selectedBatchId)} disabled={syncMut.isPending}
              title="Підтягнути з ЄДЕБО документ про освіту (§6.2.2) та період навчання (§7.1)">
              {syncMut.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              Синхронізувати з ЄДЕБО
            </Button>
          )}
          {dirtyCount > 0 && (
            <Button size="sm" onClick={handleSaveAll} disabled={gradesMut.isPending || pendingIds.size > 0}>
              {gradesMut.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Зберегти всі ({dirtyCount})
            </Button>
          )}
        </div>
      </div>

      {/* Batch selector */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Партія</label>
          {batchesLoading ? (
            <Skeleton className="h-9 w-[260px]" />
          ) : (
            <Select value={selectedBatchId || undefined} onValueChange={changeBatch}>
              <SelectTrigger className="h-9 min-w-[260px]">
                <SelectValue placeholder="— Оберіть партію —" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.count}){b.academicYear ? ` • ${b.academicYear}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {sheet && (
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span>{sheet.groups.length} груп · {allRows.length} студ.</span>
            {dirtyCount > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-400/50">{dirtyCount} незбережено</Badge>
            )}
          </div>
        )}
      </div>

      {/* Per-group sheets */}
      {sheetLoading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : !sheet || sheet.groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <GraduationCap className="w-10 h-10 opacity-30" />
          <p className="text-sm">{selectedBatchId ? 'У партії немає дипломів' : 'Оберіть партію'}</p>
        </div>
      ) : (
        sheet.groups.map((g, i) => (
          <GroupSection
            key={g.groupName}
            group={g}
            index={i}
            batchId={selectedBatchId}
            localGrades={localGrades}
            pendingIds={pendingIds}
            applyGrade={applyGrade}
            onSaveGroup={handleSaveGroup}
          />
        ))
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(GRADE_LABELS) as DiplomaGrade[]).map((g) => (
          <span key={g} className="flex items-center gap-1">
            <span className={cn('inline-block rounded px-1.5 py-0.5 text-[10px] font-medium', GRADE_CELL_STYLE[g])}>
              {GRADE_ABBR[g]}
            </span>
            — {GRADE_LABELS[g]}
          </span>
        ))}
        <span className="italic">Фіолетові стовпці — шкала «зараховано»</span>
      </div>
    </div>
  )
}
