'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useClassrooms } from '@/features/classrooms/api'
import { ClassroomDetailSheet } from '@/features/classrooms/components/classroom-detail-sheet'
import { ClassroomFormDialog } from '@/features/classrooms/components/classroom-form-dialog'
import { ClassroomsFilters } from '@/features/classrooms/components/classrooms-filters'
import { ClassroomsTable } from '@/features/classrooms/components/classrooms-table'
import {
  DEFAULT_CLASSROOM_FILTERS,
  getTeacherFullName,
  type ClassroomDto,
  type ClassroomFilters,
} from '@/features/classrooms/types'

export default function ClassroomsPage() {
  const [filters, setFilters] = useState<ClassroomFilters>(DEFAULT_CLASSROOM_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: classrooms = [], isLoading } = useClassrooms()

  // Завжди беремо актуальний об'єкт з кешу — після upload/delete фото sheet оновиться сам
  const selected = useMemo(
    () => (selectedId ? (classrooms.find((c) => c.id === selectedId) ?? null) : null),
    [classrooms, selectedId]
  )

  const filtered = useMemo(() => {
    const searchLower = filters.search.toLowerCase()
    return classrooms.filter((c) => {
      const teacherName = c.teacher ? getTeacherFullName(c.teacher).toLowerCase() : ''
      const matchesSearch =
        !filters.search ||
        c.number.toLowerCase().includes(searchLower) ||
        c.name.toLowerCase().includes(searchLower) ||
        teacherName.includes(searchLower)

      const matchesTeacher =
        filters.hasTeacher === null ||
        (filters.hasTeacher ? c.teacher !== null : c.teacher === null)

      const matchesPhotos =
        filters.hasPhotos === null ||
        (filters.hasPhotos ? c.photos.length > 0 : c.photos.length === 0)

      return matchesSearch && matchesTeacher && matchesPhotos
    })
  }, [classrooms, filters])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Навчальні кабінети</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading
              ? 'Завантаження...'
              : `${filtered.length} з ${classrooms.length} кабінетів`}
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Додати кабінет
        </Button>
      </div>

      <ClassroomsFilters filters={filters} onChange={setFilters} />

      <ClassroomsTable
        classrooms={filtered}
        isLoading={isLoading}
        onRowClick={(c) => { setSelectedId(c.id); setSheetOpen(true) }}
      />

      <ClassroomDetailSheet
        classroom={selected}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedId(null) }}
      />

      <ClassroomFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

    </div>
  )
}
