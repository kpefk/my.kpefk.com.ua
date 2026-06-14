'use client'

import { useMemo, useState } from 'react'

import { TeacherDetailSheet } from '@/features/teachers/components/teacher-detail-sheet'
import { TeachersFilters } from '@/features/teachers/components/teachers-filters'
import { TeachersTable } from '@/features/teachers/components/teachers-table'
import { SyncButton } from '@/features/teachers/components/sync-button'
import { useTeachers } from '@/features/teachers/api'
import { DEFAULT_FILTERS, getFullName, type TeacherDto, type TeacherFilters } from '@/features/teachers/types'

export function TeachersClient() {
  const [filters, setFilters] = useState<TeacherFilters>(DEFAULT_FILTERS)
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDto | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: teachers = [], isLoading } = useTeachers(filters)

  const faculties = useMemo(
    () =>
      [
        ...new Map(
          teachers
            .filter((t) => t.universityFacultyId != null)
            .map((t) => [t.universityFacultyId, { id: t.universityFacultyId!, name: t.universityFacultyShortName ?? '' }]),
        ).values(),
      ],
    [teachers],
  )

  const chairs = useMemo(
    () =>
      [
        ...new Map(
          teachers
            .filter((t) => t.universityFacultyChairId != null)
            .map((t) => [
              t.universityFacultyChairId,
              { id: t.universityFacultyChairId!, name: t.universityFacultyChairShortName ?? '', facultyId: t.universityFacultyId! },
            ]),
        ).values(),
      ],
    [teachers],
  )

  const filtered = useMemo(() => {
    const searchLower = filters.search.toLowerCase()
    return teachers.filter((t) => {
      const matchesSearch =
        !filters.search ||
        getFullName(t).toLowerCase().includes(searchLower) ||
        (t.positionName?.toLowerCase().includes(searchLower) ?? false) ||
        (t.universityFacultyChairFullName?.toLowerCase().includes(searchLower) ?? false)
      const matchesFaculty = filters.facultyId == null || t.universityFacultyId === filters.facultyId
      const matchesChair = filters.chairId == null || t.universityFacultyChairId === filters.chairId
      const matchesStatus = filters.isActive === null || t.isActive === filters.isActive
      return matchesSearch && matchesFaculty && matchesChair && matchesStatus
    })
  }, [teachers, filters])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Викладачі</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? 'Завантаження...' : `${filtered.length} з ${teachers.length} викладачів`}
          </p>
        </div>
        <SyncButton />
      </div>

      <TeachersFilters filters={filters} onChange={setFilters} faculties={faculties} chairs={chairs} />

      <TeachersTable teachers={filtered} isLoading={isLoading} onRowClick={(t) => { setSelectedTeacher(t); setSheetOpen(true) }} />

      <TeacherDetailSheet teacher={selectedTeacher} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
