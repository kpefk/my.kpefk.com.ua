'use client'

import { useMemo, useState } from 'react'

import { useEducationalPrograms } from '@/features/academic-plans/api'
import {
  DEFAULT_EP_FILTERS,
  EducationalProgramsFilters,
  type EducationalProgramFilters,
} from '@/features/academic-plans/components/educational-programs-filters'
import { EducationalProgramsSyncButton } from '@/features/academic-plans/components/educational-programs-sync-button'
import { EducationalProgramsTable } from '@/features/academic-plans/components/educational-programs-table'

export function EducationalProgramsClient() {
  const [filters, setFilters] = useState<EducationalProgramFilters>(DEFAULT_EP_FILTERS)

  const { data: programs = [], isLoading } = useEducationalPrograms()

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim()
    return programs.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.specialty.name.toLowerCase().includes(q) ||
        p.specialty.code.toLowerCase().includes(q) ||
        (p.qualificationLevel ?? '').toLowerCase().includes(q) ||
        (p.specializationName ?? '').toLowerCase().includes(q)
      const matchStatus = filters.isActive === null || p.isActive === filters.isActive
      return matchSearch && matchStatus
    })
  }, [programs, filters])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Освітні програми (ОПП)</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? 'Завантаження...' : `${filtered.length} з ${programs.length} програм`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EducationalProgramsFilters filters={filters} onChange={setFilters} />
          <EducationalProgramsSyncButton />
        </div>
      </div>
      <EducationalProgramsTable programs={filtered} isLoading={isLoading} />
    </div>
  )
}
