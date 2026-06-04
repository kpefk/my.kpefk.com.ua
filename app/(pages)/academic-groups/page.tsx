'use client'

import { useMemo, useState } from 'react'

import { useTeachers } from '@/features/teachers/api'
import { DEFAULT_FILTERS as DEFAULT_TEACHER_FILTERS, getFullName } from '@/features/teachers/types'

import { useGroups } from '@/features/groups/api'
import { AssignCuratorDialog } from '@/features/groups/components/assign-curator-dialog'
import { GroupDetailSheet } from '@/features/groups/components/group-detail-sheet'
import { GroupsFilters } from '@/features/groups/components/groups-filters'
import { GroupsTable } from '@/features/groups/components/groups-table'
import { GroupSyncButton } from '@/features/groups/components/sync-button'
import {
  DEFAULT_GROUP_FILTERS,
  type CuratorOption,
  type GroupDto,
  type GroupFilters,
} from '@/features/groups/types'

export default function AcademicGroupsPage() {
  const [filters, setFilters] = useState<GroupFilters>(DEFAULT_GROUP_FILTERS)
  const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogGroup, setDialogGroup] = useState<GroupDto | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleOpenAssignDialog = (group: GroupDto) => {
    setDialogGroup(group)
    setDialogOpen(true)
  }

  const { data: groups = [], isLoading } = useGroups(filters)

  // Reuse teachers query to populate curator selector
  const { data: teachers = [] } = useTeachers(DEFAULT_TEACHER_FILTERS)

  const curatorOptions = useMemo<CuratorOption[]>(
    () =>
      teachers.map((t) => ({
        id: t.id,
        fullName: getFullName(t),
        positionName: t.positionName,
      })),
    [teachers]
  )

  // Derived filter options from data
  const uniqueFaculties = useMemo(
    () =>
      [...new Set(groups.map((g) => g.facultyName).filter((f): f is string => f !== null))].sort(
        (a, b) => a.localeCompare(b, 'uk')
      ),
    [groups]
  )

  const uniqueEducationForms = useMemo(
    () =>
      [
        ...new Set(
          groups.map((g) => g.educationFormName).filter((f): f is string => f !== null)
        ),
      ].sort((a, b) => a.localeCompare(b, 'uk')),
    [groups]
  )

  // Client-side filtering
  const filtered = useMemo(() => {
    const searchLower = filters.search.toLowerCase()
    return groups.filter((g) => {
      const matchesSearch =
        !filters.search ||
        g.name.toLowerCase().includes(searchLower) ||
        (g.fullSpecialityName?.toLowerCase().includes(searchLower) ?? false)

      const matchesCourse = filters.course === null || g.course === filters.course

      const matchesFaculty =
        filters.facultyName === null || g.facultyName === filters.facultyName

      const matchesForm =
        filters.educationFormName === null ||
        g.educationFormName === filters.educationFormName

      const matchesCurator =
        filters.hasCurator === null ||
        (filters.hasCurator ? g.curator !== null : g.curator === null)

      return matchesSearch && matchesCourse && matchesFaculty && matchesForm && matchesCurator
    })
  }, [groups, filters])

  const handleRowClick = (group: GroupDto) => {
    setSelectedGroup(group)
    setSheetOpen(true)
  }

  // Відкриває діалог призначення куратора — викликається з detail sheet
  const handleAssignFromSheet = () => {
    if (selectedGroup) {
      setDialogGroup(selectedGroup)
      setDialogOpen(true)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Академічні групи</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading
              ? 'Завантаження...'
              : `${filtered.length} з ${groups.length} груп`}
          </p>
        </div>
        <GroupSyncButton />
      </div>

      {/* Filters */}
      <GroupsFilters
        filters={filters}
        onChange={setFilters}
        faculties={uniqueFaculties}
        educationForms={uniqueEducationForms}
      />

      {/* Table */}
      <GroupsTable
        groups={filtered}
        isLoading={isLoading}
        totalCount={groups.length}
        onRowClick={handleRowClick}
      />

      {/* Detail sheet */}
      <GroupDetailSheet
        group={selectedGroup}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAssignCurator={handleAssignFromSheet}
      />

      {/* Assign curator dialog */}
      <AssignCuratorDialog
        group={dialogGroup}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        teachers={curatorOptions}
      />

    </div>
  )
}
