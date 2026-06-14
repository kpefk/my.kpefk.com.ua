'use client'

import { useState } from 'react'
import { Clock, DoorOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockWeekSchedule } from '@/lib/mock-data'
import type { ScheduleEvent } from '@/lib/types'

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const TYPE_LABEL: Record<ScheduleEvent['type'], string> = {
  lecture: 'Лекція',
  practice: 'Практика',
  lab: 'Лабораторна',
  seminar: 'Семінар',
}

const TYPE_COLOR: Record<ScheduleEvent['type'], string> = {
  lecture: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  practice: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  lab: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  seminar: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

function getWeekDates(): Date[] {
  const today = new Date()
  const dow = today.getDay()
  const toMon = dow === 0 ? -6 : 1 - dow
  const mon = new Date(today)
  mon.setDate(today.getDate() + toMon)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth()
}

export function ScheduleClient() {
  const today = new Date()
  const todayDow = today.getDay()
  const todayWeekday = todayDow === 0 ? 7 : todayDow
  const defaultTab = todayWeekday >= 1 && todayWeekday <= 6 ? todayWeekday : 1

  const [activeDay, setActiveDay] = useState(defaultTab)
  const weekDates = getWeekDates()
  const lessons = mockWeekSchedule[activeDay] ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl font-bold mb-1">Розклад</h1>
      <p className="text-sm text-muted-foreground mb-5">Поточний тиждень</p>

      <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-6 overflow-x-auto">
        {DAYS_SHORT.map((label, i) => {
          const weekday = i + 1
          const date = weekDates[i]
          const isToday = date ? isSameDay(date, today) : false
          const active = activeDay === weekday
          const hasLessons = (mockWeekSchedule[weekday] ?? []).length > 0

          return (
            <button
              key={weekday}
              onClick={() => setActiveDay(weekday)}
              className={cn(
                'flex-1 min-w-[44px] flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all text-xs font-medium relative',
                active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className={cn('font-semibold', isToday && !active && 'text-primary')}>{label}</span>
              <span className={cn('tabular-nums', active ? 'text-foreground' : 'text-muted-foreground/70')}>
                {date?.getDate()}
              </span>
              {hasLessons && (
                <span className={cn('w-1 h-1 rounded-full', active ? 'bg-primary' : 'bg-muted-foreground/40')} />
              )}
            </button>
          )
        })}
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🎉</span>
          <p className="font-semibold">Занять немає</p>
          <p className="text-sm text-muted-foreground">Гарного відпочинку!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex gap-4">
              <div className="shrink-0 flex flex-col items-center gap-1 min-w-[40px]">
                <span className="w-7 h-7 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center">
                  {lesson.lessonNumber}
                </span>
                <div className="flex-1 w-px bg-border" />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm leading-snug">{lesson.subject}</p>
                  <span className={cn('shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full', TYPE_COLOR[lesson.type])}>
                    {TYPE_LABEL[lesson.type]}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    {lesson.startTime} – {lesson.endTime}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DoorOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                    Аудиторія {lesson.room}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    {lesson.teacher}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
