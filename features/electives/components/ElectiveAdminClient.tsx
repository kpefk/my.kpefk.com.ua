'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  HelpCircle,
  Loader2,
  Printer,
  Search,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCurrentAcademicYear } from '@/lib/academic-year'
import { cn } from '@/lib/utils'

import {
  useAdminAssignV2,
  useAutoAssignBulk,
  useConfirmSelectionsV2,
  useGroupSelectionStatsV2,
  useOfferings,
  useSeasons,
  type AutoAssignBulkPayload,
  type AutoAssignBulkResult,
  type GroupSelectionStatV2Dto,
} from '../api'
import type {
  ElectiveBlockSeasonDto,
  ElectiveOfferingDto,
  StudentWithoutSelectionDto,
} from '../types'
import { useAppendix3Data } from '@/features/individual-plans/api'
import type { Appendix3Data } from '@/features/individual-plans/types'

import { ElectiveCampaignPanel } from './ElectiveCampaignPanel'
import { ElectiveCatalogAdminPanel } from './ElectiveCatalogAdminPanel'

const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear()

// ── Tab 2: Group stats (new architecture) ────────────────────────────────────

function GroupStatsTab({ academicYear }: { academicYear: string }) {
  const [groupId, setGroupId] = useState('')
  const { data: stats = [], isLoading } = useGroupSelectionStatsV2(groupId || 'skip', academicYear)
  const belowQuorum = stats.filter(s => !s.hasQuorum)

  return (
    <div className="space-y-4">
      <div className="relative min-w-[200px] max-w-[320px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={groupId}
          onChange={e => setGroupId(e.target.value)}
          placeholder="ID групи..."
          className="pl-9 bg-background"
        />
      </div>

      {belowQuorum.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>
            {belowQuorum.length} ВК не досягли кворуму (≥75%). Потрібна консультація зі студентами.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Назва дисципліни</TableHead>
              <TableHead className="w-16 text-center hidden sm:table-cell">Сем.</TableHead>
              <TableHead className="w-36">Вибрали</TableHead>
              <TableHead className="w-24 text-right">Кворум</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && groupId && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-3 w-full rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
              </TableRow>
            ))}
            {!isLoading && stats.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  {groupId ? 'Немає даних для цієї групи' : 'Введіть ID групи'}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (stats as GroupSelectionStatV2Dto[]).map(s => (
              <TableRow key={s.component.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium text-sm">{s.component.name}</TableCell>
                <TableCell className="text-center hidden sm:table-cell text-sm font-mono text-muted-foreground">
                  {s.semesterNumber}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress
                      value={s.percentage}
                      className={cn('h-2', s.hasQuorum ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {s.count} з {s.total} ({s.percentage}%)
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {s.hasQuorum ? (
                    <div className="flex items-center justify-end gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 size={13} />Кворум
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <AlertTriangle size={13} />Мало
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ── Assign dialog (new architecture) ─────────────────────────────────────────

function AssignDialog({
  student,
  seasons,
  open,
  onClose,
}: {
  student: StudentWithoutSelectionDto
  seasons: ElectiveBlockSeasonDto[]
  open: boolean
  onClose: () => void
}) {
  const [seasonId, setSeasonId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const { data: offerings = [], isLoading: offeringsLoading } = useOfferings(seasonId)
  const assign = useAdminAssignV2()

  const handleSeasonChange = (id: string) => {
    setSeasonId(id)
    setComponentId('')
  }

  const handleAssign = () => {
    if (!seasonId || !componentId) return
    assign.mutate(
      { studentId: student.id, seasonId, componentId, overrideReason: overrideReason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`ВК призначено: ${student.personFIO}`)
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Призначити ВК наказом</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Студент</p>
            <p className="text-sm font-medium">{student.personFIO}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Блок ВК та навчальний рік</Label>
            <Select value={seasonId} onValueChange={handleSeasonChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Оберіть каталог..." />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.block.name} — {s.block.semesterNumber} сем. [{s.academicYear}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {seasonId && (
            <div className="space-y-1.5">
              <Label>Навчальна дисципліна</Label>
              <Select value={componentId} onValueChange={setComponentId} disabled={offeringsLoading}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={offeringsLoading ? 'Завантаження...' : 'Оберіть дисципліну...'} />
                </SelectTrigger>
                <SelectContent>
                  {offerings.map(o => (
                    <SelectItem key={o.componentId} value={o.componentId} className="text-xs">
                      {o.component.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="override-reason">Підстава (необов&apos;язково)</Label>
            <Input
              id="override-reason"
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="Номер наказу, протокол..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button onClick={handleAssign} disabled={!seasonId || !componentId || assign.isPending}>
            {assign.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            Призначити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Auto-assign bulk dialog ───────────────────────────────────────────────────

function AutoAssignBulkDialog({
  seasonId,
  groupId,
  unselectedCount,
  offerings,
  open,
  onClose,
}: {
  seasonId: string
  groupId: string
  unselectedCount: number
  offerings: ElectiveOfferingDto[]
  open: boolean
  onClose: () => void
}) {
  const [componentId, setComponentId] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const autoAssign = useAutoAssignBulk(seasonId)

  const handleAutoAssign = () => {
    const payload: AutoAssignBulkPayload = {
      groupId,
      componentId: componentId || undefined,
      overrideReason: overrideReason.trim() || undefined,
    }
    autoAssign.mutate(payload, {
      onSuccess: (result: AutoAssignBulkResult) => {
        if (result.assigned === 0) {
          toast.info('Усі студенти вже мають вибір — призначень не зроблено')
        } else {
          toast.success(`Наказом призначено: ${result.assigned} студент(ів) → «${result.componentName}»`)
        }
        onClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Масове призначення наказом</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {unselectedCount} студент(ів) без вибору
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              §3.6 Положення: студенти, що не подали заяву до дедлайну, отримують призначення наказом.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Дисципліна для призначення</Label>
            <Select value={componentId} onValueChange={setComponentId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Автоматично (найпопулярніша)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="text-xs italic text-muted-foreground">
                  Автоматично (найпопулярніша серед групи)
                </SelectItem>
                {offerings.map(o => (
                  <SelectItem key={o.componentId} value={o.componentId} className="text-xs">
                    {o.component.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Якщо не обрано — призначається дисципліна з найбільшою кількістю заяв від групи.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-reason">
              Підстава
              {componentId ? (
                <span className="text-destructive ml-1">*</span>
              ) : (
                <span className="text-muted-foreground ml-1">(необов&apos;язково)</span>
              )}
            </Label>
            <Input
              id="bulk-reason"
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="Номер наказу, дата, протокол..."
            />
            {componentId && !overrideReason.trim() && (
              <p className="text-xs text-destructive">
                При ручному виборі дисципліни підстава є обов&apos;язковою.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button
            onClick={handleAutoAssign}
            disabled={autoAssign.isPending || (!!componentId && !overrideReason.trim())}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {autoAssign.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            Призначити наказом ({unselectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Tab 3: Assign (new architecture) ─────────────────────────────────────────

function AssignTab({ academicYear }: { academicYear: string }) {
  const [groupId, setGroupId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [assignTarget, setAssignTarget] = useState<StudentWithoutSelectionDto | null>(null)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const { data: seasons = [] } = useSeasons(academicYear)
  const { data: offerings = [] } = useOfferings(seasonId)

  const { data: unselected = [], isLoading } = useUnselectedStudentsV2(groupId || 'skip', seasonId)

  const canBulkAssign = !!groupId && !!seasonId && unselected.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-[300px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            placeholder="ID групи..."
            className="pl-9 bg-background"
          />
        </div>
        <Select value={seasonId} onValueChange={setSeasonId}>
          <SelectTrigger className="w-[260px] bg-background">
            <SelectValue placeholder="Оберіть каталог..." />
          </SelectTrigger>
          <SelectContent>
            {seasons.map(s => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.block.name} — {s.block.semesterNumber} сем.
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canBulkAssign && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
            onClick={() => setShowBulkDialog(true)}
          >
            <AlertTriangle size={13} className="mr-1.5" />
            Призначити всім незаповненим ({unselected.length})
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>ПІБ студента</TableHead>
              <TableHead className="w-40 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && groupId && seasonId && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-7 w-32 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))}
            {!isLoading && unselected.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-10">
                  {groupId && seasonId
                    ? 'Усі студенти вже мають вибір для цього каталогу'
                    : 'Введіть ID групи та оберіть каталог'}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && unselected.map(s => (
              <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-sm">{s.personFIO}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setAssignTarget(s)}
                  >
                    Призначити ВК
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {assignTarget && (
        <AssignDialog
          student={assignTarget}
          seasons={seasons}
          open
          onClose={() => setAssignTarget(null)}
        />
      )}

      {showBulkDialog && seasonId && groupId && (
        <AutoAssignBulkDialog
          seasonId={seasonId}
          groupId={groupId}
          unselectedCount={unselected.length}
          offerings={offerings}
          open
          onClose={() => setShowBulkDialog(false)}
        />
      )}
    </div>
  )
}

// ── Tab 4: Enrollment list (new architecture) ─────────────────────────────────

function EnrollmentListTab({ academicYear }: { academicYear: string }) {
  const [seasonId, setSeasonId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [showAppendix3, setShowAppendix3] = useState(false)
  const { data: seasons = [] } = useSeasons(academicYear)
  const { data: offerings = [] } = useOfferings(seasonId)

  // inline enrollment list query
  const { data: rows = [], isLoading } = useEnrollmentListV2(seasonId, componentId)

  // Appendix 3 data
  const { data: appendix3Data } = useAppendix3Data(
    showAppendix3 ? seasonId : '',
    showAppendix3 ? groupId : '',
  )

  const handleExport = () => {
    const header = ['№', 'ПІБ', 'Заява', 'Наказ']
    const csvRows = [header, ...rows.map(r => [String(r.no), r.fullName, r.voluntary, r.assigned])]
    const csv = csvRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ВК_Додаток3_${academicYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Файл завантажено')
  }

  const handleSeasonChange = (id: string) => {
    setSeasonId(id)
    setComponentId('')
    setShowAppendix3(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={seasonId} onValueChange={handleSeasonChange}>
          <SelectTrigger className="w-[240px] bg-background">
            <SelectValue placeholder="Оберіть каталог..." />
          </SelectTrigger>
          <SelectContent>
            {seasons.map(s => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.block.name} — {s.block.semesterNumber} сем.
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {seasonId && !showAppendix3 && (
          <Select value={componentId} onValueChange={setComponentId}>
            <SelectTrigger className="w-[260px] bg-background">
              <SelectValue placeholder="Оберіть дисципліну..." />
            </SelectTrigger>
            <SelectContent>
              {offerings.map(o => (
                <SelectItem key={o.componentId} value={o.componentId} className="text-xs">
                  {o.component.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {seasonId && showAppendix3 && (
          <div className="relative min-w-[200px] max-w-[260px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              placeholder="ID групи..."
              className="pl-9 bg-background"
            />
          </div>
        )}

        {rows.length > 0 && !showAppendix3 && (
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
            <Download size={14} />Завантажити CSV
          </Button>
        )}

        {seasonId && (
          <Button
            size="sm"
            variant={showAppendix3 ? 'default' : 'outline'}
            onClick={() => setShowAppendix3(!showAppendix3)}
            className="gap-1.5"
          >
            <Printer size={14} />
            {showAppendix3 ? 'Таблиця зарахувань' : 'Друк Додатку 3'}
          </Button>
        )}
      </div>

      {showAppendix3 && appendix3Data ? (
        <Appendix3PrintViewInline data={appendix3Data} />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10">№</TableHead>
                <TableHead>ПІБ</TableHead>
                <TableHead className="w-20 text-center">Заява</TableHead>
                <TableHead className="w-20 text-center">Наказ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    {seasonId && componentId ? 'Немає записів' : 'Оберіть каталог та дисципліну ВК'}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && rows.map(r => (
                <TableRow key={r.studentId} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-sm text-muted-foreground font-mono">{r.no}</TableCell>
                  <TableCell className="text-sm">{r.fullName}</TableCell>
                  <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-medium">{r.voluntary}</TableCell>
                  <TableCell className="text-center text-amber-600 dark:text-amber-400 font-medium">{r.assigned}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function Appendix3PrintViewInline({ data }: { data: Appendix3Data }) {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-lg font-bold">Додаток 3</p>
        <p className="text-sm text-muted-foreground">
          Список студентів групи {data.group}, зарахованих на ВК «{data.block}»
          ({data.semester} семестр, {data.academicYear} н.р.)
        </p>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10">№</TableHead>
              <TableHead>ПІБ</TableHead>
              <TableHead>Назва ВК</TableHead>
              <TableHead className="w-36 text-center">Спосіб вибору ВК</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map(r => (
              <TableRow key={r.no} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-sm text-muted-foreground font-mono">{r.no}</TableCell>
                <TableCell className="text-sm">{r.fullName}</TableCell>
                <TableCell className="text-sm">{r.componentName}</TableCell>
                <TableCell className="text-center text-sm font-medium">
                  {r.methodLabel}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>Всього: {data.totalStudents}</span>
        <span>За заявою: {data.voluntaryCount}</span>
        <span>За наказом: {data.assignedCount}</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => window.print()}
        className="gap-1.5"
      >
        <Printer size={14} />Друк
      </Button>
    </div>
  )
}

// ── Inline hooks for tabs that need V2 endpoints ──────────────────────────────
// Defined here to keep imports clean at the top

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { EnrollmentRowDto, StudentWithoutSelectionDto as SWS } from '../types'

function useUnselectedStudentsV2(groupId: string, seasonId: string) {
  return useQuery({
    queryKey: ['electives', 'unselected-v2', groupId, seasonId] as const,
    queryFn: () =>
      apiGet<SWS[]>(ENDPOINTS.ELECTIVES.ADMIN_UNSELECTED_V2, { params: { groupId, seasonId } }),
    enabled: !!groupId && groupId !== 'skip' && !!seasonId,
    staleTime: 30_000,
  })
}

function useEnrollmentListV2(seasonId: string, componentId: string) {
  return useQuery({
    queryKey: ['electives', 'enrollment-v2', seasonId, componentId] as const,
    queryFn: () =>
      apiGet<EnrollmentRowDto[]>(ENDPOINTS.ELECTIVES.ADMIN_ENROLLMENT_LIST_V2, {
        params: { seasonId, componentId },
      }),
    enabled: !!seasonId && !!componentId,
    staleTime: 30_000,
  })
}

// ── Root ──────────────────────────────────────────────────────────────────────

interface AdminProps {
  academicYear?: string
}

const FAQ_STEPS = [
  {
    tab: 'Каталог ВК',
    title: 'Створіть або клонуйте каталог ВК',
    description:
      'Оберіть спеціальність і додайте вибіркові компоненти (назва, семестр, кредити ЄКТС). Можна клонувати каталог з попереднього року.',
  },
  {
    tab: 'Кампанія',
    title: 'Створіть кампанію вибору',
    description:
      'Вкажіть навчальний рік, семестр, дати початку/завершення вибору. Кампанія визначає часовий вікно, протягом якого студенти можуть обирати ВК.',
  },
  {
    tab: 'Каталог ВК',
    title: 'Опублікуйте каталог (статус → Відкрито)',
    description:
      'Змініть статус кожного ВК з «Чернетка» на «Відкрито». Лише відкриті ВК стають видимими для студентів і доступні для вибору.',
  },
  {
    tab: '—',
    title: 'Студенти подають заяви',
    description:
      'Після відкриття каталогу студенти заходять на сторінку «Мої ВК» і обирають компоненти на відповідний семестр. Заява фіксується автоматично (§3.4 Положення).',
  },
  {
    tab: 'Вибір по групах',
    title: 'Перевірте статистику по групах',
    description:
      'Перегляньте скільки студентів у кожній групі вже зробили вибір, а скільки — ні. Зверніть увагу на кворум.',
  },
  {
    tab: 'Призначення',
    title: 'Призначте ВК тим, хто не обрав',
    description:
      'Студенти, які не подали заяву у встановлений строк, зараховуються на ВК наказом (§3.11 Положення). Використовуйте авто-призначення або зробіть це вручну.',
  },
  {
    tab: '—',
    title: 'Підтвердіть усі вибори',
    description:
      'Натисніть «Підтвердити всі вибори» (кнопка зверху). Це зафіксує остаточний розподіл студентів по ВК та змінить статус виборів на «Підтверджено».',
  },
  {
    tab: 'Списки (Дод. 3)',
    title: 'Роздрукуйте Додаток 3',
    description:
      'Сформуйте та роздрукуйте список зарахованих студентів із зазначенням способу вибору ВК (заява / наказ) — відповідно до §3.9 Положення.',
  },
  {
    tab: '—',
    title: 'Сформуйте індивідуальні навчальні плани',
    description:
      'Перейдіть до розділу «Індивідуальні плани» (бічне меню) → оберіть групу → «Сформувати ІНП для групи». Обрані ВК автоматично потраплять до плану кожного студента (§5.12 Наказу 510).',
  },
] as const

function FaqDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>Порядок роботи з ВК</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ol className="space-y-4">
            {FAQ_STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">
                    {step.title}
                    {step.tab !== '—' && (
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                        (вкладка «{step.tab}»)
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="border-t border-border p-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Закрити</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function ElectiveAdminClient({ academicYear = CURRENT_ACADEMIC_YEAR }: AdminProps) {
  const confirm = useConfirmSelectionsV2()
  const [faqOpen, setFaqOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Вибіркові компоненти</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{academicYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setFaqOpen(true)}
            title="Порядок роботи з ВК"
            className="h-8 w-8 text-muted-foreground"
          >
            <HelpCircle size={18} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              confirm.mutate(academicYear, {
                onSuccess: r => toast.success(`Підтверджено: ${r.confirmed} вибор(ів)`),
              })
            }
            disabled={confirm.isPending}
            className="gap-1.5"
          >
            {confirm.isPending ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            Підтвердити всі вибори
          </Button>
        </div>
      </div>

      <FaqDrawer open={faqOpen} onOpenChange={setFaqOpen} />

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Каталог ВК</TabsTrigger>
          <TabsTrigger value="campaign">Кампанія</TabsTrigger>
          <TabsTrigger value="stats">Вибір по групах</TabsTrigger>
          <TabsTrigger value="assign">Призначення</TabsTrigger>
          <TabsTrigger value="list">
            Списки
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">Дод. 3</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          <ElectiveCatalogAdminPanel academicYear={academicYear} />
        </TabsContent>
        <TabsContent value="campaign" className="mt-4">
          <ElectiveCampaignPanel />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <GroupStatsTab academicYear={academicYear} />
        </TabsContent>
        <TabsContent value="assign" className="mt-4">
          <AssignTab academicYear={academicYear} />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <EnrollmentListTab academicYear={academicYear} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
