'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award, Download, FileText, ListChecks, Loader2, Save } from 'lucide-react'

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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  downloadDiplomaDoc,
  useAssignTemplate,
  useDiploma,
  useTemplates,
  useUpdateDiploma,
} from '../api'
import {
  COMPONENT_TYPE_LABELS,
  GRADE_LABELS,
  VARIANT_LABELS,
  diplomaFullName,
  formatEcts,
  type DiplomaStatus,
} from '../types'

interface Props {
  diplomaId: string | null
  onOpenChange: (open: boolean) => void
}

export function DiplomaEditorSheet({ diplomaId, onOpenChange }: Props) {
  const { data: diploma, isLoading } = useDiploma(diplomaId)
  const { data: templates = [] } = useTemplates()
  const updateMut = useUpdateDiploma()
  const assignMut = useAssignTemplate()

  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [honors, setHonors] = useState(false)
  const [status, setStatus] = useState<DiplomaStatus>('DRAFT')
  const [downloading, setDownloading] = useState<string | null>(null)

  // Засів локального стану форми з завантаженого диплома — під час рендеру
  // (а не в ефекті), при відкритті іншого диплома. React-патерн «adjust state during render».
  const [seedId, setSeedId] = useState<string | null>(null)
  if (diploma && diploma.id !== seedId) {
    setSeedId(diploma.id)
    setTitleUk(diploma.qualificationWorkTitleUk ?? '')
    setTitleEn(diploma.qualificationWorkTitleEn ?? '')
    setHonors(diploma.isHonors)
    setStatus(diploma.status)
  }

  const templateOptions: ComboboxOption[] = templates.map((t) => ({
    id: t.id,
    label: t.name,
    sublabel: VARIANT_LABELS[t.variant],
  }))

  function assignTemplate(templateId: string) {
    if (!diploma || templateId === (diploma.template?.id ?? '')) return
    // Застосовуємо шаблон до всієї групи (студенти однієї групи мають один план).
    assignMut.mutate({ id: diploma.id, templateId: templateId || null, applyToGroup: true })
  }

  async function handleSave() {
    if (!diploma) return
    await updateMut.mutateAsync({
      id: diploma.id,
      data: {
        qualificationWorkTitleUk: titleUk || null,
        qualificationWorkTitleEn: titleEn || null,
        isHonors: honors,
        status,
      },
    })
  }

  async function handleDownload(doc: 'diploma' | 'addendum') {
    if (!diploma) return
    const label = doc === 'diploma' ? 'Диплом' : 'Додаток'
    setDownloading(doc)
    try {
      await downloadDiplomaDoc(diploma.id, doc, `${label}_${diplomaFullName(diploma)}.docx`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Sheet open={!!diplomaId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="p-5 pt-11 pb-0">
          <SheetTitle className="flex items-center gap-2">
            {isLoading || !diploma
              ? <span className="inline-block h-5 w-52 animate-pulse rounded-md bg-muted align-middle" />
              : <>
                  {diplomaFullName(diploma)}
                  {diploma.isHonors && (
                    <Badge variant="secondary" className="gap-1">
                      <Award className="w-3 h-3" /> з відзнакою
                    </Badge>
                  )}
                </>}
          </SheetTitle>
          <SheetDescription>
            {isLoading || !diploma
              ? <span className="inline-block h-4 w-64 animate-pulse rounded-md bg-muted align-middle" />
              : <>{diploma.documentSeries} № {diploma.documentNumber} • {diploma.specialityName}{diploma.studyGroupName ? ` • ${diploma.studyGroupName}` : ''}</>}
          </SheetDescription>
        </SheetHeader>

        {isLoading || !diploma ? (
          <div className="p-5">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-5">

            {/* Шаблон */}
            <div className="space-y-1">
              <Label>Шаблон (спеціальність × варіант)</Label>
              <Combobox
                options={templateOptions}
                value={diploma.template?.id ?? ''}
                onChange={assignTemplate}
                placeholder="Оберіть шаблон…"
                emptyText="Немає шаблонів — створіть у розділі «Шаблони»"
              />
              <p className="text-xs text-muted-foreground">
                {assignMut.isPending
                  ? 'Застосування до групи…'
                  : `Застосовується до всієї групи${diploma.studyGroupName ? ` ${diploma.studyGroupName}` : ''}.`}
              </p>
              {!diploma.template && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Призначте шаблон, щоб заповнити зведену відомість.
                </p>
              )}
            </div>

            {/* Зведена відомість (тільки перегляд — оцінки виставляються на /diplomas/reports) */}
            {diploma.components.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Зведена відомість</Label>
                  <span className="text-xs text-muted-foreground">
                    Разом: {formatEcts(diploma.totalEcts)} кред.
                  </span>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left px-2 py-1.5 w-16">Код</th>
                        <th className="text-left px-2 py-1.5">Освітній компонент</th>
                        <th className="text-center px-2 py-1.5 w-14">Кред.</th>
                        <th className="text-left px-2 py-1.5 w-28">Оцінка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diploma.components.map((c) => (
                        <tr key={c.id} className="border-t border-border/60">
                          <td className="px-2 py-1.5 text-xs text-muted-foreground align-top">
                            {c.code ?? COMPONENT_TYPE_LABELS[c.type]}
                          </td>
                          <td className="px-2 py-1.5 align-top">
                            <div>{c.nameUk}</div>
                            {c.nameEn && (
                              <div className="text-xs text-muted-foreground">{c.nameEn}</div>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-center tabular-nums align-top">
                            {formatEcts(c.ects)}
                          </td>
                          <td className="px-2 py-1.5 align-top text-xs">
                            {c.grade ? (
                              GRADE_LABELS[c.grade]
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm" className="w-fit" asChild>
                  <Link href="/diplomas/reports">
                    <ListChecks className="w-4 h-4 mr-1.5" />
                    Виставити оцінки у зведеній відомості
                  </Link>
                </Button>
              </div>
            )}

            {/* Тема кваліфікаційної роботи */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Тема кваліфікаційної роботи (укр.)</Label>
                <Input value={titleUk} onChange={(e) => setTitleUk(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Тема (англ.)</Label>
                <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
              </div>
            </div>

            {/* Відзнака + статус */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={honors} onCheckedChange={(v) => setHonors(v === true)} />
                Диплом з відзнакою
                {diploma.honorsSuggested !== honors && (
                  <span className="text-xs text-muted-foreground">
                    (рекомендовано: {diploma.honorsSuggested ? 'так' : 'ні'})
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Статус</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as DiplomaStatus)}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Чернетка</SelectItem>
                    <SelectItem value="READY">Готовий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Дії */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMut.isPending}
              >
                {updateMut.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                Зберегти
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('diploma')}
                disabled={!diploma.template || downloading !== null}
              >
                {downloading === 'diploma' ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-1.5" />
                )}
                Диплом
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('addendum')}
                disabled={!diploma.template || downloading !== null}
              >
                {downloading === 'addendum' ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1.5" />
                )}
                Додаток
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
