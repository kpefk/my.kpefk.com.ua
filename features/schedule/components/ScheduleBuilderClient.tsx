'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Copy,
  Download,
  Lock,
  Settings2,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useUser } from '@/store/auth.store'

import {
  downloadScheduleIcs,
  useAvailableSubjects,
  useEligibleGroups,
  useGenerateSchedule,
  usePublishSchedule,
  useSchedule,
  useSetHomeroom,
  useSwapEntries,
} from '../api'
import {
  BELL_TIMES,
  HOMEROOM_BELL,
  WORKING_DAYS,
  isVisibleOnParity,
  type ScheduleEntryDto,
} from '../types'
import { ScheduleCell } from './schedule-cell'
import { ScheduleCopyDialog } from './schedule-copy-dialog'
import { ScheduleEntryDialog } from './schedule-entry-dialog'
import { ScheduleSettingsDialog } from './schedule-settings-dialog'

const DISPATCHER_ROLES = [
  'SCHEDULE_DISPATCHER',
  'DEPUTY_DIRECTOR',
  'DIRECTOR',
  'ADMINISTRATOR',
]

/** Поточний навчальний рік: з вересня — новий. */
function currentAcademicYear(): string {
  const now = new Date()
  const y = now.getFullYear()
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

const YEAR_OPTIONS: string[] = (() => {
  const base = new Date().getFullYear()
  return Array.from({ length: 4 }, (_, i) => {
    const y = base - 2 + i
    return `${y}-${y + 1}`
  })
})()

export function ScheduleBuilderClient() {
  const user = useUser()
  const canManage = !!user && DISPATCHER_ROLES.includes(user.role)

  const [academicYear, setAcademicYear] = useState(currentAcademicYear())
  const [groupId, setGroupId] = useState('')
  const [semester, setSemester] = useState<number | null>(null)
  const [parityView, setParityView] = useState<'ODD' | 'EVEN'>('ODD')

  // Діалог додавання/редагування
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<ScheduleEntryDto | undefined>()
  const [draftCell, setDraftCell] = useState<{ day: number; slot: number }>()

  const { data: groups = [], isLoading: groupsLoading } = useEligibleGroups(academicYear)
  const selectedGroup = groups.find((g) => g.groupId === groupId)

  // Семестри з РНП обраної групи.
  const semesterOptions = selectedGroup?.semesterNumbers ?? []
  const effectiveSemester =
    semester ?? semesterOptions[0] ?? 1

  const { data: response, isLoading: scheduleLoading } = useSchedule(
    groupId,
    academicYear,
    effectiveSemester,
  )
  const { data: subjects = [] } = useAvailableSubjects(
    groupId,
    academicYear,
    effectiveSemester,
    dialogOpen,
  )

  const generateMut = useGenerateSchedule()
  const publishMut = usePublishSchedule()
  const swapMut = useSwapEntries()
  const homeroomMut = useSetHomeroom()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const isAdmin = user?.role === 'ADMINISTRATOR'

  const schedule = response?.schedule ?? null
  const entries = schedule?.entries ?? []
  const hasConflicts = entries.some((e) => e.conflicts.length > 0)

  function setHomeroomDay(day: number) {
    if (!groupId) return
    const next = schedule?.homeroomDayOfWeek === day ? null : day
    homeroomMut.mutate({
      groupId,
      academicYear,
      semesterNumber: effectiveSemester,
      dayOfWeek: next,
    })
  }

  // Індекс: `${day}:${slot}` → видимі заняття для обраної парності.
  const cellIndex = useMemo(() => {
    const map = new Map<string, ScheduleEntryDto[]>()
    for (const e of entries) {
      if (!isVisibleOnParity(e.weekParity, parityView)) continue
      const key = `${e.dayOfWeek}:${e.slotNumber}`
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    return map
  }, [entries, parityView])

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="font-semibold">Доступ обмежено</p>
          <p className="text-sm text-muted-foreground">
            Конструктор розкладу доступний диспетчеру розкладу та керівництву.
          </p>
        </div>
      </div>
    )
  }

  function openAdd(day: number, slot: number) {
    setEditEntry(undefined)
    setDraftCell({ day, slot })
    setDialogOpen(true)
  }

  function openEdit(entry: ScheduleEntryDto) {
    setEditEntry(entry)
    setDraftCell(undefined)
    setDialogOpen(true)
  }

  const noWorkingCurriculum =
    !!selectedGroup && !selectedGroup.hasWorkingCurriculum

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Конструктор розкладу
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {selectedGroup
              ? `${selectedGroup.groupName} • ${academicYear} • семестр ${effectiveSemester}`
              : 'Автоматичне складання розкладу з робочого навчального плану'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              title="Налаштування розкладу (ліміти пар)"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          )}
          {groupId && selectedGroup?.hasWorkingCurriculum && (
            <>
              {schedule && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCopyOpen(true)}
                    title="Скопіювати розклад як шаблон"
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    Копіювати
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadScheduleIcs(groupId, academicYear, effectiveSemester)
                    }
                    title="Експорт у календар (.ics)"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    .ics
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  generateMut.mutate({ groupId, academicYear, semesterNumber: effectiveSemester })
                }
                disabled={generateMut.isPending}
              >
                {generateMut.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1.5" />
                )}
                Згенерувати
              </Button>
              {schedule && (
                <Button
                  variant={schedule.status === 'PUBLISHED' ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() =>
                    publishMut.mutate({
                      id: schedule.id,
                      publish: schedule.status !== 'PUBLISHED',
                    })
                  }
                  disabled={
                    publishMut.isPending ||
                    (schedule.status !== 'PUBLISHED' && hasConflicts)
                  }
                  title={
                    schedule.status !== 'PUBLISHED' && hasConflicts
                      ? 'Спочатку виправте конфлікти'
                      : undefined
                  }
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {schedule.status === 'PUBLISHED' ? 'Опубліковано' : 'Опублікувати'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Група</label>
          {groupsLoading ? (
            <Skeleton className="h-9 w-[220px]" />
          ) : (
            <Select
              value={groupId || undefined}
              onValueChange={(v) => {
                setGroupId(v)
                setSemester(null)
              }}
            >
              <SelectTrigger className="h-9 min-w-[220px]">
                <SelectValue placeholder="— Оберіть групу —" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.groupId} value={g.groupId}>
                    {g.groupName}
                    {!g.hasWorkingCurriculum && ' (немає РНП)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Навчальний рік</label>
          <Select
            value={academicYear}
            onValueChange={(v) => {
              setAcademicYear(v)
              setGroupId('')
              setSemester(null)
            }}
          >
            <SelectTrigger className="h-9 min-w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {semesterOptions.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Семестр</label>
            <Select
              value={String(effectiveSemester)}
              onValueChange={(v) => setSemester(Number(v))}
            >
              <SelectTrigger className="h-9 min-w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semesterOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    Семестр {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Перемикач парності */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Тиждень</label>
          <div className="flex rounded-md border border-border p-0.5 h-9">
            {(['ODD', 'EVEN'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setParityView(p)}
                className={cn(
                  'px-3 text-sm rounded-[5px] transition-colors',
                  parityView === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p === 'ODD' ? 'Непарний' : 'Парний'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {!groupId ? (
        <EmptyHint
          icon={<CalendarRange className="w-10 h-10 opacity-30" />}
          text="Оберіть групу, щоб переглянути або скласти розклад"
        />
      ) : noWorkingCurriculum ? (
        <WarningBanner
          text={
            `Для групи «${selectedGroup?.groupName}» не заповнено робочий навчальний план на ${academicYear}. ` +
            'Спочатку прив’яжіть РНП у розділі «Навчальні плани», потім поверніться сюди.'
          }
        />
      ) : scheduleLoading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : (
        <>
          {response && response.warnings.length > 0 && !schedule && (
            <WarningBanner text={response.warnings.join(' ')} />
          )}

          {!schedule ? (
            <div className="rounded-lg border border-border bg-card p-10 flex flex-col items-center gap-3 text-center">
              <Sparkles className="w-10 h-10 text-primary/40" />
              <p className="font-semibold">Розклад ще не складено</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Натисніть «Згенерувати», щоб автоматично скласти розклад з РНП та
                педагогічного навантаження, або додайте заняття вручну.
              </p>
              <Button
                onClick={() =>
                  generateMut.mutate({
                    groupId,
                    academicYear,
                    semesterNumber: effectiveSemester,
                  })
                }
                disabled={generateMut.isPending}
              >
                {generateMut.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1.5" />
                )}
                Згенерувати розклад
              </Button>
            </div>
          ) : (
            <ScheduleGrid
              cellIndex={cellIndex}
              onAdd={openAdd}
              onEdit={openEdit}
              onSwap={(a, b) => swapMut.mutate({ entryAId: a, entryBId: b })}
              hasConflicts={hasConflicts}
              homeroomDay={schedule.homeroomDayOfWeek}
              onSetHomeroomDay={setHomeroomDay}
            />
          )}
        </>
      )}

      {dialogOpen && groupId && (
        <ScheduleEntryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          context={{ groupId, academicYear, semesterNumber: effectiveSemester }}
          subjects={subjects}
          entry={editEntry}
          defaultDay={draftCell?.day}
          defaultSlot={draftCell?.slot}
        />
      )}

      <ScheduleSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {schedule && (
        <ScheduleCopyDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          fromScheduleId={schedule.id}
          defaultYear={academicYear}
          yearOptions={YEAR_OPTIONS}
        />
      )}
    </div>
  )
}

// ─── Grid ───────────────────────────────────────────────────────────────────

function ScheduleGrid({
  cellIndex,
  onAdd,
  onEdit,
  onSwap,
  hasConflicts,
  homeroomDay,
  onSetHomeroomDay,
}: {
  cellIndex: Map<string, ScheduleEntryDto[]>
  onAdd: (day: number, slot: number) => void
  onEdit: (entry: ScheduleEntryDto) => void
  onSwap: (entryAId: string, entryBId: string) => void
  hasConflicts: boolean
  homeroomDay: number | null
  onSetHomeroomDay: (day: number) => void
}) {
  const dragEntryId = useRef<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const handleDragStart = useCallback((entryId: string) => {
    dragEntryId.current = entryId
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, cellKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(cellKey)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropTarget(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetEntryId: string | null) => {
      e.preventDefault()
      setDropTarget(null)
      const sourceId = dragEntryId.current
      dragEntryId.current = null
      if (!sourceId || !targetEntryId || sourceId === targetEntryId) return
      onSwap(sourceId, targetEntryId)
    },
    [onSwap],
  )

  return (
    <div className="space-y-2">
      {hasConflicts && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Розклад містить конфлікти (виділені червоним). Виправте їх перед публікацією.
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[820px]">
          {/* Header row */}
          <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-border bg-muted/40">
            <div className="px-2 py-3 text-xs font-medium text-muted-foreground">Пара</div>
            {WORKING_DAYS.map((d) => (
              <div
                key={d.day}
                className="px-2 py-3 text-center text-sm font-semibold border-l border-border"
              >
                {d.long}
              </div>
            ))}
          </div>

          {/* Slot rows */}
          {BELL_TIMES.map((b) => (
            <div
              key={b.slot}
              className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-border"
            >
              <div className="px-2 py-2 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-bold">{b.slot}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {b.start}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {b.end}
                </span>
              </div>
              {WORKING_DAYS.map((d) => {
                const key = `${d.day}:${b.slot}`
                const cellEntries = cellIndex.get(key) ?? []
                return (
                  <div
                    key={key}
                    className={cn(
                      'p-1.5 border-l border-border transition-colors',
                      dropTarget === key && 'bg-primary/10 ring-2 ring-inset ring-primary/40',
                    )}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      const firstEntry = cellEntries[0]
                      handleDrop(e, firstEntry?.id ?? null)
                    }}
                  >
                    <ScheduleCell
                      entries={cellEntries}
                      onAdd={() => onAdd(d.day, b.slot)}
                      onEdit={onEdit}
                      onDragStart={handleDragStart}
                    />
                  </div>
                )
              })}
            </div>
          ))}

          {/* Виховна година (ТЗ §3.5) — один фіксований слот на тиждень.
              Клік по дню призначає/прибирає виховну годину для групи. */}
          <div className="grid grid-cols-[64px_repeat(5,1fr)] bg-muted/20">
            <div className="px-2 py-2 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-muted-foreground leading-tight">Вих.</span>
              <span className="text-[10px] font-semibold text-muted-foreground leading-tight">год.</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{HOMEROOM_BELL.start}</span>
            </div>
            {WORKING_DAYS.map((d) => {
              const active = homeroomDay === d.day
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => onSetHomeroomDay(d.day)}
                  title={
                    active
                      ? 'Прибрати виховну годину з цього дня'
                      : 'Призначити виховну годину на цей день'
                  }
                  className={cn(
                    'p-1.5 border-l border-border flex items-center justify-center gap-1.5 min-h-[48px] transition-colors',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground/40 hover:bg-muted/40 hover:text-muted-foreground',
                  )}
                >
                  {active ? (
                    <>
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs">Виховна година</span>
                    </>
                  ) : (
                    <span className="text-[11px] italic">+ виховна</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Small UI ────────────────────────────────────────────────────────────────

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground rounded-lg border border-border">
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  )
}

function WarningBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-950/30 p-4">
      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <p className="text-sm text-amber-800 dark:text-amber-200">{text}</p>
    </div>
  )
}
