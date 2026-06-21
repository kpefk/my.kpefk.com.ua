'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox } from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getNextAcademicYear } from '@/lib/academic-year'
import { cn } from '@/lib/utils'

import {
  useAddOffering,
  useBlockComponents,
  useCampaign,
  useCampaignProgress,
  useCampaigns,
  useConfirmGroupSelection,
  useCreateCampaign,
  useDeleteSeason,
  useGenerateCampaignSeasons,
  useOfferings,
  useRemoveOffering,
  useUpdateCampaignStatus,
  useUpdateSeasonStatus,
} from '../api'
import type {
  CampaignProgressRowDto,
  CatalogStatus,
  ConfirmGroupSelectionResult,
  ElectiveCampaignDetailDto,
  ElectiveCampaignDto,
  ElectiveOfferingDto,
  TermControlForm,
} from '../types'
import { CATALOG_STATUS_LABELS, CONTROL_FORM_LABELS } from '../types'

/** Мінімальна форма block-сезону, з якою працюють панелі каталогу кампанії */
type CampaignBlockSeason = ElectiveCampaignDetailDto['blockSeasons'][number]

function cfLabel(cf: TermControlForm | null | undefined): string | null {
  if (!cf) return null
  return CONTROL_FORM_LABELS[cf]
}

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_FLOW: CatalogStatus[] = ['DRAFT', 'OPEN', 'LATE', 'CLOSED']

const WC_PROPAGATION_LABELS: Record<ConfirmGroupSelectionResult['workingCurriculum']['status'], string> = {
  ADDED: 'додано до робочого плану',
  ALREADY_PRESENT: 'вже в робочому плані',
  NO_WORKING_CURRICULUM: 'робочий план ще не створено',
  APPROVED_LOCKED: 'робочий план затверджено — внесіть зміни вручну',
  SEMESTER_NOT_COVERED: 'семестр не охоплений робочим планом',
}

function StatusBadge({ status }: { status: CatalogStatus }) {
  const styles: Record<CatalogStatus, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return (
    <Badge className={cn('text-[10px] font-medium h-5 px-1.5 hover:opacity-100', styles[status])}>
      {CATALOG_STATUS_LABELS[status]}
    </Badge>
  )
}

// ── Create campaign dialog ────────────────────────────────────────────────────

function CreateCampaignDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [academicYear, setAcademicYear] = useState(getNextAcademicYear())
  const create = useCreateCampaign()

  const submit = () => {
    create.mutate(
      { academicYear },
      {
        onSuccess: () => {
          toast.success(`Кампанію ${academicYear} створено`)
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Нова кампанія вибору ВК</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-year">Навчальний рік, на який обираються ВК</Label>
            <Input
              id="campaign-year"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              placeholder="2026-2027"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            §2.4 Положення: каталог ВК затверджується педрадою та вводиться наказом директора
            кожного навчального року. Реквізити можна додати після створення.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button onClick={submit} disabled={create.isPending || !/^\d{4}-\d{4}$/.test(academicYear)}>
            {create.isPending && <Loader2 size={14} className="animate-spin mr-1.5" />}
            Створити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Offerings: add dialog ─────────────────────────────────────────────────────

function AddOfferingDialog({
  season,
  open,
  onClose,
}: {
  season: CampaignBlockSeason
  open: boolean
  onClose: () => void
}) {
  const [componentId, setComponentId] = useState('')
  const [syllabusUrl, setSyllabusUrl] = useState('')
  const [isHigherEd, setIsHigherEd] = useState(false)
  const { data: components = [], isLoading } = useBlockComponents(season.blockId)
  const { data: existing = [] } = useOfferings(season.id)
  const add = useAddOffering(season.id)

  const existingIds = new Set(existing.map(o => o.componentId))
  const available = components.filter(c => !existingIds.has(c.id))

  const handleAdd = () => {
    if (!componentId) return
    add.mutate(
      { componentId, syllabusUrl: syllabusUrl.trim() || undefined, isHigherEd },
      {
        onSuccess: () => {
          toast.success('Дисципліну додано')
          setComponentId('')
          setSyllabusUrl('')
          setIsHigherEd(false)
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md overflow-visible">
        <DialogHeader>
          <DialogTitle>Додати дисципліну до «{season.block.name}»</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Навчальна дисципліна *</Label>
            <Combobox
              options={available.map(c => {
                const term = c.terms.find(t => t.semesterNumber === season.block.semesterNumber)
                const sublabel = term
                  ? `${term.ects} кр., ${term.hours} год.${cfLabel(term.controlForm) ? ` · ${cfLabel(term.controlForm)}` : ''}`
                  : undefined
                return { id: c.id, label: c.name, sublabel }
              })}
              value={componentId}
              onChange={setComponentId}
              loading={isLoading}
              placeholder={available.length === 0 && !isLoading ? 'Усі дисципліни вже додані' : 'Оберіть дисципліну…'}
              emptyText="Нічого не знайдено"
            />
            <p className="text-xs text-muted-foreground">
              Лише навчальні дисципліни, заплановані на {season.block.semesterNumber} семестр.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="syllabus-url">Силабус (URL)</Label>
            <Input
              id="syllabus-url"
              value={syllabusUrl}
              onChange={e => setSyllabusUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="higher-ed"
              checked={isHigherEd}
              onCheckedChange={v => setIsHigherEd(Boolean(v))}
            />
            <Label htmlFor="higher-ed" className="font-normal cursor-pointer">
              ВК вищої освіти (потребує дозволу директора)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button onClick={handleAdd} disabled={!componentId || add.isPending || available.length === 0}>
            {add.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            Додати
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Offerings: expandable panel per season ───────────────────────────────────

function OfferingsPanel({ season }: { season: CampaignBlockSeason }) {
  const [addOpen, setAddOpen] = useState(false)
  const { data: offerings = [], isLoading } = useOfferings(season.id)
  const remove = useRemoveOffering()

  const handleRemove = (o: ElectiveOfferingDto) => {
    if (!confirm(`Видалити «${o.component.name}» з каталогу?`)) return
    remove.mutate(o.id, { onSuccess: () => toast.success('Дисципліну видалено') })
  }

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Дисципліни ({offerings.length})
        </p>
        {season.catalogStatus === 'DRAFT' && (
          <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={() => setAddOpen(true)}>
            <Plus size={11} />
            Додати дисципліну
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-1.5">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
      )}

      {!isLoading && offerings.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Дисциплін ще немає</p>
      )}

      {!isLoading && offerings.map(o => {
        const term = o.component.terms.find(
          t => t.semesterNumber === season.block.semesterNumber,
        )
        return (
          <div
            key={o.id}
            className="flex items-center justify-between gap-2 rounded-md bg-background border border-border px-3 py-2"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium truncate">{o.component.name}</span>
              <div className="flex items-center gap-2 flex-wrap">
                {term && (
                  <span className="text-[10px] text-muted-foreground">
                    {term.ects} кр. · {term.hours} год.
                    {cfLabel(term.controlForm) && ` · ${cfLabel(term.controlForm)}`}
                  </span>
                )}
                {o.isHigherEd && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1">Вища освіта</Badge>
                )}
                {o.syllabusUrl && (
                  <a
                    href={o.syllabusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary underline-offset-2 hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    Силабус
                  </a>
                )}
              </div>
            </div>
            {season.catalogStatus === 'DRAFT' && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleRemove(o)}
                disabled={remove.isPending}
                title="Видалити дисципліну"
              >
                <Trash2 size={12} />
              </Button>
            )}
          </div>
        )
      })}

      <AddOfferingDialog season={season} open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

// ── Block seasons catalog (grouped by specialty) ─────────────────────────────

function BlockSeasonsSection({ campaignId }: { campaignId: string }) {
  const { data: detail, isLoading } = useCampaign(campaignId)
  const updateStatus = useUpdateSeasonStatus()
  const deleteSeason = useDeleteSeason()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const map = new Map<string, CampaignBlockSeason[]>()
    for (const s of detail?.blockSeasons ?? []) {
      const spec = s.block.section.version.curriculum.program.specialty
      const key = `${spec.code} — ${spec.name}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    map.forEach(list => list.sort((a, b) => a.block.semesterNumber - b.block.semesterNumber))
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'uk'))
  }, [detail])

  const handleDelete = (s: CampaignBlockSeason) => {
    if (!confirm(`Видалити каталог «${s.block.name}» (${s.academicYear})?`)) return
    deleteSeason.mutate(s.id, { onSuccess: () => toast.success('Каталог видалено') })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Block-сезонів ще немає — натисніть «Згенерувати сезони за прив’язками груп».
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <span className="text-sm font-semibold">Каталог дисциплін за блоками</span>
      {groups.map(([groupLabel, seasons]) => (
        <div key={groupLabel} className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {groupLabel}
            </span>
            <span className="text-xs text-muted-foreground">
              ({seasons.length} блок{seasons.length === 1 ? '' : 'ів'})
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="w-8"></TableHead>
                <TableHead>Блок ВК</TableHead>
                <TableHead className="w-16 text-center hidden sm:table-cell">Сем.</TableHead>
                <TableHead className="w-24 hidden md:table-cell text-center">Дисципліни</TableHead>
                <TableHead className="w-44">Статус</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasons.map(season => (
                <Fragment key={season.id}>
                  <TableRow
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(prev => (prev === season.id ? null : season.id))}
                  >
                    <TableCell className="text-muted-foreground w-8">
                      {expandedId === season.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{season.block.name}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="secondary" className="font-mono text-xs">
                        С{season.block.semesterNumber}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell text-sm text-muted-foreground">
                      {season._count.offerings}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Select
                        value={season.catalogStatus}
                        onValueChange={val =>
                          updateStatus.mutate(
                            { id: season.id, catalogStatus: val },
                            { onSuccess: () => toast.success('Статус оновлено') },
                          )
                        }
                      >
                        <SelectTrigger className="h-7 text-xs w-40 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(CATALOG_STATUS_LABELS) as CatalogStatus[]).map(s => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {CATALOG_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={season.catalogStatus !== 'DRAFT' || season._count.selections > 0}
                        onClick={() => handleDelete(season)}
                        title={
                          season.catalogStatus !== 'DRAFT'
                            ? 'Видалити можна лише DRAFT'
                            : season._count.selections > 0
                              ? 'Є вибори студентів'
                              : 'Видалити каталог'
                        }
                      >
                        <Trash2 size={13} />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedId === season.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <OfferingsPanel season={season} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  )
}

// ── Confirm group dialog ─────────────────────────────────────────────────────

function ConfirmGroupDialog({
  row,
  onClose,
}: {
  row: CampaignProgressRowDto
  onClose: () => void
}) {
  const confirm = useConfirmGroupSelection()
  const [orderNumber, setOrderNumber] = useState('')
  const [orderDate, setOrderDate] = useState('')

  const needsOrder = !row.quorumReached

  const submit = () => {
    confirm.mutate(
      {
        seasonId: row.season.id,
        groupId: row.group.id,
        data: {
          ...(row.topComponent && !row.quorumReached ? { componentId: row.topComponent.id } : {}),
          ...(orderNumber && { orderNumber }),
          ...(orderDate && { orderDate }),
        },
      },
      {
        onSuccess: result => {
          toast.success(
            `«${result.componentName}»: підтверджено ${result.confirmedVoluntary}, ` +
              `призначено ${result.assignedByOrder}` +
              (result.dissenting > 0 ? `, розбіжних виборів: ${result.dissenting} (§3.7)` : '') +
              ` · РНП: ${WC_PROPAGATION_LABELS[result.workingCurriculum.status]}`,
          )
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Підсумок вибору групи {row.group.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Блок: <span className="font-medium">{row.season.blockName}</span> ({row.season.semesterNumber} сем.)
          </p>
          {row.topComponent ? (
            <p>
              Лідер вибору: <span className="font-medium">«{row.topComponent.name}»</span> —{' '}
              {row.topComponent.count} з {row.group.studentCount} студентів
              {row.quorumReached ? (
                <Badge className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                  Кворум 75% ✓
                </Badge>
              ) : (
                <Badge className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
                  Кворуму немає
                </Badge>
              )}
            </p>
          ) : (
            <p className="text-muted-foreground">Добровільних виборів у групі ще немає.</p>
          )}

          {needsOrder && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                §3.4 Положення: без кворуму заявами підсумок фіксується наказом — вкажіть реквізити.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="№ наказу" />
                <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Після фіксації ВК стає обов’язковим для групи (§3.9): добровільні вибори переможної
            дисципліни підтверджуються, студенти без вибору — допризначаються, дисципліна вноситься
            до робочого навчального плану (§3.10).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button
            onClick={submit}
            disabled={confirm.isPending || !row.topComponent || (needsOrder && !orderNumber.trim())}
          >
            {confirm.isPending && <Loader2 size={14} className="animate-spin mr-1.5" />}
            Зафіксувати підсумок
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Progress table ────────────────────────────────────────────────────────────

function CampaignProgressTable({ campaignId }: { campaignId: string }) {
  const { data, isLoading, refetch, isFetching } = useCampaignProgress(campaignId)
  const [confirmRow, setConfirmRow] = useState<CampaignProgressRowDto | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  const rows = data?.rows ?? []

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Прогрес вибору по групах</span>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 h-7 text-xs">
          <RefreshCw size={12} className={cn(isFetching && 'animate-spin')} />
          Оновити
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead>Група</TableHead>
              <TableHead>Блок ВК</TableHead>
              <TableHead className="text-center w-24">Заяви</TableHead>
              <TableHead>Лідер вибору</TableHead>
              <TableHead className="w-40">Підсумок</TableHead>
              <TableHead className="w-32 text-right">Дія</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                  Немає груп із релевантними блоками ВК. Перевірте прив’язки груп до навчальних
                  планів та згенеруйте сезони кампанії.
                </TableCell>
              </TableRow>
            )}
            {rows.map(row => (
              <TableRow key={`${row.season.id}-${row.group.id}`}>
                <TableCell className="font-medium text-sm">
                  {row.group.name}
                  <span className="text-xs text-muted-foreground ml-1.5">({row.group.studentCount})</span>
                </TableCell>
                <TableCell className="text-sm">
                  {row.season.blockName}
                  <Badge variant="secondary" className="ml-1.5 text-[10px] font-mono">{row.season.semesterNumber} сем.</Badge>
                </TableCell>
                <TableCell className="text-center text-sm font-mono">
                  {row.voluntaryCount}/{row.group.studentCount}
                </TableCell>
                <TableCell className="text-sm">
                  {row.topComponent ? (
                    <span>
                      {row.topComponent.name}
                      <span className={cn(
                        'ml-1.5 text-xs font-mono',
                        row.quorumReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                      )}>
                        {row.group.studentCount > 0
                          ? Math.round((row.topComponent.count / row.group.studentCount) * 100)
                          : 0}%
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {row.outcome ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 size={12} className="shrink-0" />
                      {row.outcome.componentName}
                      {row.outcome.orderNumber && (
                        <Badge variant="outline" className="text-[10px] ml-1">Наказ №{row.outcome.orderNumber}</Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">не зафіксовано</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={row.outcome ? 'ghost' : row.quorumReached ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => setConfirmRow(row)}
                  >
                    {row.outcome ? 'Змінити' : 'Зафіксувати'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {confirmRow && <ConfirmGroupDialog row={confirmRow} onClose={() => setConfirmRow(null)} />}
    </div>
  )
}

// ── Campaign detail ───────────────────────────────────────────────────────────

function CampaignDetail({ campaign }: { campaign: ElectiveCampaignDto }) {
  const { data: detail } = useCampaign(campaign.id)
  const generate = useGenerateCampaignSeasons()
  const updateStatus = useUpdateCampaignStatus()

  const currentIdx = STATUS_FLOW.indexOf(campaign.status)
  const nextStatus = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={generate.isPending}
          onClick={() =>
            generate.mutate(campaign.id, {
              onSuccess: r => {
                if (r.totalRelevantBlocks > 0) {
                  toast.success(
                    `Сезони згенеровано: створено ${r.created}, прийнято ${r.adopted} (релевантних блоків: ${r.totalRelevantBlocks})`,
                  )
                } else {
                  toast.warning('Релевантних блоків ВК не знайдено — див. діагностику нижче.')
                }
                for (const w of (r.warnings ?? []).slice(0, 5)) {
                  toast.warning(w, { duration: 12_000 })
                }
              },
            })
          }
        >
          {generate.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          Згенерувати сезони за прив’язками груп
        </Button>

        {nextStatus && (
          <Button
            size="sm"
            className="gap-1.5"
            disabled={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate(
                { id: campaign.id, status: nextStatus },
                {
                  onSuccess: () =>
                    toast.success(`Кампанію переведено в статус «${CATALOG_STATUS_LABELS[nextStatus]}»`),
                },
              )
            }
          >
            {updateStatus.isPending && <Loader2 size={13} className="animate-spin" />}
            → {CATALOG_STATUS_LABELS[nextStatus]}
          </Button>
        )}

        <span className="text-xs text-muted-foreground">
          Block-сезонів: {detail?.blockSeasons.length ?? campaign._count?.blockSeasons ?? 0}.
          Статус кампанії застосовується до всіх її сезонів одночасно.
        </span>
      </div>

      <BlockSeasonsSection campaignId={campaign.id} />
      <CampaignProgressTable campaignId={campaign.id} />
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ElectiveCampaignPanel() {
  const { data: campaigns = [], isLoading } = useCampaigns()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const selected = campaigns.find(c => c.id === selectedId) ?? campaigns[0] ?? null

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarRange size={16} className="text-muted-foreground" />
        {campaigns.length === 0 && (
          <span className="text-sm text-muted-foreground">Кампаній ще немає.</span>
        )}
        {campaigns.map(c => (
          <Button
            key={c.id}
            size="sm"
            variant={selected?.id === c.id ? 'default' : 'outline'}
            className="gap-1.5 h-8"
            onClick={() => setSelectedId(c.id)}
          >
            {c.academicYear}
            <StatusBadge status={c.status} />
          </Button>
        ))}
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          Нова кампанія
        </Button>
      </div>

      {selected && <CampaignDetail campaign={selected} />}

      {createOpen && <CreateCampaignDialog open onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
