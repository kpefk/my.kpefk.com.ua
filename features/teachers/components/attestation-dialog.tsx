'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

import { useCreateAttestation, useUpdateAttestation } from '../api'
import type { AttestationType, TeacherAttestationDto } from '../types'
import { STANDARD_CATEGORIES, STANDARD_TITLES } from '../types'

const OTHER = '__OTHER__'

interface AttestationDialogProps {
  open: boolean
  onClose: () => void
  teacherId: string
  /** null = створення нового запису */
  attestation: TeacherAttestationDto | null
}

function isoDay(d: string | null | undefined): string {
  return d ? d.slice(0, 10) : ''
}

function plusFiveYears(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + 5)
  return d.toISOString().slice(0, 10)
}

/** Ділить збережене значення на (вибір-зі-списку | «Інше», текст). */
function splitOption(value: string | null, options: readonly string[]): [string, string] {
  if (!value) return ['', '']
  return options.includes(value) ? [value, ''] : [OTHER, value]
}

export function AttestationDialog({ open, onClose, teacherId, attestation }: AttestationDialogProps) {
  const createMut = useCreateAttestation()
  const updateMut = useUpdateAttestation()

  const [attestationDate, setAttestationDate] = useState('')
  const [type, setType] = useState<AttestationType>('REGULAR')
  const [catSelect, setCatSelect] = useState('')
  const [catOther, setCatOther] = useState('')
  const [titleSelect, setTitleSelect] = useState('')
  const [titleOther, setTitleOther] = useState('')
  const [corresponds, setCorresponds] = useState(true)
  const [orderNumber, setOrderNumber] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [nextTouched, setNextTouched] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    const [cs, co] = splitOption(attestation?.resultCategory ?? '', STANDARD_CATEGORIES)
    const [ts, to] = splitOption(attestation?.resultTitle ?? null, STANDARD_TITLES)
    setAttestationDate(isoDay(attestation?.attestationDate))
    setType(attestation?.type ?? 'REGULAR')
    setCatSelect(cs)
    setCatOther(co)
    setTitleSelect(ts)
    setTitleOther(to)
    setCorresponds(attestation?.correspondsToPosition ?? true)
    setOrderNumber(attestation?.orderNumber ?? '')
    setOrderDate(isoDay(attestation?.orderDate))
    setNextDate(isoDay(attestation?.nextAttestationDate))
    setNextTouched(false)
    setNotes(attestation?.notes ?? '')
  }, [open, attestation])

  // Автозаповнення наступної атестації (+5р), поки користувач не редагував вручну.
  useEffect(() => {
    if (!nextTouched && attestationDate) setNextDate(plusFiveYears(attestationDate))
  }, [attestationDate, nextTouched])

  const resultCategory = catSelect === OTHER ? catOther.trim() : catSelect
  const resultTitle = titleSelect === OTHER ? titleOther.trim() : titleSelect
  const canSave = attestationDate !== '' && resultCategory !== '' && nextDate !== ''
  const pending = createMut.isPending || updateMut.isPending

  function handleSave() {
    const payload = {
      attestationDate,
      type,
      resultCategory,
      resultTitle: resultTitle || undefined,
      correspondsToPosition: corresponds,
      orderNumber: orderNumber.trim() || undefined,
      orderDate: orderDate || undefined,
      nextAttestationDate: nextDate,
      notes: notes.trim() || undefined,
    }
    const onSuccess = () => onClose()
    if (attestation) {
      updateMut.mutate({ teacherId, id: attestation.id, ...payload }, { onSuccess })
    } else {
      createMut.mutate({ teacherId, ...payload }, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{attestation ? 'Редагувати атестацію' : 'Нова атестація'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="att-date">Дата атестації *</Label>
              <Input
                id="att-date"
                type="date"
                value={attestationDate}
                onChange={(e) => setAttestationDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Вид</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as AttestationType)}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="REGULAR" id="att-regular" />
                  <Label htmlFor="att-regular" className="font-normal cursor-pointer">Чергова</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="EXTRAORDINARY" id="att-extra" />
                  <Label htmlFor="att-extra" className="font-normal cursor-pointer">Позачергова</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Кваліфікаційна категорія *</Label>
            <select
              value={catSelect}
              onChange={(e) => setCatSelect(e.target.value)}
              className="w-full h-9 text-sm rounded-md border border-input bg-background px-2 cursor-pointer"
            >
              <option value="">— Оберіть —</option>
              {STANDARD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value={OTHER}>Інше…</option>
            </select>
            {catSelect === OTHER && (
              <Input
                value={catOther}
                onChange={(e) => setCatOther(e.target.value)}
                placeholder="Введіть категорію / тарифний розряд"
                maxLength={200}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Педагогічне звання</Label>
            <select
              value={titleSelect}
              onChange={(e) => setTitleSelect(e.target.value)}
              className="w-full h-9 text-sm rounded-md border border-input bg-background px-2 cursor-pointer"
            >
              <option value="">— Немає —</option>
              {STANDARD_TITLES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value={OTHER}>Інше…</option>
            </select>
            {titleSelect === OTHER && (
              <Input
                value={titleOther}
                onChange={(e) => setTitleOther(e.target.value)}
                placeholder="Введіть звання"
                maxLength={200}
              />
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={corresponds}
              onChange={(e) => setCorresponds(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Відповідає займаній посаді</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="att-order-num">№ наказу</Label>
              <Input
                id="att-order-num"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="att-order-date">Дата наказу</Label>
              <Input
                id="att-order-date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="att-next">Наступна атестація *</Label>
            <Input
              id="att-next"
              type="date"
              value={nextDate}
              onChange={(e) => { setNextDate(e.target.value); setNextTouched(true) }}
            />
            <p className="text-xs text-muted-foreground">За замовчуванням — дата атестації + 5 років.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="att-notes">Примітка</Label>
            <Textarea
              id="att-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button onClick={handleSave} disabled={!canSave || pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
