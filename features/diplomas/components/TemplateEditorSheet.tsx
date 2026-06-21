'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, FileUp, Save } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useTemplate, useUpdateTemplate, useUploadTemplateFile } from '../api'
import { VARIANT_LABELS, type DiplomaVariant } from '../types'

const VARIANTS: DiplomaVariant[] = ['EXAM', 'EDKI', 'DIPLOMA_WORK', 'DIPLOMA_PROJECT']

// ── Плейсхолдери (згруповані; клік копіює в буфер обміну) ───────────────────────

interface PlaceholderItem {
  token: string
  label: string
}
interface PlaceholderGroup {
  title: string
  items: PlaceholderItem[]
}

const PLACEHOLDER_GROUPS: PlaceholderGroup[] = [
  {
    title: 'Особа',
    items: [
      { token: '{lastNameUk}', label: 'Прізвище (укр.)' },
      { token: '{firstNameUk}', label: "Ім'я (укр.)" },
      { token: '{lastNameEn}', label: 'Прізвище (англ.)' },
      { token: '{firstNameEn}', label: "Ім'я (англ.)" },
      { token: '{fullNameUk}', label: 'ПІБ (укр.)' },
      { token: '{fullNameEn}', label: 'ПІБ (англ.)' },
      { token: '{birthday}', label: 'Дата народження' },
      { token: '{personId}', label: 'Код картки фіз. особи §1.4' },
      { token: '{edeboPersonCode}', label: 'Код особи ЄДЕБО (GUID)' },
      { token: '{personEducationId}', label: 'Код картки навчання' },
    ],
  },
  {
    title: 'Документ',
    items: [
      { token: '{documentSeries}', label: 'Серія диплома' },
      { token: '{documentNumber}', label: 'Номер диплома' },
      { token: '{supplementId}', label: 'Реєстр. № додатка' },
      { token: '{issueDate}', label: 'Дата видачі (ДД/ММ/РРРР)' },
      { token: '{issueDateUk}', label: 'Дата видачі (укр., словами)' },
      { token: '{issueDateEn}', label: 'Дата видачі (англ.)' },
      { token: '{graduateYear}', label: 'Рік випуску' },
    ],
  },
  {
    title: 'Академічне',
    items: [
      { token: '{specialityCode}', label: 'Код спеціальності' },
      { token: '{specialityNameUk}', label: 'Спеціальність (укр.)' },
      { token: '{specialityNameEn}', label: 'Спеціальність (англ.)' },
      { token: '{studyProgramNameUk}', label: 'ОПП (укр.)' },
      { token: '{studyProgramNameEn}', label: 'ОПП (англ.)' },
      { token: '{qualificationNameUk}', label: 'Кваліфікація р.1 (укр.)' },
      { token: '{qualificationNameUk2}', label: 'Кваліфікація р.2 (укр.)' },
      { token: '{qualificationNameEn}', label: 'Кваліфікація р.1 (англ.)' },
      { token: '{qualificationNameEn2}', label: 'Кваліфікація р.2 (англ.)' },
      { token: '{degreeNameUk}', label: 'Ступінь (укр.)' },
      { token: '{degreeNameEn}', label: 'Ступінь (англ.)' },
      { token: '{studyPeriod}', label: 'Період навчання §7.1' },
      { token: '{groupName}', label: 'Академічна група' },
    ],
  },
  {
    title: '§6.2.2 — Документ про освіту (підстава для вступу)',
    items: [
      { token: '{entryDocumentUk}', label: 'Документ про освіту (укр.)' },
      { token: '{entryDocumentEn}', label: 'Документ про освіту (англ.)' },
    ],
  },
  {
    title: 'Акредитація',
    items: [
      { token: '{accrCertSeries}', label: 'Серія сертифіката' },
      { token: '{accrCertNumber}', label: 'Номер сертифіката' },
      { token: '{accrCertDate}', label: 'Дата сертифіката' },
      { token: '{accrProtocolNumber}', label: '№ протоколу' },
      { token: '{accreditationName}', label: 'Орган акредитації (укр.)' },
      { token: '{accreditationNameEn}', label: 'Орган акредитації (англ.)' },
    ],
  },
  {
    title: 'Підпис / заклад',
    items: [
      { token: '{universityNameUk}', label: 'Назва ЗО (укр.)' },
      { token: '{universityNameEn}', label: 'Назва ЗО (англ.)' },
      { token: '{bossFio}', label: 'Підписант ПІБ (укр.)' },
      { token: '{bossFioEn}', label: 'Підписант ПІБ (англ.)' },
      { token: '{bossPost}', label: 'Посада (укр.)' },
      { token: '{bossPostEn}', label: 'Посада (англ.)' },
      { token: '{bossInitialsSurname}', label: 'І. Прізвище' },
    ],
  },
  {
    title: 'Зведена відомість §4.3 (цикл по рядку таблиці)',
    items: [
      { token: '{#components}', label: 'Початок циклу (1-ша комірка рядка)' },
      { token: '{code}', label: 'Код ОК' },
      { token: '{nameUk}', label: 'Назва ОК (укр.)' },
      { token: '{nameEn}', label: 'Назва ОК (англ.)' },
      { token: '{ects}', label: 'Кредити ЄКТС' },
      { token: '{gradeUk}', label: 'Оцінка (укр.)' },
      { token: '{gradeEn}', label: 'Оцінка (англ.)' },
      { token: '{/components}', label: 'Кінець циклу (остання комірка рядка)' },
      { token: '{totalEcts}', label: 'Разом кредитів' },
    ],
  },
  {
    title: 'Тема кваліфікаційної роботи §6',
    items: [
      { token: '{qualificationWorkTitleUk}', label: 'Тема (укр.)' },
      { token: '{qualificationWorkTitleEn}', label: 'Тема (англ.)' },
    ],
  },
]

function PlaceholderChip({ item }: { item: PlaceholderItem }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(item.token)
      toast.success(`Скопійовано ${item.token}`)
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      title={`${item.label} — клік, щоб скопіювати`}
      className="group inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[11px] hover:border-primary hover:bg-primary/5 transition-colors"
    >
      <span>{item.token}</span>
      <Copy className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary" />
    </button>
  )
}

interface Props {
  templateId: string | null
  onOpenChange: (open: boolean) => void
}

export function TemplateEditorSheet({ templateId, onOpenChange }: Props) {
  const { data: template, isLoading } = useTemplate(templateId)
  const updateMut = useUpdateTemplate()
  const uploadMut = useUploadTemplateFile()
  const diplomaInput = useRef<HTMLInputElement>(null)
  const addendumInput = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [specialtyName, setSpecialtyName] = useState('')
  const [specialtyCode, setSpecialtyCode] = useState('')
  const [variant, setVariant] = useState<DiplomaVariant>('DIPLOMA_PROJECT')

  useEffect(() => {
    if (!template) return
    setName(template.name)
    setSpecialtyName(template.specialtyName ?? '')
    setSpecialtyCode(template.specialtyCode ?? '')
    setVariant(template.variant)
  }, [template])

  function saveMeta() {
    if (!template) return
    updateMut.mutate({
      id: template.id,
      data: { name, specialtyName, specialtyCode: specialtyCode || undefined, variant },
    })
  }
  function upload(kind: 'diploma' | 'addendum', file: File | null) {
    if (!template || !file) return
    uploadMut.mutate({ id: template.id, kind, file })
  }

  return (
    <Sheet open={!!templateId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-2xl overflow-y-auto">

        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle>Шаблон диплома</SheetTitle>
          <SheetDescription>
            {isLoading || !template ? 'Завантаження…' : template.name}
          </SheetDescription>
        </SheetHeader>

        {isLoading || !template ? (
          <div className="p-5">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-5">

            {/* Метадані */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Назва</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Варіант атестації</Label>
                <Select value={variant} onValueChange={(v) => setVariant(v as DiplomaVariant)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANTS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {VARIANT_LABELS[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Спеціальність (як у XML ЄДЕБО)</Label>
                <Input
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                  placeholder="Комп'ютерні науки"
                />
              </div>
              <div className="space-y-1">
                <Label>Код спеціальності (опц.)</Label>
                <Input
                  value={specialtyCode}
                  onChange={(e) => setSpecialtyCode(e.target.value)}
                  placeholder="122"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={saveMeta}
              disabled={updateMut.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" /> Зберегти метадані
            </Button>

            {/* Файли .docx */}
            <div className="space-y-2">
              <Label>Файли шаблону (.docx з плейсхолдерами)</Label>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={diplomaInput}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => upload('diploma', e.target.files?.[0] ?? null)}
                />
                <input
                  ref={addendumInput}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => upload('addendum', e.target.files?.[0] ?? null)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => diplomaInput.current?.click()}
                  disabled={uploadMut.isPending}
                >
                  {template.hasDiplomaDocx
                    ? <Check className="w-4 h-4 mr-1.5 text-green-600" />
                    : <FileUp className="w-4 h-4 mr-1.5" />}
                  Диплом {template.hasDiplomaDocx ? '(завантажено)' : ''}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addendumInput.current?.click()}
                  disabled={uploadMut.isPending}
                >
                  {template.hasAddendumDocx
                    ? <Check className="w-4 h-4 mr-1.5 text-green-600" />
                    : <FileUp className="w-4 h-4 mr-1.5" />}
                  Додаток {template.hasAddendumDocx ? '(завантажено)' : ''}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Під час завантаження файл перевіряється на наявність обов&apos;язкових плейсхолдерів.
              </p>
            </div>

            {/* Довідник плейсхолдерів */}
            <div className="space-y-2">
              <Label>Плейсхолдери (клік копіює в буфер обміну)</Label>
              <div className="flex flex-col gap-3 rounded-lg border border-border p-3 bg-card">
                {PLACEHOLDER_GROUPS.map((g) => (
                  <div key={g.title} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{g.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((it) => (
                        <PlaceholderChip key={it.token} item={it} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
