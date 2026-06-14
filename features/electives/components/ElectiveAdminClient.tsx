'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Search,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
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
import { ElectiveCampaignPanel } from './ElectiveCampaignPanel'

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
            <Label htmlFor="override-reason">Підстава (необов'язково)</Label>
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
                <span className="text-muted-foreground ml-1">(необов'язково)</span>
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
                При ручному виборі дисципліни підстава є обов'язковою.
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
  const { data: seasons = [] } = useSeasons(academicYear)
  const { data: offerings = [] } = useOfferings(seasonId)

  // inline enrollment list query
  const { data: rows = [], isLoading } = useEnrollmentListV2(seasonId, componentId)

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

        {seasonId && (
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

        {rows.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
            <Download size={14} />Завантажити CSV
          </Button>
        )}
      </div>

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

export function ElectiveAdminClient({ academicYear = CURRENT_ACADEMIC_YEAR }: AdminProps) {
  const confirm = useConfirmSelectionsV2()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Вибіркові компоненти</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{academicYear}</p>
        </div>
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

      <Tabs defaultValue="campaign">
        <TabsList>
          <TabsTrigger value="campaign">Кампанія</TabsTrigger>
          <TabsTrigger value="stats">Вибір по групах</TabsTrigger>
          <TabsTrigger value="assign">Призначення</TabsTrigger>
          <TabsTrigger value="list">
            Списки
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">Дод. 3</Badge>
          </TabsTrigger>
        </TabsList>

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
