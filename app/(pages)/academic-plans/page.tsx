'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AcademicPlansFilters } from '@/features/academic-plans/components/academic-plans-filters'
import { AcademicPlansTable } from '@/features/academic-plans/components/academic-plans-table'
import { CreateCurriculumDialog } from '@/features/academic-plans/components/create-curriculum-dialog'
import { useCurricula } from '@/features/academic-plans/api'
import { DEFAULT_CURRICULUM_FILTERS, type CurriculumFilters } from '@/features/academic-plans/types'
import { useUser } from '@/store/auth.store'

const MANAGER_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

export default function AcademicPlansPage() {
  const user = useUser()
  const canManage = !!user && MANAGER_ROLES.includes(user.role)

  const [filters, setFilters] = useState<CurriculumFilters>(DEFAULT_CURRICULUM_FILTERS)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: curricula = [], isLoading } = useCurricula(filters)

  const totalVisible = curricula.length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Навчальні плани</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? 'Завантаження...' : `${totalVisible} ${totalVisible === 1 ? 'план' : 'плани / планів'}`}
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus size={15} />
            Новий план
          </Button>
        )}
      </div>

      {/* Filters */}
      <AcademicPlansFilters filters={filters} onChange={setFilters} />

      {/* Table */}
      <AcademicPlansTable curricula={curricula} isLoading={isLoading} filters={filters} />

      {/* Create dialog */}
      {canManage && (
        <CreateCurriculumDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  )
}
