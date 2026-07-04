'use client'

import { useState } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/store/auth.store'

import { useMyDisciplines } from '../api'
import type { TeacherDisciplineDto } from '../types'

import { DisciplineSelector } from './discipline-selector'
import { GradeSheetTable } from './grade-sheet-table'
import { GradeWeightSettingsDialog } from './grade-weight-settings-dialog'
import { StudentTranscript } from './student-transcript'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS: string[] = Array.from({ length: 4 }, (_, i) => {
  const y = CURRENT_YEAR - 2 + i
  return `${y}-${y + 1}`
})

const ELEVATED_ROLES = [
  'HEAD_OF_DEPARTMENT',
  'DEPUTY_DIRECTOR',
  'DIRECTOR',
  'ADMINISTRATOR',
]

function defaultAcademicYear(): string {
  const now = new Date()
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return `${y}-${y + 1}`
}

export function GradesClient() {
  const user = useUser()

  if (!user) return <Skeleton className="h-64 w-full" />

  if (user.role === 'STUDENT') {
    return <StudentGradesView studentId={user.id} />
  }

  if (ELEVATED_ROLES.includes(user.role) || user.role === 'TEACHER') {
    return <TeacherGradesView />
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
      <p className="font-semibold">Доступ обмежено</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Перегляд оцінок доступний для студентів та викладачів.
      </p>
    </div>
  )
}

function StudentGradesView({ studentId }: { studentId: string }) {
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Оцінки</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Залікова книжка</p>
        </div>
        <YearSelect value={academicYear} onChange={setAcademicYear} />
      </div>

      <StudentTranscript studentId={studentId} academicYear={academicYear} />
    </div>
  )
}

function TeacherGradesView() {
  const user = useUser()
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear)
  const [selected, setSelected] = useState<TeacherDisciplineDto | null>(null)

  const { data: disciplines = [], isLoading } = useMyDisciplines(academicYear)
  const canManageWeights = !!user && ELEVATED_ROLES.includes(user.role)

  function handleSelect(d: TeacherDisciplineDto) {
    setSelected(d)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Оцінки</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {selected ? selected.subjectName : 'Оберіть дисципліну'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageWeights && <GradeWeightSettingsDialog />}
          <YearSelect value={academicYear} onChange={setAcademicYear} />
        </div>
      </div>

      {!selected ? (
        <DisciplineSelector
          disciplines={disciplines}
          isLoading={isLoading}
          selectedId=""
          onSelect={handleSelect}
        />
      ) : selected.groupId ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-primary hover:underline"
          >
            &larr; До списку дисциплін
          </button>
          <GradeSheetTable
            componentTermId={selected.curriculumComponentTermId}
            groupId={selected.groupId}
            academicYear={academicYear}
            subjectName={selected.subjectName}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-primary hover:underline"
          >
            &larr; До списку дисциплін
          </button>
          <p className="text-sm text-muted-foreground">
            Для цієї дисципліни не визначена група. Зверніться до адміністратора.
          </p>
        </div>
      )}
    </div>
  )
}

function YearSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {YEAR_OPTIONS.map((y) => (
          <SelectItem key={y} value={y}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
