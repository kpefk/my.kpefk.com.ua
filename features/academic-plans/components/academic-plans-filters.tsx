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

import {
  ADMISSION_BASIS_LABELS,
  EDUCATION_FORM_LABELS,
  type CurriculumFilters,
  DEFAULT_CURRICULUM_FILTERS,
} from '../types'

interface AcademicPlansFiltersProps {
  filters: CurriculumFilters
  onChange: (f: CurriculumFilters) => void
}

export function AcademicPlansFilters({ filters, onChange }: AcademicPlansFiltersProps) {
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
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const isDefault =
    searchValue === '' &&
    filters.educationForm === null &&
    filters.admissionBasis === null &&
    filters.isActive === null

  const handleReset = () => {
    setSearchValue('')
    onChange(DEFAULT_CURRICULUM_FILTERS)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px] max-w-[360px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Пошук за програмою або спеціальністю..."
          className="pl-9 bg-background"
        />
      </div>

      {/* Education form */}
      <Select
        value={filters.educationForm ?? 'all'}
        onValueChange={(v) =>
          onChange({ ...filters, educationForm: v === 'all' ? null : (v as CurriculumFilters['educationForm']) })
        }
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Форма навчання" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі форми</SelectItem>
          {(Object.keys(EDUCATION_FORM_LABELS) as Array<keyof typeof EDUCATION_FORM_LABELS>).map(
            (k) => (
              <SelectItem key={k} value={k}>
                {EDUCATION_FORM_LABELS[k]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      {/* Admission basis */}
      <Select
        value={filters.admissionBasis ?? 'all'}
        onValueChange={(v) =>
          onChange({
            ...filters,
            admissionBasis: v === 'all' ? null : (v as CurriculumFilters['admissionBasis']),
          })
        }
      >
        <SelectTrigger className="w-[200px] bg-background">
          <SelectValue placeholder="Підстава вступу" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі підстави</SelectItem>
          {(Object.keys(ADMISSION_BASIS_LABELS) as Array<keyof typeof ADMISSION_BASIS_LABELS>).map(
            (k) => (
              <SelectItem key={k} value={k}>
                {ADMISSION_BASIS_LABELS[k]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      {/* Active/inactive */}
      <Select
        value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'}
        onValueChange={(v) =>
          onChange({
            ...filters,
            isActive: v === 'all' ? null : v === 'active',
          })
        }
      >
        <SelectTrigger className="w-[130px] bg-background">
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі статуси</SelectItem>
          <SelectItem value="active">Активні</SelectItem>
          <SelectItem value="inactive">Архівні</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}
      {!isDefault && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
          <X size={14} />
          Скинути
        </Button>
      )}
    </div>
  )
}
