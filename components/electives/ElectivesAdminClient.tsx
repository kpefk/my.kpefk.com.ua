'use client'

import { getCurrentAcademicYear } from '@/lib/academic-year'
import { ElectiveAdminClient } from '@/features/electives/components/ElectiveAdminClient'

const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear()

export function ElectivesAdminClient() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <ElectiveAdminClient academicYear={CURRENT_ACADEMIC_YEAR} />
    </div>
  )
}
