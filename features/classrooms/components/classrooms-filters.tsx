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

import { DEFAULT_CLASSROOM_FILTERS, type ClassroomFilters } from '../types'

interface ClassroomsFiltersProps {
  filters: ClassroomFilters
  onChange: (f: ClassroomFilters) => void
}

function isDefault(f: ClassroomFilters, search: string) {
  return search === '' && f.hasTeacher === null && f.hasPhotos === null
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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Пошук за номером, назвою або завідувачем..."
          className="pl-9 bg-background"
        />
      </div>

      <Select
        value={filters.hasTeacher === null ? 'all' : filters.hasTeacher ? 'yes' : 'no'}
        onValueChange={(v) =>
          onChange({ ...filters, hasTeacher: v === 'all' ? null : v === 'yes' })
        }
      >
        <SelectTrigger className="w-[190px] bg-background">
          <SelectValue placeholder="Завідувач" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі кабінети</SelectItem>
          <SelectItem value="yes">З завідувачем</SelectItem>
          <SelectItem value="no">Без завідувача</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.hasPhotos === null ? 'all' : filters.hasPhotos ? 'yes' : 'no'}
        onValueChange={(v) =>
          onChange({ ...filters, hasPhotos: v === 'all' ? null : v === 'yes' })
        }
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Фото" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі фото</SelectItem>
          <SelectItem value="yes">З фото</SelectItem>
          <SelectItem value="no">Без фото</SelectItem>
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
