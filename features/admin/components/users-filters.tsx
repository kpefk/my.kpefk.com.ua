'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
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

function isDefault(f: UserFilters, search: string) {
  return search === '' && f.role === null && f.isActive === null
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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Пошук за email або ПІБ..."
          className="pl-9 bg-background"
        />
      </div>

      <Select
        value={filters.role ?? 'all'}
        onValueChange={(v) => onChange({ ...filters, role: v === 'all' ? null : v as UserRole })}
      >
        <SelectTrigger className="w-[200px] bg-background">
          <SelectValue placeholder="Всі ролі" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі ролі</SelectItem>
          {ALL_ROLES.map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'}
        onValueChange={(v) =>
          onChange({ ...filters, isActive: v === 'all' ? null : v === 'active' })
        }
      >
        <SelectTrigger className="w-[150px] bg-background">
          <SelectValue placeholder="Всі" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі</SelectItem>
          <SelectItem value="active">Активні</SelectItem>
          <SelectItem value="inactive">Деактивовані</SelectItem>
        </SelectContent>
      </Select>

      {!isDefault(filters, searchValue) && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
          <X size={14} />
          Скинути
        </Button>
      )}
    </div>
  )
}
