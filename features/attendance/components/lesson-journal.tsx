'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Edit2, Loader2, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { LESSON_TYPE_LABELS, type LessonType } from '@/features/schedule/types'

import {
  useCarryOver,
  useSaveRecords,
  useSession,
  useUpdateSession,
} from '../api'
import {
  ATTENDANCE_STATUS_COLOR,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_ORDER,
  type AttendanceStatus,
} from '../types'

const LESSON_TYPES = Object.keys(LESSON_TYPE_LABELS) as LessonType[]

interface RowEdit {
  status: AttendanceStatus
  grade: string
  comment: string
}

interface EditState {
  sessionId: string
  rows: Record<string, RowEdit>
}

function parseGrade(value: string): number | null {
  const s = value.trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null
}

export function LessonJournal({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading } = useSession(sessionId)
  const saveMut = useSaveRecords()
  const updateMut = useUpdateSession()
  const carryMut = useCarryOver()

  const [edit, setEdit] = useState<EditState>({ sessionId: '', rows: {} })
  const [editingTopic, setEditingTopic] = useState(false)
  const [topicDraft, setTopicDraft] = useState('')

  // Синхронізація локального стану з новою сесією — без useEffect (React 19):
  // коригуємо стан під час рендеру, коли id сесії змінився.
  if (session && session.id !== edit.sessionId) {
    const rows: Record<string, RowEdit> = {}
    for (const r of session.rows) {
      rows[r.studentId] = {
        status: r.status,
        grade: r.grade != null ? String(r.grade) : '',
        comment: r.comment ?? '',
      }
    }
    setEdit({ sessionId: session.id, rows })
    setEditingTopic(false)
  }

  if (isLoading || !session) {
    return <Skeleton className="h-64 w-full" />
  }

  const canEdit = session.canEdit

  function setRow(studentId: string, patch: Partial<RowEdit>) {
    setEdit((prev) => {
      const base: RowEdit = prev.rows[studentId] ?? {
        status: 'ABSENT',
        grade: '',
        comment: '',
      }
      return { ...prev, rows: { ...prev.rows, [studentId]: { ...base, ...patch } } }
    })
  }

  function handleSave() {
    if (!session) return
    saveMut.mutate({
      id: session.id,
      data: {
        records: Object.entries(edit.rows).map(([studentId, r]) => ({
          studentId,
          status: r.status,
          grade: parseGrade(r.grade),
          comment: r.comment.trim() || null,
        })),
      },
    })
  }

  function saveTopic() {
    if (!session) return
    updateMut.mutate(
      { id: session.id, data: { topic: topicDraft.trim() || undefined } },
      { onSuccess: () => setEditingTopic(false) },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Інфо про заняття ── */}
      <div className="flex flex-col gap-1.5">
        <InfoRow label="Предмет">
          <span className="text-sm">
            {session.componentCode ? `${session.componentCode}. ` : ''}
            {session.subjectName}
          </span>
        </InfoRow>

        <InfoRow label="Група">
          <span className="text-sm">
            {session.groupName}
            {session.subgroupNumber > 0 && ` · ${session.subgroupNumber} підгрупа`}
          </span>
        </InfoRow>

        <InfoRow label="Вид заняття">
          <Select
            value={session.lessonType}
            onValueChange={(v) =>
              updateMut.mutate({ id: session.id, data: { lessonType: v as LessonType } })
            }
            disabled={!canEdit || updateMut.isPending}
          >
            <SelectTrigger className="h-7 text-sm w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LESSON_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {LESSON_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InfoRow>

        <InfoRow label="Тема уроку">
          {editingTopic ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                placeholder="Тема заняття…"
                className="h-7 text-sm w-[280px]"
                autoFocus
                maxLength={500}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={saveTopic}
                disabled={updateMut.isPending}
              >
                <Check className="h-3.5 w-3.5 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditingTopic(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-sm">
                {session.topic || <span className="text-muted-foreground italic">не вказано</span>}
              </span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-0.5"
                  onClick={() => {
                    setTopicDraft(session.topic ?? '')
                    setEditingTopic(true)
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </InfoRow>
      </div>

      {!canEdit && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Редагування недоступне (поза дозволеним періодом для вашої ролі).
        </p>
      )}

      {/* ── Таблиця студентів ── */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">№</TableHead>
            <TableHead>Студент</TableHead>
            <TableHead className="w-[160px]">Присутність</TableHead>
            <TableHead className="w-20">Оцінка</TableHead>
            <TableHead>Коментар</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {session.rows.map((row, i) => {
            const r = edit.rows[row.studentId]
            if (!r) return null
            return (
              <TableRow key={row.studentId}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  {row.userId ? (
                    <Link href={`/profile/${row.userId}`} className="hover:underline">
                      {row.fullName}
                    </Link>
                  ) : (
                    row.fullName
                  )}
                </TableCell>
                <TableCell>
                  <RadioGroup
                    value={r.status}
                    onValueChange={(v) =>
                      setRow(row.studentId, { status: v as AttendanceStatus })
                    }
                    className="flex flex-row gap-3"
                    disabled={!canEdit}
                  >
                    {ATTENDANCE_STATUS_ORDER.map((s) => (
                      <RadioGroupItem
                        key={s}
                        value={s}
                        id={`${row.studentId}-${s}`}
                        aria-label={ATTENDANCE_STATUS_LABELS[s]}
                        title={ATTENDANCE_STATUS_LABELS[s]}
                        className={cn(ATTENDANCE_STATUS_COLOR[s])}
                      />
                    ))}
                  </RadioGroup>
                </TableCell>
                <TableCell>
                  <Input
                    value={r.grade}
                    onChange={(e) => setRow(row.studentId, { grade: e.target.value })}
                    inputMode="numeric"
                    placeholder="—"
                    className="h-8 w-16 text-center"
                    disabled={!canEdit}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={r.comment}
                    onChange={(e) => setRow(row.studentId, { comment: e.target.value })}
                    placeholder="—"
                    className="h-8"
                    maxLength={1000}
                    disabled={!canEdit}
                  />
                </TableCell>
              </TableRow>
            )
          })}
          {session.rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                У цій групі/підгрупі немає активних студентів.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {canEdit && session.rows.length > 0 && (
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saveMut.isPending}>
            {saveMut.isPending ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Зберегти
          </Button>
          <Button
            variant="outline"
            onClick={() => carryMut.mutate(session.id)}
            disabled={carryMut.isPending}
            title="Перенести позначки присутності з попереднього заняття цієї групи сьогодні"
          >
            {carryMut.isPending ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Copy className="w-4 h-4 mr-1.5" />
            )}
            Перенести відвідуваність
          </Button>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-h-7">
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}:</span>
      {children}
    </div>
  )
}
