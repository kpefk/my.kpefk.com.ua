'use client'

import { useMemo, useState } from 'react'
import { Download, Eye, EyeOff, ListChecks, Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { downloadApplicationsXlsx, useAdmissionApplications } from '../api'
import {
  activeApplicationFilterCount,
  type ApplicationFilters,
  DEFAULT_APPLICATION_FILTERS,
  filterApplications,
} from '../types'
import type { AdmissionApplicationRowDto } from '../types'
import { AdmissionsGuard } from './admissions-guard'
import { ApplicationDetailSheet } from './application-detail-sheet'
import { ApplicationsFiltersDrawer } from './applications-filters-drawer'
import { ApplicationsTable } from './applications-table'
import { useAdmissionYear } from './use-admission-year'
import { YearSelector } from './year-selector'

export function AdmissionsApplicationsClient() {
  return (
    <AdmissionsGuard adminOnly>
      {() => <ApplicationsView />}
    </AdmissionsGuard>
  )
}

function ApplicationsView() {
  const { years, year, setYear, selectedCampaign } = useAdmissionYear()
  const isActive = selectedCampaign?.status === 'ACTIVE'
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_APPLICATION_FILTERS)

  const handleExport = async () => {
    if (year === null) return
    setExporting(true)
    try {
      // Експортуємо з урахуванням активних фільтрів списку.
      await downloadApplicationsXlsx(year, filters)
    } catch {
      toast.error('Не вдалося експортувати заяви')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-primary" />
            Список заяв
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Операційний перелік заяв вступників із ПД (лише активна кампанія)
          </p>
        </div>

        {isActive && (
          <Button variant="outline" onClick={handleExport} disabled={exporting || year === null}>
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Експорт .xlsx
          </Button>
        )}
      </div>

      <YearSelector
        years={years}
        year={year}
        onChange={setYear}
        selectedCampaign={selectedCampaign}
      />

      {!isActive ? (
        <p className="text-sm text-muted-foreground rounded-xl border p-4">
          Список заяв із персональними даними доступний лише для активної кампанії. Оберіть активний
          рік.
        </p>
      ) : (
        <ApplicationsSection year={year} filters={filters} onFiltersChange={setFilters} />
      )}
    </div>
  )
}

function ApplicationsSection({
  year,
  filters,
  onFiltersChange,
}: {
  year: number | null
  filters: ApplicationFilters
  onFiltersChange: (f: ApplicationFilters) => void
}) {
  const [shown, setShown] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<AdmissionApplicationRowDto | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const { data: apps = [], isLoading } = useAdmissionApplications(year, shown)

  const filtered = useMemo(() => filterApplications(apps, filters), [apps, filters])
  const activeCount = activeApplicationFilterCount(filters)

  const statuses = useMemo(
    () => [...new Set(apps.map((a) => a.statusTypeName).filter((s): s is string => !!s))].sort(),
    [apps],
  )
  const specialities = useMemo(
    () => [...new Set(apps.map((a) => a.specialityName).filter((s): s is string => !!s))].sort(),
    [apps],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Список заяв</span>
          {shown && (
            <span className="text-xs text-muted-foreground">
              {filtered.length}
              {filtered.length !== apps.length ? ` з ${apps.length}` : ''} заяв
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {shown && (
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Фільтри
              {activeCount > 0 && (
                <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">{activeCount}</Badge>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShown((s) => !s)}>
            {shown ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                Приховати
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Показати заяви
              </>
            )}
          </Button>
        </div>
      </div>

      {!shown ? (
        <p className="text-xs text-muted-foreground rounded-xl border p-3">
          Містить персональні дані (ПІБ, контакти). Доступ фіксується в журналі аудиту.
        </p>
      ) : (
        <>
          <ApplicationsTable
            applications={filtered}
            isLoading={isLoading}
            onRowClick={(a) => {
              setSelected(a)
              setDetailOpen(true)
            }}
          />
          <ApplicationsFiltersDrawer
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            filters={filters}
            onChange={onFiltersChange}
            statuses={statuses}
            specialities={specialities}
          />
          <ApplicationDetailSheet
            application={selected}
            open={detailOpen}
            onOpenChange={setDetailOpen}
          />
        </>
      )}
    </div>
  )
}
