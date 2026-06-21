'use client'

import { useMemo, useState } from 'react'
import { Copy, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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

import { useSpecialties } from '@/features/academic-plans/api'

import {
  useAdminCatalog,
  useCloneElectiveCatalog,
  useCreateElective,
  useDeleteElective,
  useUpdateCatalogStatus,
  useUpdateElective,
} from '../api'
import {
  CATALOG_STATUS_LABELS,
  type CatalogStatus,
  type ElectiveComponentDto,
} from '../types'

const STATUSES: CatalogStatus[] = ['DRAFT', 'OPEN', 'LATE', 'CLOSED']

interface FormState {
  name: string
  semester: string
  ectsCredits: string
  syllabusUrl: string
}

const EMPTY_FORM: FormState = {
  name: '',
  semester: '4',
  ectsCredits: '4',
  syllabusUrl: '',
}

export function ElectiveCatalogAdminPanel({ academicYear }: { academicYear: string }) {
  const { data: specialties = [], isLoading: specsLoading } = useSpecialties()
  const { data: catalog = [], isLoading: catalogLoading } = useAdminCatalog(academicYear)

  const createMut = useCreateElective()
  const updateMut = useUpdateElective()
  const deleteMut = useDeleteElective()
  const statusMut = useUpdateCatalogStatus()
  const cloneMut = useCloneElectiveCatalog()

  const [specialtyId, setSpecialtyId] = useState('')
  const specialty = specialties.find(s => s.id === specialtyId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const items = useMemo(
    () =>
      specialty
        ? catalog
            .filter(c => c.oppCode === specialty.code)
            .sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name, 'uk'))
        : [],
    [catalog, specialty],
  )

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }
  function openEdit(c: ElectiveComponentDto) {
    setEditId(c.id)
    setForm({
      name: c.name,
      semester: String(c.semester),
      ectsCredits: String(c.ectsCredits),
      syllabusUrl: c.syllabusUrl ?? '',
    })
    setDialogOpen(true)
  }

  function save() {
    if (!specialty) return
    const name = form.name.trim()
    const semester = Number(form.semester)
    const ectsCredits = Number(form.ectsCredits)
    if (!name || !semester || !ectsCredits) {
      toast.error('Заповніть назву, семестр та кредити')
      return
    }
    const syllabusUrl = form.syllabusUrl.trim() || undefined

    if (editId) {
      updateMut.mutate(
        { id: editId, data: { name, semester, ectsCredits, syllabusUrl: syllabusUrl ?? null } },
        {
          onSuccess: () => {
            toast.success('ВК оновлено')
            setDialogOpen(false)
          },
        },
      )
    } else {
      createMut.mutate(
        {
          name,
          oppCode: specialty.code,
          oppName: specialty.name,
          semester,
          ectsCredits,
          cyclicComm: '',
          syllabusUrl,
          academicYear,
        },
        {
          onSuccess: () => {
            toast.success('ВК додано до каталогу')
            setDialogOpen(false)
          },
        },
      )
    }
  }

  function remove(c: ElectiveComponentDto) {
    if (!window.confirm(`Видалити «${c.name}» з каталогу?`)) return
    deleteMut.mutate(c.id, { onSuccess: () => toast.success('ВК видалено') })
  }

  function cloneFromPrevYear() {
    const sourceYear = window.prompt(
      'Клонувати каталог ВК із якого року? (формат 2024-2025)',
    )?.trim()
    if (!sourceYear) return
    cloneMut.mutate(
      { sourceYear, targetYear: academicYear },
      { onSuccess: r => toast.success(`Скопійовано ${r.cloned} ВК у ${r.targetYear}`) },
    )
  }

  const saving = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Спеціальність</Label>
          {specsLoading ? (
            <Skeleton className="h-9 w-[320px]" />
          ) : (
            <Select value={specialtyId || undefined} onValueChange={setSpecialtyId}>
              <SelectTrigger className="h-9 min-w-[320px]">
                <SelectValue placeholder="— Оберіть спеціальність —" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={cloneFromPrevYear} disabled={cloneMut.isPending}>
            {cloneMut.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Copy size={14} className="mr-1.5" />}
            Клонувати з року
          </Button>
          <Button size="sm" onClick={openCreate} disabled={!specialty}>
            <Plus size={14} className="mr-1.5" /> Додати ВК
          </Button>
        </div>
      </div>

      {!specialty ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Оберіть спеціальність, щоб переглянути та редагувати каталог ВК ({academicYear}).
        </div>
      ) : catalogLoading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          У каталозі {specialty.code} ще немає ВК на {academicYear}. Натисніть «Додати ВК».
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Сем.</TableHead>
                <TableHead>Назва ВК</TableHead>
                <TableHead className="w-16 text-center">Кред.</TableHead>
                <TableHead className="w-40">Статус</TableHead>
                <TableHead className="w-24 text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="text-center tabular-nums">{c.semester}</TableCell>
                  <TableCell>
                    <span className="font-medium">{c.name}</span>
                    {c.syllabusUrl && (
                      <a href={c.syllabusUrl} target="_blank" rel="noopener noreferrer"
                        className="ml-1.5 inline-flex text-muted-foreground hover:text-primary align-middle">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{c.ectsCredits}</TableCell>
                  <TableCell>
                    <Select
                      value={c.catalogStatus}
                      onValueChange={v =>
                        statusMut.mutate(
                          { id: c.id, catalogStatus: v },
                          { onSuccess: () => toast.success('Статус оновлено') },
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => (
                          <SelectItem key={s} value={s}>{CATALOG_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(c)} disabled={deleteMut.isPending}>
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Редагувати ВК' : 'Додати ВК'}{specialty ? ` · ${specialty.code}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Назва</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Напр. Вступ до кібербезпеки" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Семестр</Label>
                <Select value={form.semester} onValueChange={v => setForm(f => ({ ...f, semester: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Кредити ЄКТС</Label>
                <Input type="number" min={1} value={form.ectsCredits}
                  onChange={e => setForm(f => ({ ...f, ectsCredits: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Силабус (URL, опц.)</Label>
              <Input value={form.syllabusUrl} onChange={e => setForm(f => ({ ...f, syllabusUrl: e.target.value }))}
                placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Скасувати</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              {editId ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
