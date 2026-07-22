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

import { useCreateMobility } from '../api'
import {
  type CreateAcademicMobilityPayload,
  MOBILITY_DIRECTION_LABELS,
  type MobilityDirection,
  type MobilityItemInput,
  type NationalGrade,
} from '../types'

interface MobilityDialogProps {
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
  partnerComponentName: string
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
    partnerComponentName: '',
  }
}

export function MobilityDialog({ open, onClose }: MobilityDialogProps) {
  const [studentId, setStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [direction, setDirection] = useState<MobilityDirection>('OUTBOUND')
  const [partnerInstitutionName, setPartnerInstitutionName] = useState('')
  const [country, setCountry] = useState('')
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [agreementNumber, setAgreementNumber] = useState('')
  const [agreementDate, setAgreementDate] = useState('')
  const [protocolNumber, setProtocolNumber] = useState('')
  const [protocolDate, setProtocolDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])

  const { data: students = [] } = useStudents({ search: '' } as never)
  const { data: groups = [] } = useGroups(DEFAULT_GROUP_FILTERS)
  const createMut = useCreateMobility()

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
    setDirection('OUTBOUND')
    setPartnerInstitutionName('')
    setCountry('')
    setPeriodFrom('')
    setPeriodTo('')
    setAgreementNumber('')
    setAgreementDate('')
    setProtocolNumber('')
    setProtocolDate('')
    setNotes('')
    setItems([emptyItem()])
  }, [open])

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (q === '') return []
    return students.filter((s) => s.personFIO.toLowerCase().includes(q)).slice(0, 8)
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
  const canSave =
    studentId !== '' &&
    partnerInstitutionName.trim() !== '' &&
    periodFrom !== '' &&
    periodTo !== '' &&
    validItems.length > 0

  async function handleSave() {
    const payloadItems: MobilityItemInput[] = validItems.map((it) => ({
      curriculumComponentTermId: it.componentTermId,
      academicYear: it.academicYear.trim(),
      creditsEcts: Number(it.ects) || 0,
      partnerComponentName: it.partnerComponentName.trim() || undefined,
      ...(it.controlForm === 'CREDIT'
        ? { nationalGradeOverride: it.nationalGrade as NationalGrade }
        : { finalGrade: Number(it.finalGrade) }),
    }))
    const payload: CreateAcademicMobilityPayload = {
      studentId,
      direction,
      partnerInstitutionName: partnerInstitutionName.trim(),
      country: country.trim() || undefined,
      periodFrom,
      periodTo,
      agreementNumber: agreementNumber.trim() || undefined,
      agreementDate: agreementDate || undefined,
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
          <DialogTitle>Новий запис академічної мобільності</DialogTitle>
          <DialogDescription>
            Визнання результатів навчання в закладі-партнері (Наказ 510, розд. VIII). Оцінки
            з’являться в заліковій книжці після підтвердження.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Напрям *</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as MobilityDirection)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MOBILITY_DIRECTION_LABELS) as MobilityDirection[]).map((d) => (
                    <SelectItem key={d} value={d}>
                      {MOBILITY_DIRECTION_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Заклад-партнер *</Label>
              <Input
                value={partnerInstitutionName}
                onChange={(e) => setPartnerInstitutionName(e.target.value)}
                placeholder="Напр.: Politechnika Lubelska"
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label>Країна</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={100} />
            </div>
            <div />
            <div className="space-y-2">
              <Label>Період з *</Label>
              <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Період по *</Label>
              <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>№ договору</Label>
              <Input
                value={agreementNumber}
                onChange={(e) => setAgreementNumber(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Дата договору</Label>
              <Input
                type="date"
                value={agreementDate}
                onChange={(e) => setAgreementDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>№ протоколу визнання</Label>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Визнані компоненти *</Label>
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
                    <Select value={it.componentTermId} onValueChange={(v) => pickComponent(idx, v)}>
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
                  <Input
                    value={it.partnerComponentName}
                    onChange={(e) => updateItem(idx, { partnerComponentName: e.target.value })}
                    placeholder="Назва курсу в закладі-партнері (необовʼязково)"
                    className="h-8 text-sm"
                    maxLength={300}
                  />
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
                          onValueChange={(v) => updateItem(idx, { nationalGrade: v as NationalGrade })}
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
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} />
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
