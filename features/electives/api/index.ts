'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  AdminAssignV2Payload,
  CampaignProgressDto,
  ConfirmGroupSelectionPayload,
  ConfirmGroupSelectionResult,
  CreateCampaignPayload,
  ElectiveCampaignDetailDto,
  ElectiveCampaignDto,
  GenerateCampaignResult,
  UpdateCampaignPayload,
  CreateElectiveComponentPayload,
  CreateOfferingPayload,
  CurriculumComponentSummaryDto,
  CurriculumTermForLinkingDto,
  ElectiveBlockSeasonDto,
  ElectiveComponentDto,
  ElectiveOfferingDto,
  ElectiveRegistrationDto,
  EnrollmentRowDto,
  GroupSelectionStatDto,
  StudentElectiveSelectionDto,
  StudentSelectPayload,
  StudentWithoutSelectionDto,
  UpdateElectiveComponentPayload,
  UpdateOfferingPayload,
} from '../types'

export const electiveKeys = {
  all: ['electives'] as const,
  // Deprecated (ElectiveComponent/Registration)
  catalog: (oppCode: string, academicYear: string) =>
    [...electiveKeys.all, 'catalog', oppCode, academicYear] as const,
  adminCatalog: (academicYear?: string) =>
    [...electiveKeys.all, 'admin-catalog', academicYear] as const,
  curriculumTerms: (oppCode?: string) =>
    [...electiveKeys.all, 'curriculum-terms', oppCode] as const,
  my: (academicYear?: string) => [...electiveKeys.all, 'my', academicYear] as const,
  groupStats: (groupId: string, academicYear: string) =>
    [...electiveKeys.all, 'group-stats', groupId, academicYear] as const,
  enrollmentList: (groupId: string, electiveId: string, academicYear: string) =>
    [...electiveKeys.all, 'enrollment', groupId, electiveId, academicYear] as const,
  unselected: (groupId: string, semester: number, academicYear: string) =>
    [...electiveKeys.all, 'unselected', groupId, semester, academicYear] as const,
  // New architecture
  seasons: (academicYear?: string) => [...electiveKeys.all, 'seasons', academicYear] as const,
  offerings: (seasonId: string) => [...electiveKeys.all, 'offerings', seasonId] as const,
  blockComponents: (blockId: string) => [...electiveKeys.all, 'block-components', blockId] as const,
  blocks: (oppCode: string, academicYear: string) =>
    [...electiveKeys.all, 'blocks', oppCode, academicYear] as const,
  mySelections: (academicYear?: string) =>
    [...electiveKeys.all, 'my-selections', academicYear] as const,
  groupStatsV2: (groupId: string, academicYear: string) =>
    [...electiveKeys.all, 'group-stats-v2', groupId, academicYear] as const,
  // Campaigns
  myBlocks: (academicYear: string) => [...electiveKeys.all, 'my-blocks', academicYear] as const,
  campaigns: () => [...electiveKeys.all, 'campaigns'] as const,
  campaign: (id: string) => [...electiveKeys.all, 'campaign', id] as const,
  campaignProgress: (id: string) => [...electiveKeys.all, 'campaign-progress', id] as const,
}

export function useElectiveCatalog(oppCode: string, academicYear: string) {
  return useQuery({
    queryKey: electiveKeys.catalog(oppCode, academicYear),
    queryFn: () =>
      apiGet<ElectiveComponentDto[]>(ENDPOINTS.ELECTIVES.CATALOG, {
        params: { oppCode, academicYear },
      }),
    enabled: !!oppCode && !!academicYear,
    staleTime: 60_000,
  })
}

export function useAdminCatalog(academicYear?: string) {
  return useQuery({
    queryKey: electiveKeys.adminCatalog(academicYear),
    queryFn: () =>
      apiGet<ElectiveComponentDto[]>(ENDPOINTS.ELECTIVES.ADMIN_CATALOG, {
        params: academicYear ? { academicYear } : undefined,
      }),
    staleTime: 60_000,
  })
}

export function useCurriculumTermsForLinking(oppCode?: string) {
  return useQuery({
    queryKey: electiveKeys.curriculumTerms(oppCode),
    queryFn: () =>
      apiGet<CurriculumTermForLinkingDto[]>(ENDPOINTS.ELECTIVES.ADMIN_CURRICULUM_TERMS, {
        params: oppCode ? { oppCode } : undefined,
      }),
    staleTime: 5 * 60_000,
  })
}

export function useMySelections(academicYear?: string) {
  return useQuery({
    queryKey: electiveKeys.my(academicYear),
    queryFn: () =>
      apiGet<ElectiveRegistrationDto[]>(ENDPOINTS.ELECTIVES.MY, {
        params: academicYear ? { academicYear } : undefined,
      }),
    staleTime: 30_000,
  })
}

export function useGroupSelectionStats(groupId: string, academicYear: string) {
  return useQuery({
    queryKey: electiveKeys.groupStats(groupId, academicYear),
    queryFn: () =>
      apiGet<GroupSelectionStatDto[]>(ENDPOINTS.ELECTIVES.GROUP_STATS(groupId), {
        params: { academicYear },
      }),
    enabled: !!groupId && !!academicYear,
    refetchInterval: 30_000,
    staleTime: 0,
  })
}

export function useEnrollmentList(groupId: string, electiveId: string, academicYear: string) {
  return useQuery({
    queryKey: electiveKeys.enrollmentList(groupId, electiveId, academicYear),
    queryFn: () =>
      apiGet<EnrollmentRowDto[]>(ENDPOINTS.ELECTIVES.ADMIN_ENROLLMENT_LIST, {
        params: { groupId, electiveId, academicYear },
      }),
    enabled: !!groupId && !!electiveId && !!academicYear,
    staleTime: 30_000,
  })
}

export function useUnselectedStudents(groupId: string, semester: number, academicYear: string) {
  return useQuery({
    queryKey: electiveKeys.unselected(groupId, semester, academicYear),
    queryFn: () =>
      apiGet<StudentWithoutSelectionDto[]>(ENDPOINTS.ELECTIVES.ADMIN_UNSELECTED, {
        params: { groupId, semester, academicYear },
      }),
    enabled: !!groupId && !!academicYear,
    staleTime: 30_000,
  })
}

export function useSelectElective() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { electiveId: string; semester: number; academicYear: string }) =>
      apiPost<ElectiveRegistrationDto>(ENDPOINTS.ELECTIVES.SELECT, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useCancelSelection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (registrationId: string) =>
      apiDelete(ENDPOINTS.ELECTIVES.CANCEL_SELECT(registrationId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useCreateElective() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateElectiveComponentPayload) =>
      apiPost<ElectiveComponentDto>(ENDPOINTS.ELECTIVES.ADMIN_CATALOG, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useUpdateElective() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateElectiveComponentPayload }) =>
      apiPatch<ElectiveComponentDto>(ENDPOINTS.ELECTIVES.ADMIN_CATALOG_ITEM(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useDeleteElective() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete(ENDPOINTS.ELECTIVES.ADMIN_CATALOG_ITEM(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useCloneElectiveCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { sourceYear: string; targetYear: string }) =>
      apiPost<{ cloned: number; targetYear: string }>(
        ENDPOINTS.ELECTIVES.ADMIN_CATALOG_CLONE,
        data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useAdminAssign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      studentId: string
      electiveId: string
      semester: number
      academicYear: string
    }) => apiPost<ElectiveRegistrationDto>(ENDPOINTS.ELECTIVES.ADMIN_ASSIGN, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useUpdateCatalogStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, catalogStatus }: { id: string; catalogStatus: string }) =>
      apiPatch<ElectiveComponentDto>(ENDPOINTS.ELECTIVES.ADMIN_CATALOG_STATUS(id), {
        catalogStatus,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useConfirmAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (academicYear: string) =>
      apiPost<{ confirmed: number; autoAssigned: number }>(
        `${ENDPOINTS.ELECTIVES.ADMIN_CONFIRM_ALL}?academicYear=${encodeURIComponent(academicYear)}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

// ── New architecture hooks ────────────────────────────────────────────────────

export function useSeasons(academicYear?: string) {
  return useQuery({
    queryKey: electiveKeys.seasons(academicYear),
    queryFn: () =>
      apiGet<ElectiveBlockSeasonDto[]>(ENDPOINTS.ELECTIVES.ADMIN_SEASONS, {
        params: academicYear ? { academicYear } : undefined,
      }),
    staleTime: 60_000,
  })
}

export function useUpdateSeasonStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, catalogStatus }: { id: string; catalogStatus: string }) =>
      apiPatch<ElectiveBlockSeasonDto>(ENDPOINTS.ELECTIVES.ADMIN_SEASON_STATUS(id), {
        catalogStatus,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useDeleteSeason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(ENDPOINTS.ELECTIVES.ADMIN_SEASON(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useOfferings(seasonId: string) {
  return useQuery({
    queryKey: electiveKeys.offerings(seasonId),
    queryFn: () =>
      apiGet<ElectiveOfferingDto[]>(ENDPOINTS.ELECTIVES.ADMIN_SEASON_OFFERINGS(seasonId)),
    enabled: !!seasonId,
    staleTime: 60_000,
  })
}

export function useAddOffering(seasonId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOfferingPayload) =>
      apiPost<ElectiveOfferingDto>(ENDPOINTS.ELECTIVES.ADMIN_SEASON_OFFERINGS(seasonId), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.offerings(seasonId) })
    },
  })
}

export function useUpdateOffering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOfferingPayload }) =>
      apiPatch<ElectiveOfferingDto>(ENDPOINTS.ELECTIVES.ADMIN_OFFERING(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useRemoveOffering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(ENDPOINTS.ELECTIVES.ADMIN_OFFERING(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useBlockComponents(blockId: string) {
  return useQuery({
    queryKey: electiveKeys.blockComponents(blockId),
    queryFn: () =>
      apiGet<CurriculumComponentSummaryDto[]>(ENDPOINTS.ELECTIVES.ADMIN_BLOCK_COMPONENTS(blockId)),
    enabled: !!blockId,
    staleTime: 0,
  })
}

export function useElectiveBlocks(oppCode: string, academicYear: string) {
  return useQuery({
    queryKey: electiveKeys.blocks(oppCode, academicYear),
    queryFn: () =>
      apiGet<ElectiveBlockSeasonDto[]>(ENDPOINTS.ELECTIVES.BLOCKS, {
        params: { oppCode, academicYear },
      }),
    enabled: !!oppCode && !!academicYear,
    staleTime: 60_000,
  })
}

export function useMySelectionsV2(academicYear?: string) {
  return useQuery({
    queryKey: electiveKeys.mySelections(academicYear),
    queryFn: () =>
      apiGet<StudentElectiveSelectionDto[]>(ENDPOINTS.ELECTIVES.MY_SELECTIONS, {
        params: academicYear ? { academicYear } : undefined,
      }),
    staleTime: 30_000,
  })
}

export function useStudentSelectV2() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StudentSelectPayload) =>
      apiPost<StudentElectiveSelectionDto>(ENDPOINTS.ELECTIVES.SELECTIONS, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useStudentCancelSelectionV2() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(ENDPOINTS.ELECTIVES.SELECTION(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export interface GroupSelectionStatV2Dto {
  component: { id: string; name: string }
  semesterNumber: number
  count: number
  total: number
  percentage: number
  hasQuorum: boolean
}

export function useGroupSelectionStatsV2(groupId: string, academicYear: string) {
  return useQuery({
    queryKey: electiveKeys.groupStatsV2(groupId, academicYear),
    queryFn: () =>
      apiGet<GroupSelectionStatV2Dto[]>(ENDPOINTS.ELECTIVES.ADMIN_GROUP_STATS_V2(groupId), {
        params: { academicYear },
      }),
    enabled: !!groupId && groupId !== 'skip' && !!academicYear,
    staleTime: 30_000,
  })
}

export interface AutoAssignBulkPayload {
  groupId: string
  componentId?: string
  overrideReason?: string
}

export interface AutoAssignBulkResult {
  assigned: number
  componentId: string
  componentName: string
}

export function useAutoAssignBulk(seasonId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AutoAssignBulkPayload) =>
      apiPost<AutoAssignBulkResult>(ENDPOINTS.ELECTIVES.ADMIN_AUTO_ASSIGN_BULK(seasonId), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useAdminAssignV2() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminAssignV2Payload) =>
      apiPost<StudentElectiveSelectionDto>(ENDPOINTS.ELECTIVES.ADMIN_SELECTIONS_V2, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

// ── Campaign hooks (річна кампанія вибору ВК) ─────────────────────────────────

/** Каталог ВК студента, визначений через прив'язку його групи до навчального плану */
export function useMyBlocks(academicYear: string) {
  return useQuery({
    queryKey: electiveKeys.myBlocks(academicYear),
    queryFn: () =>
      apiGet<ElectiveBlockSeasonDto[]>(ENDPOINTS.ELECTIVES.MY_BLOCKS, {
        params: { academicYear },
      }),
    enabled: !!academicYear,
    staleTime: 60_000,
  })
}

export function useCampaigns() {
  return useQuery({
    queryKey: electiveKeys.campaigns(),
    queryFn: () => apiGet<ElectiveCampaignDto[]>(ENDPOINTS.ELECTIVES.ADMIN_CAMPAIGNS),
    staleTime: 60_000,
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: electiveKeys.campaign(id),
    queryFn: () => apiGet<ElectiveCampaignDetailDto>(ENDPOINTS.ELECTIVES.ADMIN_CAMPAIGN(id)),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCampaignProgress(id: string) {
  return useQuery({
    queryKey: electiveKeys.campaignProgress(id),
    queryFn: () => apiGet<CampaignProgressDto>(ENDPOINTS.ELECTIVES.ADMIN_CAMPAIGN_PROGRESS(id)),
    enabled: !!id,
    staleTime: 15_000,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCampaignPayload) =>
      apiPost<ElectiveCampaignDto>(ENDPOINTS.ELECTIVES.ADMIN_CAMPAIGNS, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignPayload }) =>
      apiPatch<ElectiveCampaignDto>(ENDPOINTS.ELECTIVES.ADMIN_CAMPAIGN(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPatch<ElectiveCampaignDto>(ENDPOINTS.ELECTIVES.ADMIN_CAMPAIGN_STATUS(id), { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useGenerateCampaignSeasons() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<GenerateCampaignResult>(ENDPOINTS.ELECTIVES.ADMIN_CAMPAIGN_GENERATE(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useConfirmGroupSelection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      seasonId,
      groupId,
      data,
    }: {
      seasonId: string
      groupId: string
      data: ConfirmGroupSelectionPayload
    }) =>
      apiPost<ConfirmGroupSelectionResult>(
        ENDPOINTS.ELECTIVES.ADMIN_GROUP_CONFIRM(seasonId, groupId),
        data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}

export function useConfirmSelectionsV2() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (academicYear: string) =>
      apiPost<{ confirmed: number }>(
        `${ENDPOINTS.ELECTIVES.ADMIN_CONFIRM_SELECTIONS}?academicYear=${encodeURIComponent(academicYear)}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: electiveKeys.all })
    },
  })
}
