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

import { DEFAULT_STUDENT_FILTERS, type StudentFilters } from '../types'

export interface CourseOption {
  id: number
  name: string
}

export interface GroupOption {
  name: string
  courseId: number | null
}

export interface FormOption {
  id: number
  name: string
}

interface StudentsFiltersProps {
  filters: StudentFilters
  onChange: (f: StudentFilters) => void
  courses: CourseOption[]
  groups: GroupOption[]
  forms: FormOption[]
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Всі' },
  { value: 'active', label: 'Навчається' },
  { value: 'inactive', label: 'Не навчається (завершили / відраховано / академ.)' },
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

function isDefault(f: StudentFilters, search: string): boolean {
  return (
    search === '' &&
    f.courseId === null &&
    f.groupName === null &&
    f.educationFormId === null &&
    f.isActive === null
  )
}

export function StudentsFilters({ filters, onChange, courses, groups, forms }: StudentsFiltersProps) {
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

  const filteredGroups = filters.courseId
    ? groups.filter((g) => g.courseId === filters.courseId)
    : groups

  const handleCourseChange = (value: string) => {
    onChange({ ...filters, courseId: value === 'all' ? null : Number(value), groupName: null })
  }

  const handleGroupChange = (value: string) => {
    onChange({ ...filters, groupName: value === 'all' ? null : value })
  }

  const handleFormChange = (value: string) => {
    onChange({ ...filters, educationFormId: value === 'all' ? null : Number(value) })
  }

  const handleReset = () => {
    setSearchValue('')
    onChange(DEFAULT_STUDENT_FILTERS)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Пошук за ПІБ або групою..."
          className="pl-9 bg-background"
        />
      </div>

      {/* Курс */}
      <Select
        value={filters.courseId !== null ? String(filters.courseId) : 'all'}
        onValueChange={handleCourseChange}
      >
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Всі курси" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі курси</SelectItem>
          {courses.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Група */}
      <Select
        value={filters.groupName ?? 'all'}
        onValueChange={handleGroupChange}
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Всі групи" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі групи</SelectItem>
          {filteredGroups.map((g) => (
            <SelectItem key={g.name} value={g.name}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Форма навчання */}
      <Select
        value={filters.educationFormId !== null ? String(filters.educationFormId) : 'all'}
        onValueChange={handleFormChange}
      >
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="Всі форми" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі форми</SelectItem>
          {forms.map((f) => (
            <SelectItem key={f.id} value={String(f.id)}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Статус */}
      <Select value={filterToStatus(filters.isActive)} onValueChange={(v) => onChange({ ...filters, isActive: statusToFilter(v) })}>
        <SelectTrigger className="w-[200px] bg-background">
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

      {!isDefault(filters, searchValue) && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
          <X size={14} />
          Скинути
        </Button>
      )}
    </div>
  )
}
