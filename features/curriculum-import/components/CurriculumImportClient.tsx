'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { cn } from '@/lib/utils'

import { useEducationalPrograms } from '@/features/academic-plans/api'

import { useCommitImport, usePreviewImport } from '../api'
import type {
  AdmissionBasisValue,
  EducationFormValue,
  ParsedComponent,
  ParsedCurriculum,
} from '../types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function termsLabel(c: ParsedComponent): string {
  return c.terms
    .map((t) => `с${t.semesterNumber}:${t.hours}${t.hoursPerWeek ? '/' + t.hoursPerWeek : ''}`)
    .join('  ')
}

/** Технічний код EDEBO-* не показуємо в UI. */
function formatSpecialtyCode(code: string): string {
  return code.startsWith('EDEBO-') ? '' : code
}

function controlLabel(c: ParsedComponent): string {
  const parts: string[] = []
  if (c.examSemesters.length) parts.push(`екз ${c.examSemesters.join(',')}`)
  if (c.creditSemesters.length) parts.push(`зал ${c.creditSemesters.join(',')}`)
  if (c.courseWorkSemesters.length) parts.push(`КР ${c.courseWorkSemesters.join(',')}`)
  return parts.join(' · ')
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CurriculumImportClient() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedCurriculum | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const preview = usePreviewImport()
  const commit = useCommitImport()
  const { data: programs, isFetching: programsLoading } = useEducationalPrograms()

  // Опції ОПП: назва спеціальності + ОПП, освітній рівень — у підрядку.
  const programOptions: ComboboxOption[] = useMemo(
    () =>
      (programs ?? [])
        .filter((p) => p.isActive)
        .map((p) => {
          const code = formatSpecialtyCode(p.specialty.code)
          const label = code
            ? `${code} ${p.specialty.name} (ОПП: ${p.name})`
            : `${p.specialty.name} (ОПП: ${p.name})`
          return { id: p.id, label, sublabel: p.qualificationLevel ?? undefined }
        }),
    [programs],
  )

  // ── Метадані наказу/плану ──
  const [programId, setProgramId] = useState('')
  const [educationForm, setEducationForm] = useState<EducationFormValue>('FULL_TIME')
  const [admissionBasis, setAdmissionBasis] = useState<AdmissionBasisValue>('AFTER_9TH_GRADE')
  const [entryYear, setEntryYear] = useState('')
  const [studyDurationMonths, setStudyDurationMonths] = useState('46')

  const stats = useMemo(() => {
    if (!parsed) return null
    const components = parsed.sections.reduce(
      (acc, s) => acc + s.components.filter((c) => !c.isElectivePlaceholder).length,
      0,
    )
    const terms = parsed.sections.reduce(
      (acc, s) => acc + s.components.reduce((a, c) => a + c.terms.length, 0),
      0,
    )
    return { sections: parsed.sections.length, components, terms }
  }, [parsed])

  async function handleFile(file: File) {
    if (!/\.(xls|xlsx)$/i.test(file.name)) {
      toast.error('Підтримуються лише файли .xls / .xlsx')
      return
    }
    setFileName(file.name)
    try {
      const result = await preview.mutateAsync(file)
      setParsed(result)
      // Автозаповнення року вступу з назви файлу.
      const year = result.meta.academicYear?.split('-')[0]
      if (year) setEntryYear(year)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося розпарсити файл')
    }
  }

  const canCommit =
    !!parsed && !!programId && !!entryYear && !!studyDurationMonths

  async function handleCommit() {
    if (!parsed || !canCommit) return
    try {
      const result = await commit.mutateAsync({
        programId,
        educationForm,
        admissionBasis,
        entryYear: Number(entryYear),
        studyDurationMonths: Number(studyDurationMonths),
        parsed,
      })
      router.push(
        `/academic-plans/${result.curriculumId}/versions/${result.versionId}/structure`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка імпорту')
    }
  }

  function reset() {
    setParsed(null)
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Крок завантаження ──
  if (!parsed) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Імпорт навчального плану з Excel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Завантажте файл .xls/.xlsx — система розпарсить структуру для перегляду
            перед записом у базу.
          </p>
        </div>

        <Card
          className={cn(
            'flex flex-col items-center justify-center gap-3 border-2 border-dashed p-12 text-center transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-border',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) void handleFile(file)
          }}
        >
          {preview.isPending ? (
            <>
              <Loader2 size={36} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Парсимо «{fileName}»…</p>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Upload size={26} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Перетягніть файл сюди</p>
                <p className="text-sm text-muted-foreground">або оберіть вручну</p>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FileSpreadsheet size={16} className="mr-2" /> Обрати .xls
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </Card>
      </div>
    )
  }

  // ── Крок предперегляду + форма ──
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Предперегляд: {parsed.meta.sourceFile}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {parsed.meta.specialtyName ?? '—'} · {parsed.meta.academicYear ?? '—'} ·{' '}
            розділів: {stats?.sections}, компонентів: {stats?.components}, термінів:{' '}
            {stats?.terms}
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          Інший файл
        </Button>
      </div>

      {/* Попередження */}
      {parsed.warnings.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-900/10 p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm mb-1.5">
            <AlertTriangle size={15} /> Попередження парсингу
          </div>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
            {parsed.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Семестри */}
      <div className="flex flex-wrap gap-1.5">
        {parsed.semesters.map((s) => (
          <Badge key={s.semesterNumber} variant="secondary">
            {s.semesterNumber} сем · {s.weeks ?? '?'} тиж
          </Badge>
        ))}
      </div>

      {/* Розділи + компоненти */}
      <div className="space-y-5">
        {parsed.sections.map((sec, si) => {
          // Сума рахується з самих компонентів розділу — рядок «Всього» в Excel
          // часто кумулятивний (сума кількох блоків) і не збігається з видимими рядками.
          const real = sec.components.filter((c) => !c.isElectivePlaceholder)
          const sectionHours = real.reduce((s, c) => s + (c.totalHours ?? 0), 0)
          const sectionEcts = real.reduce((s, c) => s + (c.ects ?? 0), 0)
          return (
          <div key={si}>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={sec.part === 'PROFESSIONAL' ? 'default' : 'outline'}>
                {sec.part === 'PROFESSIONAL' ? 'ОПП' : 'ЗСО'}
              </Badge>
              <h3 className="font-medium text-sm">{sec.name}</h3>
              {sectionHours > 0 && (
                <span className="text-xs text-muted-foreground">
                  Σ {sectionHours} год{sectionEcts > 0 ? ` · ${Math.round(sectionEcts * 10) / 10} ЄКТС` : ''}
                </span>
              )}
            </div>
            {sec.components.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Код</TableHead>
                      <TableHead>Назва</TableHead>
                      <TableHead className="w-16 text-right">Год</TableHead>
                      <TableHead className="w-16 text-right">ЄКТС</TableHead>
                      <TableHead className="w-56">Семестри</TableHead>
                      <TableHead className="w-40">Контроль</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sec.components.map((c, ci) => (
                      <TableRow
                        key={ci}
                        className={cn(c.isElectivePlaceholder && 'text-muted-foreground italic')}
                      >
                        <TableCell className="font-mono text-xs">{c.code ?? '·'}</TableCell>
                        <TableCell>
                          {c.name}
                          {c.isElective && !c.isElectivePlaceholder && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                              ВК
                            </Badge>
                          )}
                          {c.integratedWithCode && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] border-amber-500/50 text-amber-700 dark:text-amber-400"
                              title={`Інтегрований предмет: зараховується як ${c.integratedWithCode}`}
                            >
                              ★ {c.integratedWithCode}
                            </Badge>
                          )}
                          {c.displayMarker === '*' && !c.integratedWithCode && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] border-amber-500/50 text-amber-700 dark:text-amber-400"
                              title="Інтегрований освітній компонент"
                            >
                              ★ інтегр.
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{c.totalHours ?? '—'}</TableCell>
                        <TableCell className="text-right">{c.ects ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {termsLabel(c)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {controlLabel(c)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* Форма метаданих + запис */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Метадані для запису в БД</h2>
        <p className="text-sm text-muted-foreground -mt-2">
          Цих полів немає в Excel — вкажіть вручну. План збережеться як нова{' '}
          <strong>чернеткова</strong> версія.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Освітньо-професійна програма (ОПП) *</Label>
            <Combobox
              options={programOptions}
              value={programId}
              onChange={setProgramId}
              placeholder="Пошук за назвою програми або спеціальністю…"
              emptyText="Освітніх програм не знайдено. Запустіть синхронізацію з ЄДЕБО."
              loading={programsLoading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Форма навчання *</Label>
            <Select value={educationForm} onValueChange={(v) => setEducationForm(v as EducationFormValue)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Денна</SelectItem>
                <SelectItem value="PART_TIME">Заочна</SelectItem>
                <SelectItem value="DUAL">Дуальна</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Підстава для вступу *</Label>
            <Select
              value={admissionBasis}
              onValueChange={(v) => setAdmissionBasis(v as AdmissionBasisValue)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AFTER_9TH_GRADE">На основі 9 класів</SelectItem>
                <SelectItem value="AFTER_11TH_GRADE">На основі 11 класів</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Рік вступу *</Label>
            <Input
              type="number"
              value={entryYear}
              onChange={(e) => setEntryYear(e.target.value)}
              placeholder="2025"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Тривалість навчання (місяців) *</Label>
            <Input
              type="number"
              value={studyDurationMonths}
              onChange={(e) => setStudyDurationMonths(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={reset} disabled={commit.isPending}>
            Скасувати
          </Button>
          <Button onClick={handleCommit} disabled={!canCommit || commit.isPending}>
            {commit.isPending ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : null}
            Імпортувати в БД
          </Button>
        </div>
      </Card>
    </div>
  )
}
