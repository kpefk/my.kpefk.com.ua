'use client'

import { useMemo, useState } from 'react'
import { CalendarRange, DoorOpen, User } from 'lucide-react'

import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { useTeachers } from '@/features/teachers/api'
import { DEFAULT_FILTERS } from '@/features/teachers/types'
import { useClassrooms } from '@/features/classrooms/api'

import { useScheduleByClassroom, useScheduleByTeacher } from '../api'
import {
  BELL_TIMES,
  LESSON_TYPE_COLOR,
  LESSON_TYPE_LABELS,
  WORKING_DAYS,
  isVisibleOnParity,
  type CrossScheduleEntryDto,
} from '../types'

type Mode = 'teacher' | 'classroom'

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

export function ScheduleResourceViewClient() {
  const [mode, setMode] = useState<Mode>('teacher')
  const [resourceId, setResourceId] = useState('')
  const [academicYear, setAcademicYear] = useState(currentAcademicYear())
  const [semester, setSemester] = useState(1)
  const [parityView, setParityView] = useState<'ODD' | 'EVEN'>('ODD')

  const { data: teachers = [] } = useTeachers(DEFAULT_FILTERS)
  const { data: classrooms = [] } = useClassrooms()

  const teacherView = useScheduleByTeacher(
    mode === 'teacher' ? resourceId : '',
    academicYear,
    semester,
  )
  const classroomView = useScheduleByClassroom(
    mode === 'classroom' ? resourceId : '',
    academicYear,
    semester,
  )
  const active = mode === 'teacher' ? teacherView : classroomView
  const entries = active.data ?? []

  const options: ComboboxOption[] =
    mode === 'teacher'
      ? teachers.map((t) => ({
          id: t.id,
          label: [t.lastName, t.firstName, t.middleName].filter(Boolean).join(' '),
          sublabel: t.positionName ?? undefined,
        }))
      : classrooms.map((c) => ({ id: c.id, label: `№${c.number}`, sublabel: c.name }))

  const cellIndex = useMemo(() => {
    const map = new Map<string, CrossScheduleEntryDto[]>()
    for (const e of entries) {
      if (!isVisibleOnParity(e.weekParity, parityView)) continue
      const key = `${e.dayOfWeek}:${e.slotNumber}`
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    return map
  }, [entries, parityView])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Розклад за ресурсом</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Перегляд завантаженості викладача або аудиторії (ТЗ §3.10).
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Розріз</label>
          <div className="flex rounded-md border border-border p-0.5 h-9">
            {(['teacher', 'classroom'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setResourceId('')
                }}
                className={cn(
                  'px-3 text-sm rounded-[5px] transition-colors',
                  mode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m === 'teacher' ? 'Викладач' : 'Аудиторія'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 min-w-[260px]">
          <label className="text-xs font-medium text-muted-foreground">
            {mode === 'teacher' ? 'Викладач' : 'Аудиторія'}
          </label>
          <Combobox
            options={options}
            value={resourceId}
            onChange={setResourceId}
            placeholder={mode === 'teacher' ? 'Оберіть викладача…' : 'Оберіть аудиторію…'}
            clearable
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Рік</label>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Семестр</label>
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Семестр {s}
              </option>
            ))}
          </select>
        </div>

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

      {/* Body */}
      {!resourceId ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground rounded-lg border border-border">
          <CalendarRange className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            Оберіть {mode === 'teacher' ? 'викладача' : 'аудиторію'}, щоб переглянути розклад
          </p>
        </div>
      ) : active.isLoading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[820px]">
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
                </div>
                {WORKING_DAYS.map((d) => {
                  const cell = cellIndex.get(`${d.day}:${b.slot}`) ?? []
                  return (
                    <div
                      key={`${d.day}:${b.slot}`}
                      className="p-1.5 border-l border-border min-h-[72px] space-y-1.5"
                    >
                      {cell.map((e) => (
                        <div
                          key={e.id}
                          className="rounded-lg border border-border bg-card p-2"
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <span className="font-medium text-xs leading-snug line-clamp-2">
                              {e.subjectName}
                            </span>
                            <span
                              className={cn(
                                'shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                                LESSON_TYPE_COLOR[e.lessonType],
                              )}
                            >
                              {LESSON_TYPE_LABELS[e.lessonType]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User className="w-3 h-3 shrink-0 text-primary" />
                            <span className="truncate">{e.groupName}</span>
                          </div>
                          {mode === 'teacher' && e.classroom && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <DoorOpen className="w-3 h-3 shrink-0 text-primary" />
                              ауд. {e.classroom.number}
                            </div>
                          )}
                          {mode === 'classroom' && e.teacher && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="w-3 h-3 shrink-0 text-primary" />
                              {e.teacher.shortName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
