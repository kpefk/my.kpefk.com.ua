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

import { DEFAULT_CLASSROOM_FILTERS, type ClassroomFilters } from '../types'

interface ClassroomsFiltersProps {
  filters: ClassroomFilters
  onChange: (f: ClassroomFilters) => void
}

function activeCount(f: ClassroomFilters, search: string): number {
  let n = 0
  if (search.trim() !== '') n++
  if (f.hasTeacher !== null) n++
  if (f.hasPhotos !== null) n++
  return n
}

export function ClassroomsFilters({ filters, onChange }: ClassroomsFiltersProps) {
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
    onChange(DEFAULT_CLASSROOM_FILTERS)
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
            placeholder="Номер, назва або завідувач…"
            className="pl-9"
          />
        </div>
      </FilterField>

      <FilterField label="Завідувач">
        <Select
          value={filters.hasTeacher === null ? 'all' : filters.hasTeacher ? 'yes' : 'no'}
          onValueChange={(v) =>
            onChange({ ...filters, hasTeacher: v === 'all' ? null : v === 'yes' })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Завідувач" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі кабінети</SelectItem>
            <SelectItem value="yes">З завідувачем</SelectItem>
            <SelectItem value="no">Без завідувача</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Фото">
        <Select
          value={filters.hasPhotos === null ? 'all' : filters.hasPhotos ? 'yes' : 'no'}
          onValueChange={(v) =>
            onChange({ ...filters, hasPhotos: v === 'all' ? null : v === 'yes' })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Фото" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі фото</SelectItem>
            <SelectItem value="yes">З фото</SelectItem>
            <SelectItem value="no">Без фото</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>
    </FiltersDrawer>
  )
}
