'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { getCurrentAcademicYear, getNextAcademicYear } from '@/lib/academic-year'
import { cn } from '@/lib/utils'
import { ElectiveCatalogClient } from '@/features/electives/components/ElectiveCatalogClient'

const CURRENT_YEAR = getCurrentAcademicYear()
// §1.9 / §3.2 Положення — вибір здійснюється на наступний навчальний рік
const NEXT_YEAR = getNextAcademicYear()

export function ElectivesClient() {
  const [academicYear, setAcademicYear] = useState(NEXT_YEAR)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Вибіркові дисципліни</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Вибір на {academicYear} навчальний рік
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {[NEXT_YEAR, CURRENT_YEAR].map(year => (
            <Button
              key={year}
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 text-xs',
                academicYear === year && 'bg-muted font-semibold',
              )}
              onClick={() => setAcademicYear(year)}
            >
              {year}
              {year === NEXT_YEAR && ' (вибір)'}
            </Button>
          ))}
        </div>
      </div>

      <ElectiveCatalogClient academicYear={academicYear} />
    </div>
  )
}
