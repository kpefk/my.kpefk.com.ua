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

// ─── Filters type ─────────────────────────────────────────────────────────────

export interface EducationalProgramFilters {
  search: string
  isActive: boolean | null
}

export const DEFAULT_EP_FILTERS: EducationalProgramFilters = {
  search: '',
  isActive: null,
}

function activeCount(f: EducationalProgramFilters, search: string): number {
  let n = 0
  if (search.trim() !== '') n++
  if (f.isActive !== null) n++
  return n
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EducationalProgramsFiltersProps {
  filters: EducationalProgramFilters
  onChange: (f: EducationalProgramFilters) => void
}

export function EducationalProgramsFilters({
  filters,
  onChange,
}: EducationalProgramsFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, search: searchValue })
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const statusValue =
    filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'blocked'

  const handleStatusChange = (value: string) => {
    onChange({
      ...filters,
      isActive: value === 'all' ? null : value === 'active' ? true : false,
    })
  }

  const handleReset = () => {
    setSearchValue('')
    onChange(DEFAULT_EP_FILTERS)
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
            placeholder="Назва або спеціальність…"
            className="pl-9"
          />
        </div>
      </FilterField>

      <FilterField label="Статус">
        <Select value={statusValue} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Всі статуси" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі статуси</SelectItem>
            <SelectItem value="active">Активні</SelectItem>
            <SelectItem value="blocked">Заблоковані</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>
    </FiltersDrawer>
  )
}
