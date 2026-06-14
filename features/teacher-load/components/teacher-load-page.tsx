'use client'

import { useState } from 'react'
import { BookOpenCheck, Lock } from 'lucide-react'

import { useWorkingCurricula } from '@/features/academic-plans/api'
import type { WorkingCurriculumSummaryDto } from '@/features/academic-plans/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useUser } from '@/store/auth.store'

/** Sentinel-значення для «Усі роки» (Radix Select не дозволяє порожній value). */
const ALL_YEARS = 'all'

import { AllTeachersTable } from './all-teachers-table'
import { AssignmentTable } from './assignment-table'
import { TeacherLoadTable } from './teacher-load-table'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MANAGER_ROLES = ['DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

function wcLabel(wc: WorkingCurriculumSummaryDto): string {
  const { version } = wc
  const prog = version.curriculum.program
  return `${prog.specialty.code} ${prog.name} — ${wc.academicYear} (v${version.versionNumber})`
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS: string[] = Array.from({ length: 6 }, (_, i) => {
  const y = CURRENT_YEAR - 2 + i
  return `${y}-${y + 1}`
})

type Tab = 'summary' | 'assign' | 'all'

const TABS: { id: Tab; label: string; needsWc: boolean }[] = [
  { id: 'assign', label: 'Призначення викладачів', needsWc: true },
  { id: 'summary', label: 'Зведення по плану', needsWc: true },
  { id: 'all', label: 'Усі викладачі', needsWc: false },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function TeacherLoadPage() {
  const user = useUser()
  const canManage = !!user && MANAGER_ROLES.includes(user.role)

  const [academicYear, setAcademicYear] = useState<string>('')
  const [selectedWcId, setSelectedWcId] = useState<string>('')
  const [tab, setTab] = useState<Tab>('assign')

  const { data: workingCurricula = [], isLoading: wcLoading } = useWorkingCurricula(
    academicYear ? { academicYear } : undefined,
  )

  const wcIds = new Set(workingCurricula.map((w) => w.id))
  const effectiveWcId = wcIds.has(selectedWcId) ? selectedWcId : ''

  // Доступ лише керівництву; викладачі бачать своє навантаження на головній.
  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="font-semibold">Доступ обмежено</p>
          <p className="text-sm text-muted-foreground">
            Розподіл педагогічного навантаження доступний керівництву. Власне
            навантаження ви можете переглянути на головній сторінці.
          </p>
        </div>
      </div>
    )
  }

  const needsWc = tab !== 'all'

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpenCheck className="w-6 h-6 text-primary" />
          Педагогічне навантаження
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Розподіл годин по викладачах на підставі робочого навчального плану
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Навчальний рік</label>
          <Select
            value={academicYear === '' ? ALL_YEARS : academicYear}
            onValueChange={(v) => {
              setAcademicYear(v === ALL_YEARS ? '' : v)
              setSelectedWcId('')
            }}
          >
            <SelectTrigger className="h-9 min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_YEARS}>Усі роки</SelectItem>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsWc && (
          <div className="flex flex-col gap-1 flex-1 min-w-[260px]">
            <label className="text-xs font-medium text-muted-foreground">Робочий навчальний план</label>
            {wcLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select
                value={effectiveWcId || undefined}
                onValueChange={setSelectedWcId}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="— Оберіть план —" />
                </SelectTrigger>
                <SelectContent>
                  {workingCurricula.map((wc) => (
                    <SelectItem key={wc.id} value={wc.id}>{wcLabel(wc)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-col gap-0">
        <div className="flex border-b border-border">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-b-md border-x border-b border-border overflow-hidden">
          {tab === 'all' ? (
            <AllTeachersTable academicYear={academicYear} />
          ) : effectiveWcId === '' ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
              <BookOpenCheck className="w-10 h-10 opacity-30" />
              <p className="text-sm">Оберіть робочий навчальний план</p>
            </div>
          ) : tab === 'assign' ? (
            <AssignmentTable workingCurriculumId={effectiveWcId} />
          ) : (
            <TeacherLoadTable workingCurriculumId={effectiveWcId} />
          )}
        </div>
      </div>
    </div>
  )
}
