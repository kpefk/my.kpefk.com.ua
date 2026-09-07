'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

import { FilterField, FiltersDrawer } from '@/components/common/filters-drawer'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USER_ROLE_LABELS, type UserRole } from '@/lib/types/user-role.types'

import { DEFAULT_USER_FILTERS, type UserFilters } from '../types'

interface UsersFiltersProps {
  filters: UserFilters
  onChange: (f: UserFilters) => void
}

const ALL_ROLES = Object.entries(USER_ROLE_LABELS) as [UserRole, string][]

function activeCount(f: UserFilters, search: string): number {
  let n = 0
  if (search.trim() !== '') n++
  if (f.role !== null) n++
  if (f.isActive !== null) n++
  return n
}

export function UsersFilters({ filters, onChange }: UsersFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, search: searchValue })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const handleReset = () => {
    setSearchValue('')
    onChange(DEFAULT_USER_FILTERS)
  }

  return (
    <FiltersDrawer activeCount={activeCount(filters, searchValue)} onReset={handleReset}>
      <FilterField label="Пошук">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Email або ПІБ…"
            className="pl-9"
          />
        </div>
      </FilterField>

      <FilterField label="Роль">
        <Select
          value={filters.role ?? 'all'}
          onValueChange={(v) => onChange({ ...filters, role: v === 'all' ? null : (v as UserRole) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Всі ролі" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі ролі</SelectItem>
            {ALL_ROLES.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Статус акаунту">
        <Select
          value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'}
          onValueChange={(v) =>
            onChange({ ...filters, isActive: v === 'all' ? null : v === 'active' })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Всі" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі</SelectItem>
            <SelectItem value="active">Активні</SelectItem>
            <SelectItem value="inactive">Деактивовані</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>
    </FiltersDrawer>
  )
}
