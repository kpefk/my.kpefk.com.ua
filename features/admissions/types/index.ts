// ─── Admissions DTOs (mirror backend src/admissions/dto/*) ──────────────────────

export type AdmissionCampaignStatus = 'ACTIVE' | 'ARCHIVED'

export interface AdmissionFunnel {
  submitted: number
  recommendedBudget: number
  requirementsMet: number
  enrolled: number
}

export interface BudgetContractSplit {
  budget: number
  contract: number
  both: number
}

export interface KonkursBucket {
  from: number
  to: number
  count: number
}

export interface AdmissionYearDto {
  admissionYear: number
  status: AdmissionCampaignStatus
  lastSyncedAt: string | null
  offersCount: number
  applicationsCount: number
}

export interface AdmissionOverviewDto {
  admissionYear: number
  status: AdmissionCampaignStatus
  lastSyncedAt: string | null
  offersCount: number
  applicationsCount: number
  enrolledCount: number
  averageKonkurs: number | null
  funnel: AdmissionFunnel
  budgetContract: BudgetContractSplit
}

export interface AdmissionOfferRowDto {
  universitySpecialitiesId: number
  name: string | null
  specialityCode: string | null
  specialityName: string | null
  educationFormName: string | null
  educationBaseName: string | null
  offerTypeName: string | null
  budgetOrder: number | null
  maxOrder: number | null
  educationPrice: number | null
  applicationsCount: number
  enrolledCount: number
}

export interface AdmissionSpecialityRowDto {
  specialityCode: string | null
  specialityName: string
  programName: string | null
  applicationsCount: number
  enrolledCount: number
  cancelledCount: number
  budgetClaims: number
  contractClaims: number
  averageKonkurs: number | null
}

export interface KonkursDistributionDto {
  admissionYear: number
  buckets: KonkursBucket[]
}

export interface AdmissionTrendPointDto {
  admissionYear: number
  applicationsCount: number
  enrolledCount: number
}

export interface AdmissionDailyPointDto {
  date: string
  total: number
  counts: Record<string, number>
}

export interface AdmissionByDayDto {
  admissionYear: number
  programs: string[]
  points: AdmissionDailyPointDto[]
}

export interface AdmissionApplicationRowDto {
  personRequestId: string
  personalCode: string | null
  fio: string | null
  statusTypeName: string | null
  konkursValue: number | null
  requestPriority: number | null
  isClaimForBudget: boolean | null
  isClaimForContract: boolean | null
  isOriginalDocumentsAdded: boolean | null
  enrolled: boolean
  phone: string | null
  email: string | null
  specialityName: string | null
  educationFormName: string | null
  entryEduDocTypeName: string | null
  entryEduDocSeries: string | null
  entryEduDocNumber: string | null
  entryEduDocYearEnd: number | null
  entryEduDocDateGet: string | null
}

export interface AdmissionSyncResult {
  admissionYear: number
  offers: number
  applications: number
}

export interface AutoRegisterResult {
  admissionYear: number
  registered: number
  skipped: number
  failed: number
  dryRun: boolean
}

// ─── Налаштування авто-реєстрації (mirror backend settings DTOs) ─────────────

export interface AdmissionOfferSettingRow {
  universitySpecialitiesId: number
  name: string | null
  specialityCode: string | null
  caseSuffix: string | null
  registrationDescryption: string | null
  siteCount: number
}

export interface AdmissionSettings {
  admissionYear: number
  status: AdmissionCampaignStatus
  autoRegisterEnabled: boolean
  autoCaseNumberEnabled: boolean
  pollEnabled: boolean
  pollWindowStartHour: number
  pollWindowEndHour: number
  pollIntervalActiveSec: number
  pollIntervalOffHoursSec: number
  registrationDescryptionDefault: string | null
  lastAutoPollAt: string | null
  offers: AdmissionOfferSettingRow[]
}

export interface UpdateCampaignSettingsPayload {
  autoRegisterEnabled?: boolean
  autoCaseNumberEnabled?: boolean
  pollEnabled?: boolean
  pollWindowStartHour?: number
  pollWindowEndHour?: number
  pollIntervalActiveSec?: number
  pollIntervalOffHoursSec?: number
  registrationDescryptionDefault?: string
}

export interface UpdateOfferSettingsPayload {
  caseSuffix?: string
  registrationDescryption?: string
}

// ─── Applications list filters (client-side) ─────────────────────────────────

export type ClaimFilter = 'all' | 'budget' | 'contract' | 'both'
export type TriState = 'all' | 'yes' | 'no'

export interface ApplicationFilters {
  search: string
  status: string | null
  speciality: string | null
  claim: ClaimFilter
  enrolled: TriState
  requirements: TriState
}

export const DEFAULT_APPLICATION_FILTERS: ApplicationFilters = {
  search: '',
  status: null,
  speciality: null,
  claim: 'all',
  enrolled: 'all',
  requirements: 'all',
}

/** Кількість активних (не-дефолтних) фільтрів — для бейджа на кнопці «Фільтри». */
export function activeApplicationFilterCount(f: ApplicationFilters): number {
  let n = 0
  if (f.search.trim() !== '') n++
  if (f.status !== null) n++
  if (f.speciality !== null) n++
  if (f.claim !== 'all') n++
  if (f.enrolled !== 'all') n++
  if (f.requirements !== 'all') n++
  return n
}

/** Застосовує фільтри до списку заяв (клієнтська фільтрація, як у /teachers). */
export function filterApplications(
  apps: AdmissionApplicationRowDto[],
  f: ApplicationFilters,
): AdmissionApplicationRowDto[] {
  const q = f.search.trim().toLowerCase()
  return apps.filter((a) => {
    if (
      q !== '' &&
      !(a.fio ?? '').toLowerCase().includes(q) &&
      !(a.personalCode ?? '').toLowerCase().includes(q) &&
      !(a.specialityName ?? '').toLowerCase().includes(q) &&
      !(a.statusTypeName ?? '').toLowerCase().includes(q)
    ) {
      return false
    }
    if (f.status !== null && a.statusTypeName !== f.status) return false
    if (f.speciality !== null && a.specialityName !== f.speciality) return false
    if (f.claim === 'budget' && !(a.isClaimForBudget && !a.isClaimForContract)) return false
    if (f.claim === 'contract' && !(a.isClaimForContract && !a.isClaimForBudget)) return false
    if (f.claim === 'both' && !(a.isClaimForBudget && a.isClaimForContract)) return false
    if (f.enrolled === 'yes' && !a.enrolled) return false
    if (f.enrolled === 'no' && a.enrolled) return false
    if (f.requirements === 'yes' && !a.isOriginalDocumentsAdded) return false
    if (f.requirements === 'no' && a.isOriginalDocumentsAdded) return false
    return true
  })
}

// ─── Display constants ──────────────────────────────────────────────────────

export const CAMPAIGN_STATUS_LABELS: Record<AdmissionCampaignStatus, string> = {
  ACTIVE: 'Активна',
  ARCHIVED: 'Архів',
}
