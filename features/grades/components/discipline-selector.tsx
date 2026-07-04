'use client'

import { BookOpen } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import type { TeacherDisciplineDto } from '../types'
import { CONTROL_FORM_LABELS, GRADE_SCALE_LABELS } from '../types'

interface DisciplineSelectorProps {
  disciplines: TeacherDisciplineDto[]
  isLoading: boolean
  selectedId: string
  onSelect: (discipline: TeacherDisciplineDto) => void
}

export function DisciplineSelector({
  disciplines,
  isLoading,
  selectedId,
  onSelect,
}: DisciplineSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (disciplines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <BookOpen size={24} className="text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-sm">
          <p className="font-semibold">Немає дисциплін</p>
          <p className="text-sm text-muted-foreground">
            За обраний навчальний рік немає призначених дисциплін для оцінювання.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {disciplines.map((d) => {
        const active = selectedId === d.curriculumComponentTermId
        return (
          <button
            key={`${d.curriculumComponentTermId}-${d.groupId}`}
            onClick={() => onSelect(d)}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:bg-muted/40',
            )}
          >
            <p className="font-semibold text-sm leading-tight">{d.subjectName}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {d.groupName && (
                <Badge variant="secondary" className="text-xs">
                  {d.groupName}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {GRADE_SCALE_LABELS[d.gradeScale]}
              </Badge>
              {d.controlForm && (
                <Badge variant="outline" className="text-xs">
                  {CONTROL_FORM_LABELS[d.controlForm]}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {d.semesterNumber} сем.
              </Badge>
            </div>
          </button>
        )
      })}
    </div>
  )
}
