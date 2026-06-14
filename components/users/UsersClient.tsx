'use client'

import { useMemo, useState } from 'react'

import { useAdminUsers } from '@/features/admin/api'
import { CreateUserDialog } from '@/features/admin/components/create-user-dialog'
import { UserDetailSheet } from '@/features/admin/components/user-detail-sheet'
import { UsersFilters } from '@/features/admin/components/users-filters'
import { UsersTable } from '@/features/admin/components/users-table'
import {
  DEFAULT_USER_FILTERS,
  getUserDisplayName,
  type AdminUserDto,
  type UserFilters,
} from '@/features/admin/types'

export function UsersClient() {
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS)
  const [selected, setSelected] = useState<AdminUserDto | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: users = [], isLoading } = useAdminUsers()

  const filtered = useMemo(() => {
    const searchLower = filters.search.toLowerCase()
    return users.filter((u) => {
      const matchesSearch =
        !filters.search ||
        u.email.toLowerCase().includes(searchLower) ||
        getUserDisplayName(u).toLowerCase().includes(searchLower)
      const matchesRole = filters.role === null || u.role === filters.role
      const matchesStatus = filters.isActive === null || u.isActive === filters.isActive
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, filters])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Користувачі системи</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? 'Завантаження...' : `${filtered.length} з ${users.length} користувачів`}
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <UsersFilters filters={filters} onChange={setFilters} />

      <UsersTable
        users={filtered}
        isLoading={isLoading}
        onRowClick={(u) => { setSelected(u); setSheetOpen(true) }}
      />

      <UserDetailSheet user={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
