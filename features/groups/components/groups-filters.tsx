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

import { DEFAULT_GROUP_FILTERS, type GroupFilters } from '../types'

const COURSE_OPTIONS = [1, 2, 3, 4, 5, 6]

const CURATOR_OPTIONS = [
  { value: 'all', label: 'Всі групи' },
  { value: 'with', label: 'З куратором' },
  { value: 'without', label: 'Без куратора' },
] as const

function curatorValueToFilter(value: string): boolean | null {
  if (value === 'with') return true
  if (value === 'without') return false
  return null
}

function filterToCuratorValue(value: boolean | null): string {
  if (value === true) return 'with'
  if (value === false) return 'without'
  return 'all'
}

function isDefault(f: GroupFilters, search: string): boolean {
  return (
    search === '' &&
    f.course === null &&
    f.facultyName === null &&
    f.educationFormName === null &&
    f.hasCurator === null
  )
}

interface GroupsFiltersProps {
  filters: GroupFilters
  onChange: (f: GroupFilters) => void
  faculties: string[]
  educationForms: string[]
}

export function GroupsFilters({ filters, onChange, faculties, educationForms }: GroupsFiltersProps) {
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

  const handleReset = () => {
    setSearchValue('')
    onChange(DEFAULT_GROUP_FILTERS)
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
          placeholder="Пошук за назвою групи або спеціальністю..."
          className="pl-9 bg-background"
        />
      </div>

      {/* Course */}
      <Select
        value={filters.course !== null ? String(filters.course) : 'all'}
        onValueChange={(v) => onChange({ ...filters, course: v === 'all' ? null : Number(v) })}
      >
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Всі курси" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі курси</SelectItem>
          {COURSE_OPTIONS.map((c) => (
            <SelectItem key={c} value={String(c)}>
              {c} курс
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Faculty */}
      {faculties.length > 0 && (
        <Select
          value={filters.facultyName ?? 'all'}
          onValueChange={(v) => onChange({ ...filters, facultyName: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="Всі відділення" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі відділення</SelectItem>
            {faculties.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Education form */}
      {educationForms.length > 0 && (
        <Select
          value={filters.educationFormName ?? 'all'}
          onValueChange={(v) =>
            onChange({ ...filters, educationFormName: v === 'all' ? null : v })
          }
        >
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="Всі форми" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі форми</SelectItem>
            {educationForms.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Curator */}
      <Select
        value={filterToCuratorValue(filters.hasCurator)}
        onValueChange={(v) => onChange({ ...filters, hasCurator: curatorValueToFilter(v) })}
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Всі групи" />
        </SelectTrigger>
        <SelectContent>
          {CURATOR_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
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
