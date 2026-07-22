'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Download, Loader2, Lock, Trophy } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useGroups } from '@/features/groups/api'
import { DEFAULT_GROUP_FILTERS } from '@/features/groups/types'
import { useUser } from '@/store/auth.store'
import { cn } from '@/lib/utils'

import { downloadRatingXlsx, useGroupRating, useSetRatingBonus } from '../api'
import type { RatingRowDto } from '../types'

const MANAGE_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS: string[] = Array.from({ length: 4 }, (_, i) => {
  const y = CURRENT_YEAR - 2 + i
  return `${y}-${y + 1}`
})

function defaultAcademicYear(): string {
  const now = new Date()
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return `${y}-${y + 1}`
}

export function RatingClient() {
  const user = useUser()

  if (!user) return <Skeleton className="h-64 w-full" />
  if (!MANAGE_ROLES.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
        <p className="font-semibold">Доступ обмежено</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Рейтинг успішності доступний керівництву.
        </p>
      </div>
    )
  }

  return <RatingView />
}

function RatingView() {
  const [groupId, setGroupId] = useState('')
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear)
  const [semesterNumber, setSemesterNumber] = useState(1)
  const [downloading, setDownloading] = useState(false)

  const { data: groups = [] } = useGroups(DEFAULT_GROUP_FILTERS)
  const { data: rating, isLoading } = useGroupRating(groupId, academicYear, semesterNumber)

  async function handleDownload() {
    if (!rating) return
    setDownloading(true)
    try {
      await downloadRatingXlsx(groupId, academicYear, semesterNumber, rating.groupName)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Рейтинг успішності
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Для призначення академічних стипендій (ранжуються лише бюджетники)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Група</label>
          <Select value={groupId || undefined} onValueChange={setGroupId}>
            <SelectTrigger className="h-9 min-w-[140px]">
              <SelectValue placeholder="— Група —" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Навчальний рік</label>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="h-9 min-w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Семестр</label>
          <Select
            value={String(semesterNumber)}
            onValueChange={(v) => setSemesterNumber(Number(v))}
          >
            <SelectTrigger className="h-9 min-w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <SelectItem key={s} value={String(s)}>{s} семестр</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        {rating && rating.rows.length > 0 && (
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Експорт XLSX
          </Button>
        )}
      </div>

      {/* Table */}
      {groupId === '' ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 opacity-30" />
          <p className="text-sm">Оберіть групу</p>
        </div>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : rating ? (
        <RatingTable
          rows={rating.rows}
          budgetCount={rating.budgetCount}
          academicYear={academicYear}
          semesterNumber={semesterNumber}
        />
      ) : null}
    </div>
  )
}

function RatingTable({
  rows,
  budgetCount,
  academicYear,
  semesterNumber,
}: {
  rows: RatingRowDto[]
  budgetCount: number
  academicYear: string
  semesterNumber: number
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        У рейтингу (бюджет): {budgetCount} із {rows.length} студентів. Формула: середнє оцінок,
        нормалізованих до 100-бальної (12-б: g/12×100; 5-б: (3g−4)/12×100) + додатковий бал.
      </p>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center">Ранг</TableHead>
              <TableHead>ПІБ</TableHead>
              <TableHead className="w-20 text-center">Форма</TableHead>
              <TableHead className="w-24 text-center">Бал (100)</TableHead>
              <TableHead className="w-32 text-center">Додатковий бал</TableHead>
              <TableHead className="w-24 text-center">Рейтинг</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <RatingRow
                key={r.studentId}
                row={r}
                expanded={expanded.has(r.studentId)}
                onToggle={() => toggle(r.studentId)}
                academicYear={academicYear}
                semesterNumber={semesterNumber}
              />
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  Немає активних студентів у групі
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RatingRow({
  row,
  expanded,
  onToggle,
  academicYear,
  semesterNumber,
}: {
  row: RatingRowDto
  expanded: boolean
  onToggle: () => void
  academicYear: string
  semesterNumber: number
}) {
  const setBonus = useSetRatingBonus()
  const [bonusDraft, setBonusDraft] = useState<string | null>(null)

  function saveBonus() {
    if (bonusDraft === null) return
    const points = Number(bonusDraft)
    if (Number.isNaN(points) || points < 0 || points > 100) {
      setBonusDraft(null)
      return
    }
    if (points !== row.bonusPoints) {
      setBonus.mutate({
        studentId: row.studentId,
        academicYear,
        semesterNumber,
        points,
      })
    }
    setBonusDraft(null)
  }

  return (
    <>
      <TableRow className={cn(!row.isBudget && 'opacity-70')}>
        <TableCell className="text-center font-bold tabular-nums">
          {row.rank ?? '—'}
        </TableCell>
        <TableCell className="font-medium">{row.fullName}</TableCell>
        <TableCell className="text-center">
          {row.isBudget ? (
            <Badge>Б</Badge>
          ) : row.paymentTypeName ? (
            <Badge variant="outline">К</Badge>
          ) : (
            <Badge variant="outline" title="Джерело фінансування ще не синхронізовано з ЄДЕБО">
              ?
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {row.averageScore ?? '—'}
        </TableCell>
        <TableCell className="text-center">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={bonusDraft ?? String(row.bonusPoints)}
            onChange={(e) => setBonusDraft(e.target.value)}
            onBlur={saveBonus}
            disabled={setBonus.isPending}
            className="w-20 mx-auto text-center h-8"
          />
        </TableCell>
        <TableCell className="text-center font-bold tabular-nums text-primary">
          {row.totalScore ?? '—'}
        </TableCell>
        <TableCell>
          {row.disciplines.length > 0 && (
            <button
              type="button"
              onClick={onToggle}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground"
              title="Оцінки по дисциплінах"
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={7} className="py-2 px-6">
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {row.disciplines.map((d) => (
                <div key={d.componentName} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{d.componentName}</span>
                  <span className="tabular-nums shrink-0">
                    {d.grade}
                    <span className="text-muted-foreground/60">
                      /{d.gradeScale === 'TWELVE_POINT' ? 12 : 5}
                    </span>{' '}
                    <span className="text-muted-foreground">→ {d.normalized}</span>
                  </span>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
