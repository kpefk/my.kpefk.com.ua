'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileUp, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AcademicPlansFilters } from '@/features/academic-plans/components/academic-plans-filters'
import { AcademicPlansTable } from '@/features/academic-plans/components/academic-plans-table'
import { CreateCurriculumDialog } from '@/features/academic-plans/components/create-curriculum-dialog'
import { useCurricula } from '@/features/academic-plans/api'
import { DEFAULT_CURRICULUM_FILTERS, type CurriculumFilters } from '@/features/academic-plans/types'
import { useUser } from '@/store/auth.store'

const MANAGER_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']
const IMPORT_ROLES = ['DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

export function AcademicPlansClient() {
  const user = useUser()
  const canManage = !!user && MANAGER_ROLES.includes(user.role)
  const canImport = !!user && IMPORT_ROLES.includes(user.role)

  const [filters, setFilters] = useState<CurriculumFilters>(DEFAULT_CURRICULUM_FILTERS)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: curricula = [], isLoading } = useCurricula(filters)
  const totalVisible = curricula.length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Навчальні плани</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? 'Завантаження...' : `${totalVisible} ${totalVisible === 1 ? 'план' : 'плани / планів'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canImport && (
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/academic-plans/import">
                <FileUp size={15} />
                Імпорт з Excel
              </Link>
            </Button>
          )}
          {canManage && (
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus size={15} />
              Новий план
            </Button>
          )}
        </div>
      </div>

      <AcademicPlansFilters filters={filters} onChange={setFilters} />
      <AcademicPlansTable curricula={curricula} isLoading={isLoading} filters={filters} />

      {canManage && (
        <CreateCurriculumDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  )
}
