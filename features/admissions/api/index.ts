'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  AdmissionApplicationRowDto,
  AdmissionByDayDto,
  AdmissionOfferRowDto,
  AdmissionOfferSettingRow,
  AdmissionOverviewDto,
  AdmissionSettings,
  AdmissionSpecialityRowDto,
  AdmissionSyncResult,
  AdmissionTrendPointDto,
  AdmissionYearDto,
  ApplicationFilters,
  AutoRegisterResult,
  KonkursDistributionDto,
  UpdateCampaignSettingsPayload,
  UpdateOfferSettingsPayload,
} from '../types'

export const admissionsKeys = {
  all: ['admissions'] as const,
  years: () => [...admissionsKeys.all, 'years'] as const,
  overview: (year: number) => [...admissionsKeys.all, 'overview', year] as const,
  offers: (year: number) => [...admissionsKeys.all, 'offers', year] as const,
  bySpeciality: (year: number) => [...admissionsKeys.all, 'by-speciality', year] as const,
  byDay: (year: number) => [...admissionsKeys.all, 'by-day', year] as const,
  konkurs: (year: number) => [...admissionsKeys.all, 'konkurs', year] as const,
  trends: () => [...admissionsKeys.all, 'trends'] as const,
  applications: (year: number) => [...admissionsKeys.all, 'applications', year] as const,
  settings: (year: number) => [...admissionsKeys.all, 'settings', year] as const,
}

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

function withYear(path: string, year: number): string {
  return `${path}?year=${year}`
}

export function useAdmissionYears() {
  return useQuery({
    queryKey: admissionsKeys.years(),
    queryFn: () => apiGet<AdmissionYearDto[]>(ENDPOINTS.ADMISSIONS.YEARS),
    staleTime: 30_000,
  })
}

export function useAdmissionOverview(year: number | null) {
  return useQuery({
    queryKey: admissionsKeys.overview(year ?? 0),
    queryFn: () => apiGet<AdmissionOverviewDto>(withYear(ENDPOINTS.ADMISSIONS.OVERVIEW, year!)),
    enabled: year !== null,
    staleTime: 30_000,
  })
}

export function useAdmissionOffers(year: number | null) {
  return useQuery({
    queryKey: admissionsKeys.offers(year ?? 0),
    queryFn: () => apiGet<AdmissionOfferRowDto[]>(withYear(ENDPOINTS.ADMISSIONS.OFFERS, year!)),
    enabled: year !== null,
    staleTime: 30_000,
  })
}

export function useAdmissionBySpeciality(year: number | null) {
  return useQuery({
    queryKey: admissionsKeys.bySpeciality(year ?? 0),
    queryFn: () =>
      apiGet<AdmissionSpecialityRowDto[]>(withYear(ENDPOINTS.ADMISSIONS.BY_SPECIALITY, year!)),
    enabled: year !== null,
    staleTime: 30_000,
  })
}

export function useAdmissionByDay(year: number | null) {
  return useQuery({
    queryKey: admissionsKeys.byDay(year ?? 0),
    queryFn: () => apiGet<AdmissionByDayDto>(withYear(ENDPOINTS.ADMISSIONS.BY_DAY, year!)),
    enabled: year !== null,
    staleTime: 30_000,
  })
}

export function useKonkursDistribution(year: number | null) {
  return useQuery({
    queryKey: admissionsKeys.konkurs(year ?? 0),
    queryFn: () =>
      apiGet<KonkursDistributionDto>(withYear(ENDPOINTS.ADMISSIONS.KONKURS_DISTRIBUTION, year!)),
    enabled: year !== null,
    staleTime: 30_000,
  })
}

/**
 * Операційний список заяв із ПД (ПІБ/контакти). Лише активна кампанія, лише адмін —
 * тягнеться на вимогу (`enabled`), бо містить ПД і може бути важким.
 */
export function useAdmissionApplications(year: number | null, enabled: boolean) {
  return useQuery({
    queryKey: admissionsKeys.applications(year ?? 0),
    queryFn: () =>
      apiGet<AdmissionApplicationRowDto[]>(withYear(ENDPOINTS.ADMISSIONS.APPLICATIONS, year!)),
    enabled: enabled && year !== null,
    staleTime: 30_000,
  })
}

export function useAdmissionTrends() {
  return useQuery({
    queryKey: admissionsKeys.trends(),
    queryFn: () => apiGet<AdmissionTrendPointDto[]>(ENDPOINTS.ADMISSIONS.TRENDS),
    staleTime: 30_000,
  })
}

export function useSyncAdmissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (year: number) =>
      apiPost<AdmissionSyncResult>(ENDPOINTS.ADMISSIONS.SYNC, { year }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: admissionsKeys.all })
      toast.success(`Синхронізовано: ${res.offers} КП, ${res.applications} заяв`)
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося синхронізувати')),
  })
}

export function useArchiveAdmissionYear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (year: number) =>
      apiPost<{ purged: number }>(ENDPOINTS.ADMISSIONS.ARCHIVE(year)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: admissionsKeys.all })
      toast.success(`Рік архівовано; вичищено ПД у ${res.purged} заяв`)
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося архівувати')),
  })
}

// ─── Налаштування авто-реєстрації (лише ADMINISTRATOR) ───────────────────────

export function useAdmissionSettings(year: number | null) {
  return useQuery({
    queryKey: admissionsKeys.settings(year ?? 0),
    queryFn: () => apiGet<AdmissionSettings>(withYear(ENDPOINTS.ADMISSIONS.SETTINGS, year!)),
    enabled: year !== null,
    staleTime: 30_000,
  })
}

export function useUpdateCampaignSettings(year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCampaignSettingsPayload) =>
      apiPatch<AdmissionSettings>(withYear(ENDPOINTS.ADMISSIONS.SETTINGS, year), payload),
    onSuccess: (data) => {
      queryClient.setQueryData(admissionsKeys.settings(year), data)
      toast.success('Налаштування збережено')
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося зберегти налаштування')),
  })
}

export function useUpdateOfferSettings(year: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      universitySpecialitiesId,
      ...payload
    }: UpdateOfferSettingsPayload & { universitySpecialitiesId: number }) =>
      apiPatch<AdmissionOfferSettingRow>(
        withYear(ENDPOINTS.ADMISSIONS.OFFER_SETTINGS(universitySpecialitiesId), year),
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: admissionsKeys.settings(year) })
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося зберегти КП')),
  })
}

/**
 * Завантажує .xlsx зі списком заяв вступників (лише активна кампанія, ADMINISTRATOR).
 * Передає активні фільтри списку, щоб експорт відповідав видимим рядкам.
 */
export async function downloadApplicationsXlsx(
  year: number,
  filters?: ApplicationFilters,
): Promise<void> {
  const params = new URLSearchParams({ year: String(year) })
  if (filters) {
    const search = filters.search.trim()
    if (search) params.set('search', search)
    if (filters.status) params.set('status', filters.status)
    if (filters.speciality) params.set('speciality', filters.speciality)
    if (filters.claim !== 'all') params.set('claim', filters.claim)
    if (filters.enrolled !== 'all') params.set('enrolled', filters.enrolled)
    if (filters.requirements !== 'all') params.set('requirements', filters.requirements)
  }
  const blob = await apiGet<Blob>(
    `${ENDPOINTS.ADMISSIONS.APPLICATIONS_EXPORT}?${params.toString()}`,
    { responseType: 'blob' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Вступники_${year}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export function useAutoRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (year: number) =>
      apiPost<AutoRegisterResult>(ENDPOINTS.ADMISSIONS.AUTO_REGISTER, { year }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: admissionsKeys.all })
      const mode = res.dryRun ? ' (dev dry-run)' : ''
      toast.success(
        `Авто-реєстрація${mode}: зареєстровано ${res.registered}, пропущено ${res.skipped}, помилок ${res.failed}`,
      )
    },
    onError: (err: unknown) => toast.error(errMsg(err, 'Не вдалося виконати авто-реєстрацію')),
  })
}
