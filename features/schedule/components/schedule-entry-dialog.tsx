'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trash2, Users } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useTeachers } from '@/features/teachers/api'
import { DEFAULT_FILTERS } from '@/features/teachers/types'
import { useClassrooms } from '@/features/classrooms/api'

import {
  useCreateEntries,
  useDeleteEntry,
  useDeleteSubstitution,
  useUpdateEntry,
  useUpsertSubstitution,
} from '../api'
import {
  BELL_TIMES,
  LESSON_TYPE_LABELS,
  SUBSTITUTION_TYPE_LABELS,
  WEEK_PARITY_LABELS,
  WORKING_DAYS,
  type AvailableSubjectDto,
  type CreateEntryPayload,
  type LessonType,
  type ScheduleEntryDto,
  type SubstitutionType,
  type WeekParity,
} from '../types'

const ALL_LESSON_TYPES: LessonType[] = [
  'LECTURE',
  'PRACTICE',
  'LAB',
  'SEMINAR',
  'CONSULTATION',
  'SPRS',
]

const NO_SUBGROUP = 'none'
const MAX_SPLIT = 3

interface Context {
  groupId: string
  academicYear: string
  semesterNumber: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: Context
  subjects: AvailableSubjectDto[]
  /** Для редагування — наявне заняття; для створення — undefined. */
  entry?: ScheduleEntryDto
  /** Передвибрані координати клітинки при створенні. */
  defaultDay?: number
  defaultSlot?: number
}

export function ScheduleEntryDialog({
  open,
  onOpenChange,
  context,
  subjects,
  entry,
  defaultDay,
  defaultSlot,
}: Props) {
  const isEdit = !!entry

  const { data: teachers = [] } = useTeachers(DEFAULT_FILTERS)
  const { data: classrooms = [] } = useClassrooms()

  const createEntriesMut = useCreateEntries()
  const updateMut = useUpdateEntry()
  const deleteMut = useDeleteEntry()

  const [termId, setTermId] = useState('')
  const [lessonType, setLessonType] = useState<LessonType>('LECTURE')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [slotNumber, setSlotNumber] = useState(1)
  const [weekParity, setWeekParity] = useState<WeekParity>('EVERY')
  const [onlineUrl, setOnlineUrl] = useState('')

  // Поділ на підгрупи: splitCount=1 → вся група; ≥2 → стільки паралельних занять.
  const [splitCount, setSplitCount] = useState(1)
  const [subTeachers, setSubTeachers] = useState<string[]>(['', '', ''])
  const [subRooms, setSubRooms] = useState<string[]>(['', '', ''])
  // Для редагування — номер підгрупи цього конкретного заняття.
  const [editSubgroup, setEditSubgroup] = useState<string>(NO_SUBGROUP)

  // Ініціалізація при відкритті.
  useEffect(() => {
    if (!open) return
    if (entry) {
      setTermId(entry.curriculumComponentTermId)
      setLessonType(entry.lessonType)
      setDayOfWeek(entry.dayOfWeek)
      setSlotNumber(entry.slotNumber)
      setWeekParity(entry.weekParity)
      setSplitCount(1)
      setSubTeachers([entry.teacher?.id ?? '', '', ''])
      setSubRooms([entry.classroom?.id ?? '', '', ''])
      setEditSubgroup(entry.subgroupNumber ? String(entry.subgroupNumber) : NO_SUBGROUP)
      setOnlineUrl(entry.onlineUrl ?? '')
    } else {
      setTermId('')
      setLessonType('LECTURE')
      setDayOfWeek(defaultDay ?? 1)
      setSlotNumber(defaultSlot ?? 1)
      setWeekParity('EVERY')
      setSplitCount(1)
      setSubTeachers(['', '', ''])
      setSubRooms(['', '', ''])
      setEditSubgroup(NO_SUBGROUP)
      setOnlineUrl('')
    }
  }, [open, entry, defaultDay, defaultSlot])

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.curriculumComponentTermId === termId),
    [subjects, termId],
  )

  const lessonTypeOptions = selectedSubject
    ? selectedSubject.lessonOptions.map((o) => o.lessonType)
    : ALL_LESSON_TYPES

  const subjectOptions: ComboboxOption[] = subjects.map((s) => ({
    id: s.curriculumComponentTermId,
    label: `${s.componentCode ? `${s.componentCode}. ` : ''}${s.componentName}`,
  }))

  const teacherOptions: ComboboxOption[] = teachers.map((t) => ({
    id: t.id,
    label: [t.lastName, t.firstName, t.middleName].filter(Boolean).join(' '),
    sublabel: t.positionName ?? undefined,
  }))

  const classroomOptions: ComboboxOption[] = classrooms.map((c) => ({
    id: c.id,
    label: `№${c.number}`,
    sublabel: c.name,
  }))

  function setTeacherAt(i: number, value: string) {
    setSubTeachers((prev) => prev.map((x, idx) => (idx === i ? value : x)))
  }
  function setRoomAt(i: number, value: string) {
    setSubRooms((prev) => prev.map((x, idx) => (idx === i ? value : x)))
  }

  // Дефолтний викладач для всіх підгруп при виборі дисципліни (тільки створення).
  function applySubject(id: string) {
    setTermId(id)
    const subj = subjects.find((s) => s.curriculumComponentTermId === id)
    const opt = subj?.lessonOptions[0]
    if (opt) {
      setLessonType(opt.lessonType)
      const def = opt.defaultTeacher?.id ?? ''
      setSubTeachers([def, def, def])
    }
    // Якщо РНП передбачає поділ — одразу пропонуємо стільки ж підгруп.
    if (subj && subj.subgroupCount >= 2) {
      setSplitCount(Math.min(subj.subgroupCount, MAX_SPLIT))
    }
  }

  function applyLessonType(value: LessonType) {
    setLessonType(value)
    if (isEdit) return
    const opt = selectedSubject?.lessonOptions.find((o) => o.lessonType === value)
    const def = opt?.defaultTeacher?.id ?? ''
    setSubTeachers([def, def, def])
  }

  const canSubmit = isEdit || termId !== ''

  function handleSubmit() {
    if (isEdit && entry) {
      updateMut.mutate(
        {
          id: entry.id,
          data: {
            dayOfWeek,
            slotNumber,
            weekParity,
            lessonType,
            subgroupNumber: editSubgroup === NO_SUBGROUP ? null : Number(editSubgroup),
            teacherId: subTeachers[0] || null,
            classroomId: subRooms[0] || null,
            onlineUrl: onlineUrl.trim() || null,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      )
      return
    }

    const count = Math.max(1, splitCount)
    const payloads: CreateEntryPayload[] = Array.from({ length: count }, (_, i) => ({
      ...context,
      dayOfWeek,
      slotNumber,
      weekParity,
      lessonType,
      curriculumComponentTermId: termId,
      subgroupNumber: count > 1 ? i + 1 : null,
      teacherId: subTeachers[i] || null,
      classroomId: subRooms[i] || null,
      onlineUrl: onlineUrl.trim() || null,
    }))
    createEntriesMut.mutate(payloads, { onSuccess: () => onOpenChange(false) })
  }

  function handleDelete() {
    if (!entry) return
    deleteMut.mutate(entry.id, { onSuccess: () => onOpenChange(false) })
  }

  const pending = createEntriesMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редагувати заняття' : 'Додати заняття'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {/* Дисципліна */}
          <div className="space-y-1">
            <Label>Дисципліна</Label>
            {isEdit ? (
              <div className="text-sm rounded-md border border-border bg-muted/40 px-3 py-2">
                {entry?.componentCode ? `${entry.componentCode}. ` : ''}
                {entry?.subjectName}
              </div>
            ) : (
              <Combobox
                options={subjectOptions}
                value={termId}
                onChange={applySubject}
                placeholder="Оберіть дисципліну…"
                emptyText="Немає дисциплін у РНП на цей семестр"
                required
              />
            )}
          </div>

          {/* Тип + парність */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Вид заняття</Label>
              <Select value={lessonType} onValueChange={(v) => applyLessonType(v as LessonType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lessonTypeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LESSON_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Тиждень</Label>
              <Select value={weekParity} onValueChange={(v) => setWeekParity(v as WeekParity)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['EVERY', 'ODD', 'EVEN'] as WeekParity[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {WEEK_PARITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* День + пара */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>День</Label>
              <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKING_DAYS.map((d) => (
                    <SelectItem key={d.day} value={String(d.day)}>
                      {d.long}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Пара</Label>
              <Select value={String(slotNumber)} onValueChange={(v) => setSlotNumber(Number(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BELL_TIMES.map((b) => (
                    <SelectItem key={b.slot} value={String(b.slot)}>
                      {b.slot} пара ({b.start})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Онлайн-конференція (дистанційне/змішане заняття, ТЗ §3.6) */}
          <div className="space-y-1">
            <Label>Посилання на онлайн-конференцію (необов'язково)</Label>
            <Input
              type="url"
              inputMode="url"
              placeholder="https://meet… / zoom…"
              value={onlineUrl}
              onChange={(e) => setOnlineUrl(e.target.value)}
            />
          </div>

          {/* ── Поділ на підгрупи ── */}
          {isEdit ? (
            <>
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  Підгрупа
                </Label>
                <Select value={editSubgroup} onValueChange={setEditSubgroup}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SUBGROUP}>Вся група</SelectItem>
                    {[1, 2, 3].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Підгрупа {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TeacherRoom
                teacherId={subTeachers[0] ?? ''}
                classroomId={subRooms[0] ?? ''}
                teacherOptions={teacherOptions}
                classroomOptions={classroomOptions}
                onTeacher={(v) => setTeacherAt(0, v)}
                onRoom={(v) => setRoomAt(0, v)}
              />
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  Поділ на підгрупи
                </Label>
                <Select
                  value={String(splitCount)}
                  onValueChange={(v) => setSplitCount(Number(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Без поділу (вся група)</SelectItem>
                    <SelectItem value="2">2 підгрупи</SelectItem>
                    <SelectItem value="3">3 підгрупи</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {splitCount === 1 ? (
                <TeacherRoom
                  teacherId={subTeachers[0] ?? ''}
                  classroomId={subRooms[0] ?? ''}
                  teacherOptions={teacherOptions}
                  classroomOptions={classroomOptions}
                  onTeacher={(v) => setTeacherAt(0, v)}
                  onRoom={(v) => setRoomAt(0, v)}
                />
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: splitCount }, (_, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border p-2.5 space-y-2 bg-muted/20"
                    >
                      <p className="text-xs font-semibold text-muted-foreground">
                        Підгрупа {i + 1}
                      </p>
                      <TeacherRoom
                        teacherId={subTeachers[i] ?? ''}
                        classroomId={subRooms[i] ?? ''}
                        teacherOptions={teacherOptions}
                        classroomOptions={classroomOptions}
                        onTeacher={(v) => setTeacherAt(i, v)}
                        onRoom={(v) => setRoomAt(i, v)}
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    Підгрупи ставляться паралельно в один слот, кожна — зі своїм
                    викладачем і аудиторією.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Оперативні заміни на дату (ТЗ §3.8, §7.3) */}
          {isEdit && entry && (
            <EntrySubstitutions
              entry={entry}
              teacherOptions={teacherOptions}
              classroomOptions={classroomOptions}
            />
          )}
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          {isEdit ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Видалити
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Скасувати
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || pending}>
              {isEdit ? 'Зберегти' : splitCount > 1 ? `Додати ${splitCount} підгрупи` : 'Додати'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Викладач + аудиторія (спільний блок) ────────────────────────────────────

function TeacherRoom({
  teacherId,
  classroomId,
  teacherOptions,
  classroomOptions,
  onTeacher,
  onRoom,
}: {
  teacherId: string
  classroomId: string
  teacherOptions: ComboboxOption[]
  classroomOptions: ComboboxOption[]
  onTeacher: (v: string) => void
  onRoom: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">Викладач</Label>
        <Combobox
          options={teacherOptions}
          value={teacherId}
          onChange={onTeacher}
          placeholder="Оберіть викладача…"
          clearable
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Аудиторія</Label>
        <Combobox
          options={classroomOptions}
          value={classroomId}
          onChange={onRoom}
          placeholder="Оберіть аудиторію…"
          clearable
        />
      </div>
    </div>
  )
}

// ─── Оперативні заміни на дату (ТЗ §3.8, §7.3) ───────────────────────────────

const SUBSTITUTION_TYPES: SubstitutionType[] = [
  'CANCELLED',
  'TEACHER_CHANGE',
  'ROOM_CHANGE',
  'MOVED',
]

function EntrySubstitutions({
  entry,
  teacherOptions,
  classroomOptions,
}: {
  entry: ScheduleEntryDto
  teacherOptions: ComboboxOption[]
  classroomOptions: ComboboxOption[]
}) {
  const upsertMut = useUpsertSubstitution()
  const deleteMut = useDeleteSubstitution()

  const [date, setDate] = useState('')
  const [type, setType] = useState<SubstitutionType>('CANCELLED')
  const [replTeacher, setReplTeacher] = useState('')
  const [replRoom, setReplRoom] = useState('')
  const [newDay, setNewDay] = useState(1)

  function add() {
    if (!date) return
    upsertMut.mutate(
      {
        entryId: entry.id,
        date: new Date(date).toISOString(),
        type,
        newDayOfWeek: type === 'MOVED' ? newDay : null,
        replacementTeacherId: type === 'TEACHER_CHANGE' ? replTeacher || null : null,
        replacementClassroomId: type === 'ROOM_CHANGE' ? replRoom || null : null,
      },
      {
        onSuccess: () => {
          setDate('')
          setReplTeacher('')
          setReplRoom('')
        },
      },
    )
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-2.5 bg-muted/20">
      <Label className="text-xs font-semibold">Заміни / перенесення на дату</Label>

      {entry.substitutions.length > 0 && (
        <ul className="space-y-1">
          {entry.substitutions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 text-[11px] rounded border border-border bg-background px-2 py-1"
            >
              <span className="truncate">
                {new Intl.DateTimeFormat('uk-UA').format(new Date(s.date))} —{' '}
                {SUBSTITUTION_TYPE_LABELS[s.type]}
                {s.replacementTeacher && ` · ${s.replacementTeacher.shortName}`}
                {s.replacementClassroom && ` · ауд. ${s.replacementClassroom.number}`}
              </span>
              <button
                type="button"
                onClick={() => deleteMut.mutate(s.id)}
                className="text-destructive hover:underline shrink-0"
              >
                видалити
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-8 text-xs"
        />
        <Select value={type} onValueChange={(v) => setType(v as SubstitutionType)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUBSTITUTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {SUBSTITUTION_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === 'TEACHER_CHANGE' && (
        <Combobox
          options={teacherOptions}
          value={replTeacher}
          onChange={setReplTeacher}
          placeholder="Заміняючий викладач…"
          clearable
        />
      )}
      {type === 'ROOM_CHANGE' && (
        <Combobox
          options={classroomOptions}
          value={replRoom}
          onChange={setReplRoom}
          placeholder="Заміняюча аудиторія…"
          clearable
        />
      )}
      {type === 'MOVED' && (
        <Select value={String(newDay)} onValueChange={(v) => setNewDay(Number(v))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORKING_DAYS.map((d) => (
              <SelectItem key={d.day} value={String(d.day)}>
                {d.long}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={add}
        disabled={!date || upsertMut.isPending}
      >
        Додати заміну
      </Button>
    </div>
  )
}
