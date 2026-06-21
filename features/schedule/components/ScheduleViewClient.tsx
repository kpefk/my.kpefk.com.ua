'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Printer,
  User,
  Users,
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

import { useAllSchedules, useEligibleGroups, useSchedule } from '../api'
import type { ScheduleDto } from '../types'
import { exportStandingXlsx, printStanding } from '../lib/standing-grid'
import {
  BELL_TIMES,
  HOMEROOM_BELL,
  LESSON_TYPE_COLOR,
  LESSON_TYPE_LABELS,
  WORKING_DAYS,
  isVisibleOnParity,
  type LessonType,
  type ScheduleEntryDto,
  type WeekParity,
} from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ACCENT: Record<LessonType, string> = {
  LECTURE: 'border-l-blue-500',
  PRACTICE: 'border-l-green-500',
  LAB: 'border-l-purple-500',
  SEMINAR: 'border-l-orange-500',
  CONSULTATION: 'border-l-cyan-500',
  SPRS: 'border-l-zinc-500',
}

const SUBGROUP_PILL = [
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
]

function mondayOf(d: Date): Date {
  const date = new Date(d)
  const dow = date.getDay() // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const fmtShort = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' })

/** Навчальний рік для дати: з вересня — новий. */
function academicYearOf(d: Date): string {
  const y = d.getFullYear()
  return d.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

/** Парність навчального тижня: 1-й тиждень від 1 вересня — непарний (чисельник). */
function academicParity(monday: Date): 'ODD' | 'EVEN' {
  const startYear =
    monday.getMonth() >= 8 ? monday.getFullYear() : monday.getFullYear() - 1
  const startMonday = mondayOf(new Date(startYear, 8, 1))
  const weeks = Math.round(
    (monday.getTime() - startMonday.getTime()) / (7 * 24 * 3600 * 1000),
  )
  return weeks % 2 === 0 ? 'ODD' : 'EVEN'
}

// ─── Component ───────────────────────────────────────────────────────────────

/** Sentinel для пункту «Усі групи» в селекторі. */
const ALL_GROUPS = '__all__'

export function ScheduleViewClient() {
  const user = useUser()
  const isStudent = user?.role === 'STUDENT'

  const [groupId, setGroupId] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [view, setView] = useState<'week' | 'day'>('week')

  const today = useMemo(() => new Date(), [])
  const displayedMonday = useMemo(
    () => addDays(mondayOf(today), weekOffset * 7),
    [today, weekOffset],
  )
  const weekDates = useMemo(
    () => WORKING_DAYS.map((d, i) => ({ ...d, date: addDays(displayedMonday, i) })),
    [displayedMonday],
  )

  const academicYear = academicYearOf(displayedMonday)
  const parity = academicParity(displayedMonday)

  const todayWeekday = today.getDay() === 0 ? 7 : today.getDay()
  const [selectedDay, setSelectedDay] = useState(
    todayWeekday >= 1 && todayWeekday <= 5 ? todayWeekday : 1,
  )

  const { data: groups = [], isLoading: groupsLoading } = useEligibleGroups(academicYear)

  const isAllGroups = groupId === ALL_GROUPS

  // Група студента (за назвою з профілю) — для дефолтного вибору.
  const studentGroupId = isStudent
    ? groups.find((g) => g.groupName === user?.student?.groupName)?.groupId ?? ''
    : ''

  // Дефолтний вибір: ручний вибір → група студента → перша з РНП → перша.
  const effectiveGroupId = isAllGroups
    ? ''
    : groupId ||
      studentGroupId ||
      groups.find((g) => g.hasWorkingCurriculum)?.groupId ||
      groups[0]?.groupId ||
      ''
  const selectedGroup = groups.find((g) => g.groupId === effectiveGroupId)

  // Семестр від місяця: вересень–січень — перший у списку, інакше другий.
  // У режимі «Усі групи» це стала сітка — сезон беремо від сьогодні.
  const sems = selectedGroup?.semesterNumbers ?? []
  const seasonDate = isAllGroups ? today : displayedMonday
  const isAutumn = seasonDate.getMonth() >= 8 || seasonDate.getMonth() <= 0
  const semester = (isAutumn ? sems[0] : sems[1]) ?? sems[0] ?? 1

  const { data: response, isLoading } = useSchedule(
    effectiveGroupId,
    academicYear,
    semester,
  )
  const { data: allSchedules = [], isLoading: allLoading } = useAllSchedules(
    academicYear,
    isAllGroups,
  )
  const schedule = response?.schedule ?? null
  const entries = schedule?.entries ?? []

  // Розклади всіх груп для поточного сезону (осінь = непарні семестри, весна = парні).
  const allGroupsForSeason = useMemo(
    () =>
      allSchedules
        .filter((s) =>
          isAutumn ? s.semesterNumber % 2 === 1 : s.semesterNumber % 2 === 0,
        )
        .filter((s) => s.entries.length > 0),
    [allSchedules, isAutumn],
  )

  const cellIndex = useMemo(() => {
    const map = new Map<string, ScheduleEntryDto[]>()
    for (const e of entries) {
      if (!isVisibleOnParity(e.weekParity, parity)) continue
      const key = `${e.dayOfWeek}:${e.slotNumber}`
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.subgroupNumber ?? 0) - (b.subgroupNumber ?? 0))
    }
    return map
  }, [entries, parity])

  function setParity(target: 'ODD' | 'EVEN') {
    if (target !== parity) setWeekOffset((o) => o + 1)
  }

  // Дані для експорту/друку у форматі сталої сітки (як у файлі-зразку).
  const exportSchedules: ScheduleDto[] = isAllGroups
    ? allGroupsForSeason
    : schedule
      ? [schedule]
      : []
  const canExport = exportSchedules.length > 0

  const exportTitle = isAllGroups
    ? `Розклад занять — усі групи (${academicYear}, ${isAutumn ? 'I' : 'II'} семестр)`
    : `Розклад занять — ${selectedGroup?.groupName ?? ''} (${academicYear}, ${semester} семестр)`

  function handleDownload() {
    if (!canExport) return
    const name = isAllGroups ? 'usi-grupy' : selectedGroup?.groupName ?? 'grupa'
    void exportStandingXlsx(
      exportSchedules,
      `Розклад занять ${name} ${academicYear}.xlsx`,
      `${isAutumn ? 'I' : 'II'} семестр`,
      exportTitle,
    )
  }

  function handlePrint() {
    if (!canExport) return
    printStanding(exportSchedules, exportTitle)
  }

  const weekLabel = `${fmtShort.format(displayedMonday)} – ${fmtShort.format(addDays(displayedMonday, 4))}`
  const subLabel =
    weekOffset === 0
      ? 'Поточний тиждень'
      : `${parity === 'ODD' ? 'Непарний' : 'Парний'} тиждень`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Розклад занять</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAllGroups
              ? `Усі групи • ${academicYear} • ${isAutumn ? 'осінній' : 'весняний'} семестр`
              : selectedGroup
                ? `${selectedGroup.groupName} • ${academicYear}, ${semester} семестр`
                : 'Оберіть групу'}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={!canExport}>
            <Download className="w-4 h-4 mr-1.5" />
            Завантажити
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!canExport}>
            <Printer className="w-4 h-4 mr-1.5" />
            Друк
          </Button>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
        {/* Group */}
        {groupsLoading ? (
          <Skeleton className="h-9 w-[220px]" />
        ) : (
          <Select
            value={isAllGroups ? ALL_GROUPS : effectiveGroupId || undefined}
            onValueChange={setGroupId}
          >
            <SelectTrigger className="h-9 min-w-[200px]">
              <Users className="w-4 h-4 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Оберіть групу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GROUPS}>Усі групи</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.groupId} value={g.groupId}>
                  {g.groupName}
                  {!g.hasWorkingCurriculum && ' (немає РНП)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Week nav + parity toggle (для однієї групи; «Усі групи» показує всі дні + обидва тижні) */}
        {!isAllGroups && (
          <>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekOffset((o) => o - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-3 text-center min-w-[150px]">
                <p className="text-sm font-semibold tabular-nums leading-tight">{weekLabel}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{subLabel}</p>
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekOffset((o) => o + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <div className="flex rounded-md border border-border p-0.5 h-9">
                {(['ODD', 'EVEN'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setParity(p)}
                    className={cn(
                      'px-3 text-sm rounded-[5px] transition-colors',
                      parity === p
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {p === 'ODD' ? 'Непарний' : 'Парний'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* View toggle (для однієї групи; «Усі групи» — завжди по днях) */}
        {!isAllGroups && (
          <div className="flex rounded-md border border-border p-0.5 h-9 ml-auto">
            {(['week', 'day'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'px-3 text-sm rounded-[5px] transition-colors',
                  view === v
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v === 'week' ? 'Тиждень' : 'День'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {isAllGroups ? (
        allLoading ? (
          <Skeleton className="h-[480px] w-full" />
        ) : allGroupsForSeason.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center gap-3 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30" />
            <p className="font-semibold">Розкладів ще немає</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Для жодної групи не сформовано розклад на цей семестр.
            </p>
          </div>
        ) : (
          <AllGroupsView schedules={allGroupsForSeason} />
        )
      ) : isLoading ? (
        <Skeleton className="h-[480px] w-full" />
      ) : !schedule ? (
        <div className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center gap-3 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground/30" />
          <p className="font-semibold">Розклад не складено</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {selectedGroup && !selectedGroup.hasWorkingCurriculum
              ? 'Для цієї групи не заповнено робочий навчальний план на цей рік.'
              : 'Для обраної групи та семестру розклад ще не сформовано.'}
          </p>
        </div>
      ) : view === 'week' ? (
        <WeekGrid weekDates={weekDates} today={today} cellIndex={cellIndex} />
      ) : (
        <DayView
          weekDates={weekDates}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          cellIndex={cellIndex}
        />
      )}
    </div>
  )
}

// ─── Week grid ─────────────────────────────────────────────────────────────

function WeekGrid({
  weekDates,
  today,
  cellIndex,
}: {
  weekDates: { day: number; long: string; date: Date }[]
  today: Date
  cellIndex: Map<string, ScheduleEntryDto[]>
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <div className="min-w-[920px]">
        {/* Header */}
        <div className="grid grid-cols-[88px_repeat(5,1fr)] bg-muted/40 border-b border-border">
          <div className="px-3 py-3 text-xs font-medium text-muted-foreground">Час</div>
          {weekDates.map((d) => {
            const isToday = sameDay(d.date, today)
            return (
              <div
                key={d.day}
                className={cn(
                  'px-3 py-3 text-center border-l border-border',
                  isToday && 'bg-primary/10',
                )}
              >
                <p className={cn('text-sm font-semibold', isToday && 'text-primary')}>{d.long}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{fmtShort.format(d.date)}</p>
              </div>
            )
          })}
        </div>

        {/* Rows */}
        {BELL_TIMES.map((b) => (
          <div
            key={b.slot}
            className="grid grid-cols-[88px_repeat(5,1fr)] border-b border-border"
          >
            <div className="px-3 py-3 flex flex-col justify-center">
              <span className="text-sm font-bold">{b.slot} пара</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {b.start} – {b.end}
              </span>
            </div>
            {weekDates.map((d) => {
              const isToday = sameDay(d.date, today)
              return (
                <div
                  key={d.day}
                  className={cn('p-2 border-l border-border', isToday && 'bg-primary/[0.04]')}
                >
                  <LessonCell entries={cellIndex.get(`${d.day}:${b.slot}`) ?? []} />
                </div>
              )
            })}
          </div>
        ))}

        {/* Виховна година */}
        <div className="grid grid-cols-[88px_repeat(5,1fr)] bg-muted/20">
          <div className="px-3 py-3 flex flex-col justify-center">
            <span className="text-sm font-bold text-muted-foreground">Вих. год.</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {HOMEROOM_BELL.start} – {HOMEROOM_BELL.end}
            </span>
          </div>
          {weekDates.map((d) => {
            const isToday = sameDay(d.date, today)
            return (
              <div
                key={d.day}
                className={cn(
                  'p-2 border-l border-border flex items-center justify-center',
                  isToday && 'bg-primary/[0.04]',
                )}
              >
                <span className="text-xs text-muted-foreground/50 italic">Виховна година</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Day view ──────────────────────────────────────────────────────────────

function DayView({
  weekDates,
  selectedDay,
  onSelectDay,
  cellIndex,
}: {
  weekDates: { day: number; long: string; date: Date }[]
  selectedDay: number
  onSelectDay: (d: number) => void
  cellIndex: Map<string, ScheduleEntryDto[]>
}) {
  const lessons = BELL_TIMES.map((b) => ({
    bell: b,
    entries: cellIndex.get(`${selectedDay}:${b.slot}`) ?? [],
  })).filter((l) => l.entries.length > 0)

  return (
    <div>
      <div className="flex gap-1.5 mb-5 overflow-x-auto print:hidden">
        {weekDates.map((d) => (
          <button
            key={d.day}
            type="button"
            onClick={() => onSelectDay(d.day)}
            className={cn(
              'flex-1 min-w-[88px] rounded-xl py-2 text-center transition-colors',
              selectedDay === d.day
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <p className="text-sm font-semibold">{d.long}</p>
            <p className="text-xs tabular-nums opacity-80">{fmtShort.format(d.date)}</p>
          </button>
        ))}
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">🎉</span>
          <p className="font-semibold">Занять немає</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {lessons.map(({ bell, entries }) => (
            <div key={bell.slot} className="flex gap-4">
              <div className="shrink-0 w-20 pt-2 text-right">
                <p className="text-sm font-bold">{bell.slot} пара</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">{bell.start}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">{bell.end}</p>
              </div>
              <div className="flex-1">
                <LessonCell entries={entries} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lesson cell ───────────────────────────────────────────────────────────

function LessonCell({ entries }: { entries: ScheduleEntryDto[] }) {
  const first = entries[0]
  if (!first) {
    return (
      <div className="h-full min-h-[72px] flex items-center justify-center text-muted-foreground/30 text-sm">
        —
      </div>
    )
  }

  const hasSubgroups = entries.some((e) => e.subgroupNumber !== null)

  return (
    <div
      className={cn(
        'h-full rounded-lg border border-l-4 bg-card p-2.5',
        TYPE_ACCENT[first.lessonType],
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-semibold text-sm leading-snug">{first.subjectName}</p>
        <span
          className={cn(
            'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full',
            LESSON_TYPE_COLOR[first.lessonType],
          )}
        >
          {LESSON_TYPE_LABELS[first.lessonType]}
        </span>
      </div>

      {hasSubgroups ? (
        <div className="space-y-1.5">
          {entries.map((e, i) => (
            <div key={e.id} className="rounded-md bg-muted/50 p-1.5">
              <span
                className={cn(
                  'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1',
                  SUBGROUP_PILL[((e.subgroupNumber ?? i + 1) - 1) % SUBGROUP_PILL.length],
                )}
              >
                {e.subgroupNumber ?? i + 1} п/г
              </span>
              <EntryMeta entry={e} />
            </div>
          ))}
        </div>
      ) : (
        <EntryMeta entry={first} />
      )}
    </div>
  )
}

function EntryMeta({ entry }: { entry: ScheduleEntryDto }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <User className="w-3.5 h-3.5 shrink-0 text-primary" />
        <span className="truncate">{entry.teacher?.shortName ?? '—'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
        {entry.classroom ? entry.classroom.number : '—'}
      </div>
    </div>
  )
}

// ─── All groups: стала сітка як у файлі розкладу ─────────────────────────────
// День (вертикально) × Час × [Група: ОК | Ауд. | Викл.]. Кожна пара — два рядки:
// чисельник (зверху) і знаменник (знизу). Щотижневі заняття у знаменнику → «//».

const WEEK_ROWS = ['ODD', 'EVEN'] as const

/** Чіткіша рамка-роздільник між днями. */
const DAY_DIVIDER = 'border-t-2 border-t-foreground/40'

function AllGroupsView({ schedules }: { schedules: ScheduleDto[] }) {
  const groups = useMemo(
    () =>
      schedules.map((s) => {
        const map = new Map<string, ScheduleEntryDto[]>()
        for (const e of s.entries) {
          const key = `${e.dayOfWeek}:${e.slotNumber}`
          const arr = map.get(key) ?? []
          arr.push(e)
          map.set(key, arr)
        }
        for (const arr of map.values()) {
          arr.sort((a, b) => (a.subgroupNumber ?? 0) - (b.subgroupNumber ?? 0))
        }
        return { groupId: s.groupId, groupName: s.groupName, map }
      }),
    [schedules],
  )

  const allBells = [...BELL_TIMES, HOMEROOM_BELL]
  const dayRows = allBells.length * 2

  return (
    <div className="overflow-auto rounded-xl border border-border max-h-[78vh]">
      <table className="border-collapse text-xs">
        <thead className="sticky top-0 z-20">
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-30 bg-muted px-1 py-2 border border-border text-muted-foreground font-medium w-[34px] min-w-[34px]"
            >
              День
            </th>
            <th
              rowSpan={2}
              className="sticky left-[34px] z-30 bg-muted px-2 py-2 border border-border text-muted-foreground font-medium min-w-[76px]"
            >
              Час
            </th>
            {groups.map((g) => (
              <th
                key={g.groupId}
                colSpan={3}
                className="bg-muted px-2 py-1.5 border border-border font-semibold text-center whitespace-nowrap"
              >
                {g.groupName}
              </th>
            ))}
          </tr>
          <tr>
            {groups.map((g) => (
              <Fragment key={g.groupId}>
                <th className="bg-muted/70 px-2 py-1 border border-border font-medium text-muted-foreground min-w-[94px]">
                  ОК
                </th>
                <th className="bg-muted/70 px-1 py-1 border border-border font-medium text-muted-foreground min-w-[32px]">
                  Ауд.
                </th>
                <th className="bg-muted/70 px-2 py-1 border border-border font-medium text-muted-foreground min-w-[74px]">
                  Викл.
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {WORKING_DAYS.map((day) =>
            allBells.map((bell, bi) =>
              WEEK_ROWS.map((week, wi) => {
                const dayStart = bi === 0 && wi === 0
                const isHomeroom = bell.slot === HOMEROOM_BELL.slot
                return (
                  <tr
                    key={`${day.day}-${bell.slot}-${week}`}
                    className={cn(
                      week === 'EVEN' && 'bg-muted/20',
                      isHomeroom && 'bg-muted/10',
                    )}
                  >
                    {dayStart && (
                      <td
                        rowSpan={dayRows}
                        className={cn(
                          'sticky left-0 z-10 bg-card border border-border text-center p-0.5 w-[34px] min-w-[34px]',
                          DAY_DIVIDER,
                        )}
                      >
                        <span className="[writing-mode:vertical-rl] rotate-180 inline-block whitespace-nowrap font-semibold">
                          {day.long}
                        </span>
                      </td>
                    )}
                    {wi === 0 && (
                      <td
                        rowSpan={2}
                        className={cn(
                          'sticky left-[34px] z-10 bg-card border border-border px-2 py-1 text-center align-middle',
                          dayStart && DAY_DIVIDER,
                        )}
                      >
                        <div className="font-bold">{isHomeroom ? 'Вих.' : bell.slot}</div>
                        <div className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                          {bell.start}
                        </div>
                      </td>
                    )}
                    {groups.map((g) => (
                      <StandingCells
                        key={g.groupId}
                        all={g.map.get(`${day.day}:${bell.slot}`) ?? []}
                        week={week}
                        dayStart={dayStart}
                      />
                    ))}
                  </tr>
                )
              }),
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Три клітинки (ОК / Ауд. / Викл.) однієї групи в рядку чисельника або знаменника. */
function StandingCells({
  all,
  week,
  dayStart,
}: {
  all: ScheduleEntryDto[]
  week: 'ODD' | 'EVEN'
  dayStart: boolean
}) {
  const base = cn('border border-border px-1.5 py-1 align-top', dayStart && DAY_DIVIDER)
  const empty = (
    <>
      <td className={base} />
      <td className={base} />
      <td className={base} />
    </>
  )

  const every = all.filter((e) => e.weekParity === 'EVERY')
  const hasWeekSpecific = all.some((e) => e.weekParity !== 'EVERY')

  // Знаменник, коли заняття щотижня однакові → «//» (як у файлі-зразку).
  if (week === 'EVEN' && !hasWeekSpecific) {
    if (every.length === 0) return empty
    return (
      <>
        <td className={cn(base, 'text-center text-muted-foreground')}>//</td>
        <td className={base} />
        <td className={base} />
      </>
    )
  }

  const entries = all.filter((e) => isVisibleOnParity(e.weekParity, week))
  if (entries.length === 0) return empty

  const accent = TYPE_ACCENT[entries[0]!.lessonType]
  return (
    <>
      <td className={cn(base, 'border-l-[3px] font-medium', accent)}>
        {entries.map((e) => (
          <div key={e.id} className="leading-tight">
            {e.subgroupNumber ? (
              <span className="text-muted-foreground">{e.subgroupNumber}пг </span>
            ) : null}
            {e.subjectName}
          </div>
        ))}
      </td>
      <td className={cn(base, 'text-center tabular-nums')}>
        {entries.map((e) => (
          <div key={e.id} className="leading-tight">
            {e.classroom?.number ?? '—'}
          </div>
        ))}
      </td>
      <td className={cn(base, 'whitespace-nowrap')}>
        {entries.map((e) => (
          <div key={e.id} className="leading-tight">
            {e.teacher?.lastName ?? '—'}
          </div>
        ))}
      </td>
    </>
  )
}
