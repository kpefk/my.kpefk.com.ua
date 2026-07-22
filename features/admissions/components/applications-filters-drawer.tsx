'use client'

import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  activeApplicationFilterCount,
  type ApplicationFilters,
  type ClaimFilter,
  DEFAULT_APPLICATION_FILTERS,
  type TriState,
} from '../types'

interface ApplicationsFiltersDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  filters: ApplicationFilters
  onChange: (f: ApplicationFilters) => void
  statuses: string[]
  specialities: string[]
}

const ALL = '__all__'

export function ApplicationsFiltersDrawer({
  open,
  onOpenChange,
  filters,
  onChange,
  statuses,
  specialities,
}: ApplicationsFiltersDrawerProps) {
  const activeCount = activeApplicationFilterCount(filters)

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>Фільтри заяв</DrawerTitle>
          <DrawerDescription>
            Уточніть перелік за пошуком, статусом, спеціальністю та іншими ознаками.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Пошук</Label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                value={filters.search}
                onChange={(e) => onChange({ ...filters, search: e.target.value })}
                placeholder="ПІБ, спеціальність, статус..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Статус заяви</Label>
            <Select
              value={filters.status ?? ALL}
              onValueChange={(v) => onChange({ ...filters, status: v === ALL ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Усі статуси" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Усі статуси</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Спеціальність</Label>
            <Select
              value={filters.speciality ?? ALL}
              onValueChange={(v) => onChange({ ...filters, speciality: v === ALL ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Усі спеціальності" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Усі спеціальності</SelectItem>
                {specialities.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Претендує на</Label>
            <Select
              value={filters.claim}
              onValueChange={(v) => onChange({ ...filters, claim: v as ClaimFilter })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Будь-що</SelectItem>
                <SelectItem value="budget">Лише бюджет</SelectItem>
                <SelectItem value="contract">Лише контракт</SelectItem>
                <SelectItem value="both">Бюджет і контракт</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Зарахування</Label>
            <Select
              value={filters.enrolled}
              onValueChange={(v) => onChange({ ...filters, enrolled: v as TriState })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі</SelectItem>
                <SelectItem value="yes">Зараховані</SelectItem>
                <SelectItem value="no">Не зараховані</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Виконання вимог до зарахування</Label>
            <Select
              value={filters.requirements}
              onValueChange={(v) => onChange({ ...filters, requirements: v as TriState })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі</SelectItem>
                <SelectItem value="yes">Виконали</SelectItem>
                <SelectItem value="no">Не виконали</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DrawerFooter className="border-t border-border flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onChange(DEFAULT_APPLICATION_FILTERS)}
            disabled={activeCount === 0}
          >
            <X className="w-4 h-4 mr-1.5" />
            Скинути
          </Button>
          <DrawerClose asChild>
            <Button className="flex-1">Готово</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
