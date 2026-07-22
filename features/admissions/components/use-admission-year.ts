'use client'

import { useEffect, useState } from 'react'

import { useAdmissionYears } from '../api'
import type { AdmissionYearDto } from '../types'

/** Спільний стан вибору року кампанії: список років + вибраний (типово — найновіший). */
export function useAdmissionYear(): {
  years: AdmissionYearDto[]
  yearsLoading: boolean
  year: number | null
  setYear: (y: number) => void
  selectedCampaign: AdmissionYearDto | undefined
} {
  const { data: years = [], isLoading: yearsLoading } = useAdmissionYears()
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    if (year === null && years.length > 0) setYear(years[0]!.admissionYear)
  }, [years, year])

  const selectedCampaign = years.find((y) => y.admissionYear === year)
  return { years, yearsLoading, year, setYear, selectedCampaign }
}
