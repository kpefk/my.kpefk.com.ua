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

// ─── Filters type ─────────────────────────────────────────────────────────────

export interface EducationalProgramFilters {
  search: string
  isActive: boolean | null
}

export const DEFAULT_EP_FILTERS: EducationalProgramFilters = {
  search: '',
  isActive: null,
}

function isDefault(f: EducationalProgramFilters, searchValue: string): boolean {
  return searchValue === '' && f.isActive === null
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
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Пошук за назвою, спеціальністю…"
          className="pl-9 bg-background"
        />
      </div>

      {/* Status */}
      <Select value={statusValue} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="Всі статуси" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі статуси</SelectItem>
          <SelectItem value="active">Активні</SelectItem>
          <SelectItem value="blocked">Заблоковані</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}
      {!isDefault(filters, searchValue) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-muted-foreground"
        >
          <X size={14} />
          Скинути
        </Button>
      )}
    </div>
  )
}
