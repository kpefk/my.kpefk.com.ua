'use client'

import { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { useLessons, useOpenSession } from '../api'
import { LessonJournal } from './lesson-journal'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function shiftDay(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return toYMD(d)
}

function formatUaDate(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const month = new Intl.DateTimeFormat('uk-UA', { month: 'long' }).format(d)
  const weekday = new Intl.DateTimeFormat('uk-UA', { weekday: 'long' }).format(d)
  return `${d.getDate()} ${cap(month)}, ${cap(weekday)}`
}

const TODAY = toYMD(new Date())

export function AttendanceClient() {
  const [date, setDate] = useState(TODAY)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedEntryId, setSelectedEntryId] = useState('')

  const { data: lessons = [], isLoading } = useLessons(date)
  const openSession = useOpenSession()

  function changeDate(next: string) {
    setDate(next)
    setSelectedSessionId('')
    setSelectedEntryId('')
  }

  function selectSlot(entryId: string, sessionId: string | null) {
    setSelectedEntryId(entryId)
    if (sessionId) {
      setSelectedSessionId(sessionId)
      return
    }
    const slot = lessons.find((l) => l.scheduleEntryId === entryId)
    if (!slot) return
    openSession.mutate(
      { scheduleEntryId: slot.scheduleEntryId, date },
      { onSuccess: (s) => setSelectedSessionId(s.id) },
    )
  }

  const nextDisabled = date >= TODAY

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* ── Заголовок + навігація днями ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Відвідуваність</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{formatUaDate(date)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => changeDate(shiftDay(date, -1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <input
            type="date"
            value={date}
            max={TODAY}
            onChange={(e) => e.target.value && changeDate(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          />
          {date !== TODAY && (
            <Button variant="outline" size="sm" onClick={() => changeDate(TODAY)}>
              Сьогодні
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            disabled={nextDisabled}
            onClick={() => changeDate(shiftDay(date, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Тіло ── */}
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Calendar size={28} className="text-muted-foreground" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="font-semibold text-foreground">Немає занять</p>
            <p className="text-sm text-muted-foreground">
              На цей день у Вас немає занять. Якщо вважаєте, що це помилка — зверніться
              до диспетчера розкладу.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Кнопки занять дня */}
          <div className="overflow-x-auto">
            <ButtonGroup>
              {lessons.map((l) => {
                const active = selectedEntryId === l.scheduleEntryId
                const opening = openSession.isPending && selectedEntryId === l.scheduleEntryId
                return (
                  <Button
                    key={l.scheduleEntryId}
                    variant={active ? 'default' : 'outline'}
                    onClick={() => selectSlot(l.scheduleEntryId, l.sessionId)}
                    className="flex-col items-start h-auto py-2"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      {opening ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5" />
                      )}
                      {l.startTime}–{l.endTime}
                      {l.hasSession && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </span>
                    <span className="text-[11px] font-normal opacity-80 max-w-[160px] truncate">
                      {l.subjectName}
                      {l.subgroupNumber ? ` · ${l.subgroupNumber} підгр.` : ''}
                    </span>
                  </Button>
                )
              })}
            </ButtonGroup>
          </div>

          {/* Журнал обраного заняття */}
          {selectedSessionId ? (
            <LessonJournal sessionId={selectedSessionId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Оберіть заняття, щоб відмітити відвідуваність.
            </p>
          )}
        </>
      )}
    </div>
  )
}
