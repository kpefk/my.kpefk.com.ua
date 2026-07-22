'use client'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { CAMPAIGN_STATUS_LABELS, type AdmissionYearDto } from '../types'

interface YearSelectorProps {
  years: AdmissionYearDto[]
  year: number | null
  onChange: (year: number) => void
  selectedCampaign: AdmissionYearDto | undefined
}

/** Селектор року кампанії + бейдж статусу + мітка останньої синхронізації. */
export function YearSelector({ years, year, onChange, selectedCampaign }: YearSelectorProps) {
  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Рік</label>
        <Select value={year !== null ? String(year) : ''} onValueChange={(v) => onChange(Number(v))}>
          <SelectTrigger className="h-9 min-w-[120px]">
            <SelectValue placeholder="— Рік —" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.admissionYear} value={String(y.admissionYear)}>
                {y.admissionYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedCampaign && (
        <Badge variant={selectedCampaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {CAMPAIGN_STATUS_LABELS[selectedCampaign.status]}
        </Badge>
      )}
      {selectedCampaign?.lastSyncedAt && (
        <span className="text-xs text-muted-foreground">
          Синхр.: {new Date(selectedCampaign.lastSyncedAt).toLocaleString('uk-UA')}
        </span>
      )}
    </div>
  )
}
