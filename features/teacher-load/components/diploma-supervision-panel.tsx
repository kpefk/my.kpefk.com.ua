'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { useWorkingCurriculum } from '@/features/academic-plans/api'
import { useTeachers } from '@/features/teachers/api'
import { DEFAULT_FILTERS } from '@/features/teachers/types'
import { cn } from '@/lib/utils'

import {
  useAssignDiplomaSupervisor,
  useDiplomaSupervisionAssignments,
  useUnassignDiplomaSupervisor,
} from '../api'
import { SUPERVISION_ROLE_LABELS, type SupervisionRole } from '../types'

/** Закриває дропдаун при кліку поза ним або натисканні Esc. */
function useDismissable(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function onDocPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
  return ref
}

const DIPLOMA_COMPONENT_TYPES = new Set(['DIPLOMA_PROJECT', 'QUALIFICATION_WORK_DEFENSE'])

// ─── Add supervisor/consultant cell ───────────────────────────────────────────

function AddAssigneeCell({
  studentId,
  workingCurriculumId,
  componentTermId,
  excludeTeacherIds,
}: {
  studentId: string
  workingCurriculumId: string
  componentTermId: string
  excludeTeacherIds: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<SupervisionRole>('SUPERVISOR')
  const containerRef = useDismissable(open, () => {
    setOpen(false)
    setSearch('')
  })
  const { data: teachers = [] } = useTeachers(DEFAULT_FILTERS)
  const assign = useAssignDiplomaSupervisor()

  const filtered = teachers
    .filter((t) => !excludeTeacherIds.has(t.id))
    .filter((t) => {
      const full = `${t.lastName} ${t.firstName} ${t.middleName ?? ''}`.toLowerCase()
      return full.includes(search.toLowerCase())
    })
    .slice(0, 20)

  function pick(teacherId: string) {
    assign.mutate({
      studentId,
      curriculumComponentTermId: componentTermId,
      workingCurriculumId,
      teacherId,
      role,
    })
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        {assign.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3" />
        )}
        Додати
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-0.5 w-64 rounded-md border border-border bg-popover shadow-lg">
          <div className="flex border-b border-border p-1 gap-1">
            {(['SUPERVISOR', 'CONSULTANT'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  'flex-1 px-2 py-1 text-[11px] rounded transition-colors',
                  role === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                {SUPERVISION_ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <div className="p-1 border-b border-border">
            <input
              autoFocus
              type="text"
              placeholder="Пошук викладача..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-0.5">
            {filtered.length === 0 && (
              <li className="px-2 py-1.5 text-xs text-muted-foreground">Нікого не знайдено</li>
            )}
            {filtered.map((t) => {
              const label = `${t.lastName} ${t.firstName} ${t.middleName ?? ''}`.trim()
              const short = `${t.lastName} ${t.firstName[0] ?? ''}.${t.middleName ? `${t.middleName[0]}.` : ''}`.trim()
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => pick(t.id)}
                    className="w-full px-2 py-1 text-xs text-left hover:bg-muted"
                    title={label}
                  >
                    {short}
                    {t.positionName !== null && (
                      <span className="ml-1 text-[10px] text-muted-foreground">{t.positionName}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Component term selector ──────────────────────────────────────────────────

function useDiplomaComponentOptions(workingCurriculumId: string) {
  const { data: wc } = useWorkingCurriculum(workingCurriculumId || null)
  const options = (wc?.componentTerms ?? [])
    .filter((t) => DIPLOMA_COMPONENT_TYPES.has(t.componentTerm.component.componentType))
    .map((t) => ({
      componentTermId: t.componentTerm.id,
      label: `${t.componentTerm.component.name} · ${t.componentTerm.semesterNumber} сем.`,
    }))
  return options
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function DiplomaSupervisionPanel({ workingCurriculumId }: { workingCurriculumId: string }) {
  const options = useDiplomaComponentOptions(workingCurriculumId)
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const effectiveTermId = options.some((o) => o.componentTermId === selectedTermId)
    ? selectedTermId
    : (options[0]?.componentTermId ?? '')

  const { data: rows, isLoading, error } = useDiplomaSupervisionAssignments(
    workingCurriculumId,
    effectiveTermId,
  )
  const unassign = useUnassignDiplomaSupervisor()

  if (options.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center text-muted-foreground">
        <p className="text-sm">У цьому плані немає компонентів дипломного проєктування</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {options.length > 1 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
          <label className="text-xs font-medium text-muted-foreground">Компонент:</label>
          <select
            value={effectiveTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="h-7 text-xs rounded-md border border-border bg-background px-2 pr-6 cursor-pointer"
          >
            {options.map((o) => (
              <option key={o.componentTermId} value={o.componentTermId}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}

      {error !== null && (
        <div className="p-4 text-sm text-destructive">
          Помилка завантаження керівництва дипломними роботами
        </div>
      )}

      {!isLoading && error === null && (
        <div className="overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap border-b border-border bg-card">
                  Студент
                </th>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground border-b border-border bg-card">
                  Керівник / консультанти
                </th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row) => {
                const excludeIds = new Set(row.assignments.map((a) => a.teacherId))
                return (
                  <tr key={row.studentId} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-1.5 text-xs border-b border-border/50 whitespace-nowrap">
                      {row.studentName}
                    </td>
                    <td className="px-3 py-1.5 text-xs border-b border-border/50">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {row.assignments.length === 0 && (
                          <span className="text-muted-foreground/50 italic">Не призначено</span>
                        )}
                        {row.assignments.map((a) => (
                          <span
                            key={a.id}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]',
                              a.role === 'SUPERVISOR'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                                : 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300',
                            )}
                          >
                            <span className="font-medium">{SUPERVISION_ROLE_LABELS[a.role]}:</span>
                            {a.teacherName}
                            <span className="text-muted-foreground/70">({a.hours} год)</span>
                            <button
                              type="button"
                              onClick={() =>
                                unassign.mutate({
                                  id: a.id,
                                  workingCurriculumId,
                                  componentTermId: effectiveTermId,
                                })
                              }
                              title="Зняти призначення"
                              className="hover:text-destructive transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <AddAssigneeCell
                          studentId={row.studentId}
                          workingCurriculumId={workingCurriculumId}
                          componentTermId={effectiveTermId}
                          excludeTeacherIds={excludeIds}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">
                    Немає студентів для призначення керівника
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
