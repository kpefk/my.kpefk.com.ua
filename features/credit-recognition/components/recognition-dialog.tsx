'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useGroups } from '@/features/groups/api'
import { DEFAULT_GROUP_FILTERS } from '@/features/groups/types'
import { useGroupWorkingCurriculum } from '@/features/academic-plans/api'
import { useStudents } from '@/features/students/api'
import { cn } from '@/lib/utils'

import { useCreateCreditRecognition } from '../api'
import {
  type CreateCreditRecognitionPayload,
  type CreditRecognitionType,
  type NationalGrade,
  RECOGNITION_TYPE_LABELS,
  type RecognitionItemInput,
} from '../types'

interface RecognitionDialogProps {
  open: boolean
  onClose: () => void
}

interface ItemDraft {
  componentTermId: string
  controlForm: string | null
  ects: string
  academicYear: string
  finalGrade: string
  nationalGrade: NationalGrade | ''
}

function defaultAcademicYear(): string {
  const now = new Date()
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return `${y}-${y + 1}`
}

function emptyItem(): ItemDraft {
  return {
    componentTermId: '',
    controlForm: null,
    ects: '',
    academicYear: defaultAcademicYear(),
    finalGrade: '',
    nationalGrade: '',
  }
}

export function RecognitionDialog({ open, onClose }: RecognitionDialogProps) {
  const [studentId, setStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [type, setType] = useState<CreditRecognitionType>('PRIOR_EDUCATION')
  const [sourceInstitutionName, setSourceInstitutionName] = useState('')
  const [sourceDocument, setSourceDocument] = useState('')
  const [sourceDocumentDate, setSourceDocumentDate] = useState('')
  const [protocolNumber, setProtocolNumber] = useState('')
  const [protocolDate, setProtocolDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])

  const { data: students = [] } = useStudents({ search: '' } as never)
  const { data: groups = [] } = useGroups(DEFAULT_GROUP_FILTERS)
  const createMut = useCreateCreditRecognition()

  const selectedStudent = students.find((s) => s.id === studentId)
  const groupId = useMemo(() => {
    if (!selectedStudent?.groupName) return null
    return groups.find((g) => g.name === selectedStudent.groupName)?.id ?? null
  }, [selectedStudent, groups])

  const { data: workingCurriculum } = useGroupWorkingCurriculum(groupId)
  const componentTerms = useMemo(
    () =>
      (workingCurriculum?.componentTerms ?? []).map((wct) => ({
        id: wct.componentTerm.id,
        name: wct.componentTerm.component.name,
        code: wct.componentTerm.component.code,
        semesterNumber: wct.componentTerm.semesterNumber,
        ects: wct.componentTerm.ects,
        controlForm: wct.componentTerm.controlForm,
      })),
    [workingCurriculum],
  )

  useEffect(() => {
    if (!open) return
    setStudentId('')
    setStudentSearch('')
    setType('PRIOR_EDUCATION')
    setSourceInstitutionName('')
    setSourceDocument('')
    setSourceDocumentDate('')
    setProtocolNumber('')
    setProtocolDate('')
    setNotes('')
    setItems([emptyItem()])
  }, [open])

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (q === '') return []
    return students
      .filter((s) => s.personFIO.toLowerCase().includes(q))
      .slice(0, 8)
  }, [students, studentSearch])

  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function pickComponent(idx: number, termId: string) {
    const term = componentTerms.find((t) => t.id === termId)
    updateItem(idx, {
      componentTermId: termId,
      controlForm: term?.controlForm ?? null,
      ects: term ? term.ects : '',
      finalGrade: '',
      nationalGrade: '',
    })
  }

  const validItems = items.filter((it) => {
    if (it.componentTermId === '' || it.academicYear.trim() === '') return false
    if (it.controlForm === 'CREDIT') return it.nationalGrade !== ''
    return it.finalGrade.trim() !== ''
  })
  const canSave = studentId !== '' && sourceInstitutionName.trim() !== '' && validItems.length > 0

  async function handleSave() {
    const payloadItems: RecognitionItemInput[] = validItems.map((it) => ({
      curriculumComponentTermId: it.componentTermId,
      academicYear: it.academicYear.trim(),
      creditsEcts: Number(it.ects) || 0,
      ...(it.controlForm === 'CREDIT'
        ? { nationalGradeOverride: it.nationalGrade as NationalGrade }
        : { finalGrade: Number(it.finalGrade) }),
    }))
    const payload: CreateCreditRecognitionPayload = {
      studentId,
      type,
      sourceInstitutionName: sourceInstitutionName.trim(),
      sourceDocument: sourceDocument.trim() || undefined,
      sourceDocumentDate: sourceDocumentDate || undefined,
      protocolNumber: protocolNumber.trim() || undefined,
      protocolDate: protocolDate || undefined,
      notes: notes.trim() || undefined,
      items: payloadItems,
    }
    await createMut.mutateAsync(payload)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новий акт перезарахування</DialogTitle>
          <DialogDescription>
            Визнання результатів навчання (Наказ 510, п.6.7/6.8). Зберігається як чернетка —
            оцінки з’являться в заліковій книжці після підтвердження.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student picker */}
          <div className="space-y-2">
            <Label>Здобувач *</Label>
            {selectedStudent ? (
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <span className="text-sm font-medium">
                  {selectedStudent.personFIO}
                  {selectedStudent.groupName && (
                    <span className="text-muted-foreground"> · {selectedStudent.groupName}</span>
                  )}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setStudentId('')}>
                  Змінити
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Почніть вводити ПІБ..."
                />
                {filteredStudents.length > 0 && (
                  <div className="rounded-lg border divide-y max-h-52 overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setStudentId(s.id)
                          setStudentSearch('')
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span>{s.personFIO}</span>
                        <span className="text-xs text-muted-foreground">{s.groupName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Type + source */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Підстава *</Label>
              <Select value={type} onValueChange={(v) => setType(v as CreditRecognitionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RECOGNITION_TYPE_LABELS) as CreditRecognitionType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {RECOGNITION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Заклад / джерело *</Label>
              <Input
                value={sourceInstitutionName}
                onChange={(e) => setSourceInstitutionName(e.target.value)}
                placeholder="Напр.: Луцький НТУ"
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label>Документ про освіту</Label>
              <Input
                value={sourceDocument}
                onChange={(e) => setSourceDocument(e.target.value)}
                placeholder="№ / назва"
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label>Дата документа</Label>
              <Input
                type="date"
                value={sourceDocumentDate}
                onChange={(e) => setSourceDocumentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>№ протоколу</Label>
              <Input
                value={protocolNumber}
                onChange={(e) => setProtocolNumber(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Дата протоколу</Label>
              <Input
                type="date"
                value={protocolDate}
                onChange={(e) => setProtocolDate(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Компоненти для перезарахування *</Label>
              <Button
                type="button" size="sm" variant="outline"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                disabled={!groupId}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Додати
              </Button>
            </div>
            {!studentId && (
              <p className="text-xs text-muted-foreground">Спершу оберіть здобувача.</p>
            )}
            {studentId && !groupId && (
              <p className="text-xs text-amber-600">
                Групу студента не знайдено — неможливо підтягнути навчальний план.
              </p>
            )}

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Select
                      value={it.componentTermId}
                      onValueChange={(v) => pickComponent(idx, v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Оберіть компонент плану" />
                      </SelectTrigger>
                      <SelectContent>
                        {componentTerms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} · {t.semesterNumber} сем.
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button" size="icon" variant="ghost"
                      className="h-9 w-8 text-destructive shrink-0"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Навч. рік</Label>
                      <Input
                        value={it.academicYear}
                        onChange={(e) => updateItem(idx, { academicYear: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="2024-2025"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ЄКТС</Label>
                      <Input
                        type="number" step={0.5} min={0}
                        value={it.ects}
                        onChange={(e) => updateItem(idx, { ects: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Оцінка</Label>
                      {it.controlForm === 'CREDIT' ? (
                        <Select
                          value={it.nationalGrade}
                          onValueChange={(v) =>
                            updateItem(idx, { nationalGrade: v as NationalGrade })
                          }
                        >
                          <SelectTrigger size="sm" className="h-8 text-sm">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PASSED">Зараховано</SelectItem>
                            <SelectItem value="NOT_PASSED">Не зараховано</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="number" min={1} max={12}
                          value={it.finalGrade}
                          onChange={(e) => updateItem(idx, { finalGrade: e.target.value })}
                          className="h-8 text-sm"
                          disabled={it.componentTermId === ''}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Примітка</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!canSave || createMut.isPending}>
            {createMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Check className="w-4 h-4 mr-1.5" />
            )}
            Зберегти чернетку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
