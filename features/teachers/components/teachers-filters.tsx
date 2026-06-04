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

import { DEFAULT_FILTERS, type TeacherFilters } from '../types'

export interface FacultyOption {
  id: number
  name: string
}

export interface ChairOption {
  id: number
  name: string
  facultyId: number
}

interface TeachersFiltersProps {
  filters: TeacherFilters
  onChange: (f: TeacherFilters) => void
  faculties: FacultyOption[]
  chairs: ChairOption[]
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Всі' },
  { value: 'active', label: 'Працює' },
  { value: 'inactive', label: 'Звільнений' },
] as const

function statusToFilter(value: string): boolean | null {
  if (value === 'active') return true
  if (value === 'inactive') return false
  return null
}

function filterToStatus(value: boolean | null): string {
  if (value === true) return 'active'
  if (value === false) return 'inactive'
  return 'all'
}

function isDefaultFilters(f: TeacherFilters): boolean {
  return (
    f.search === DEFAULT_FILTERS.search &&
    f.facultyId === DEFAULT_FILTERS.facultyId &&
    f.chairId === DEFAULT_FILTERS.chairId &&
    f.isActive === DEFAULT_FILTERS.isActive
  )
}

export function TeachersFilters({ filters, onChange, faculties, chairs }: TeachersFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input — 400ms
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

  const filteredChairs = filters.facultyId
    ? chairs.filter((c) => c.facultyId === filters.facultyId)
    : chairs

  const handleFacultyChange = (value: string) => {
    const facultyId = value === 'all' ? null : Number(value)
    onChange({ ...filters, facultyId, chairId: null })
  }

  const handleChairChange = (value: string) => {
    onChange({ ...filters, chairId: value === 'all' ? null : Number(value) })
  }

  const handleStatusChange = (value: string) => {
    onChange({ ...filters, isActive: statusToFilter(value) })
  }

  const handleReset = () => {
    setSearchValue('')
    onChange(DEFAULT_FILTERS)
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
          placeholder="Пошук за ім'ям, посадою, кафедрою..."
          className="pl-9 bg-background"
        />
      </div>

      {/* Faculty */}
      <Select
        value={filters.facultyId !== null ? String(filters.facultyId) : 'all'}
        onValueChange={handleFacultyChange}
      >
        <SelectTrigger className="w-[200px] bg-background">
          <SelectValue placeholder="Всі факультети" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі факультети</SelectItem>
          {faculties.map((f) => (
            <SelectItem key={f.id} value={String(f.id)}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Chair */}
      <Select
        value={filters.chairId !== null ? String(filters.chairId) : 'all'}
        onValueChange={handleChairChange}
        disabled={faculties.length === 0}
      >
        <SelectTrigger className="w-[200px] bg-background">
          <SelectValue placeholder="Всі кафедри" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі кафедри</SelectItem>
          {filteredChairs.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select value={filterToStatus(filters.isActive)} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Всі" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset — only when filters differ from default */}
      {!isDefaultFilters({ ...filters, search: searchValue }) && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
          <X size={14} />
          Скинути
        </Button>
      )}
    </div>
  )
}
