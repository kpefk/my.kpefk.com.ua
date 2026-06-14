'use client'

import { useMemo, useState } from 'react'

import { useStudents } from '@/features/students/api'
import { StudentDetailSheet } from '@/features/students/components/student-detail-sheet'
import { StudentSyncButton } from '@/features/students/components/sync-button'
import { StudentsFilters } from '@/features/students/components/students-filters'
import { StudentsTable } from '@/features/students/components/students-table'
import {
  DEFAULT_STUDENT_FILTERS,
  isStudentActive,
  type StudentDto,
  type StudentFilters,
} from '@/features/students/types'

export function StudentsClient() {
  const [filters, setFilters] = useState<StudentFilters>(DEFAULT_STUDENT_FILTERS)
  const [selected, setSelected] = useState<StudentDto | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: students = [], isLoading } = useStudents(filters)

  const courses = useMemo(
    () =>
      [
        ...new Map(
          students
            .filter((s) => s.courseId != null)
            .map((s) => [s.courseId, { id: s.courseId!, name: s.courseName ?? '' }]),
        ).values(),
      ].sort((a, b) => a.id - b.id),
    [students],
  )

  const groups = useMemo(
    () =>
      [
        ...new Map(
          students
            .filter((s) => s.groupName)
            .map((s) => [s.groupName, { name: s.groupName!, courseId: s.courseId }]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name, 'uk')),
    [students],
  )

  const forms = useMemo(
    () =>
      [
        ...new Map(
          students
            .filter((s) => s.educationFormId != null)
            .map((s) => [s.educationFormId, { id: s.educationFormId!, name: s.educationFormName ?? '' }]),
        ).values(),
      ],
    [students],
  )

  const filtered = useMemo(() => {
    const searchLower = filters.search.toLowerCase()
    return students.filter((s) => {
      const matchesSearch =
        !filters.search ||
        s.personFIO.toLowerCase().includes(searchLower) ||
        (s.groupName?.toLowerCase().includes(searchLower) ?? false)
      const matchesCourse = filters.courseId == null || s.courseId === filters.courseId
      const matchesGroup = filters.groupName == null || s.groupName === filters.groupName
      const matchesForm = filters.educationFormId == null || s.educationFormId === filters.educationFormId
      const matchesStatus = filters.isActive === null || isStudentActive(s) === filters.isActive
      return matchesSearch && matchesCourse && matchesGroup && matchesForm && matchesStatus
    })
  }, [students, filters])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Студенти</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? 'Завантаження...' : `${filtered.length} з ${students.length} студентів`}
          </p>
        </div>
        <StudentSyncButton />
      </div>

      <StudentsFilters filters={filters} onChange={setFilters} courses={courses} groups={groups} forms={forms} />

      <StudentsTable
        students={filtered}
        isLoading={isLoading}
        onRowClick={(s) => { setSelected(s); setSheetOpen(true) }}
      />

      <StudentDetailSheet student={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
