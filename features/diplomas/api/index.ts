'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api/client'
import { ApiError } from '@/types/api'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  CreateTemplatePayload,
  DiplomaBatch,
  DiplomaDetail,
  DiplomaSummary,
  EdboAccreditationRecord,
  GradeSheetData,
  ImportPreview,
  SetGradesPayload,
  TemplateComponent,
  TemplateDetail,
  TemplateSummary,
  UpdateDiplomaPayload,
  UpdateTemplatePayload,
} from '../types'

// ─── Query keys ────────────────────────────────────────────────────────────────

export const diplomaKeys = {
  all: ['diplomas'] as const,
  batches: () => [...diplomaKeys.all, 'batches'] as const,
  list: (batchId?: string) => [...diplomaKeys.all, 'list', batchId ?? ''] as const,
  gradeSheet: (batchId?: string) => [...diplomaKeys.all, 'grade-sheet', batchId ?? ''] as const,
  detail: (id: string) => [...diplomaKeys.all, 'detail', id] as const,
  templates: () => ['diploma-templates'] as const,
  template: (id: string) => ['diploma-templates', id] as const,
}

function err(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback
}

// ─── Download helper ───────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Batches + import ────────────────────────────────────────────────────────────

export function useBatches() {
  return useQuery({
    queryKey: diplomaKeys.batches(),
    queryFn: () => apiGet<DiplomaBatch[]>(ENDPOINTS.DIPLOMAS.BATCHES),
    staleTime: 30_000,
  })
}

export function useGradeSheet(batchId: string | undefined) {
  return useQuery({
    queryKey: diplomaKeys.gradeSheet(batchId),
    queryFn: () =>
      apiGet<GradeSheetData>(
        `${ENDPOINTS.DIPLOMAS.GRADE_SHEET}?batchId=${encodeURIComponent(batchId!)}`,
      ),
    enabled: !!batchId,
    staleTime: 10_000,
  })
}

export function useBatchApplyTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      batchId,
      templateId,
      groupName,
    }: {
      batchId: string
      templateId: string | null
      groupName?: string
    }) =>
      apiPost<{ count: number }>(ENDPOINTS.DIPLOMAS.BATCH_TEMPLATE(batchId), {
        templateId,
        groupName,
      }),
    onSuccess: (r, vars) => {
      void qc.invalidateQueries({ queryKey: [...diplomaKeys.all, 'grade-sheet', vars.batchId] })
      void qc.invalidateQueries({ queryKey: diplomaKeys.list(vars.batchId) })
      toast.success(`Шаблон застосовано до ${r.count} дипломів`)
    },
    onError: (e) => toast.error(err(e, 'Помилка застосування шаблону')),
  })
}

export function useSyncEntryDocuments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (batchId: string) => {
      // Паралельно: документи вступу (§6.2.2) + акредитація шаблонів
      const [entryRes, accredRes] = await Promise.all([
        apiPost<{ updated: number; skipped: number }>(
          ENDPOINTS.DIPLOMAS.BATCH_SYNC_ENTRY_DOCS(batchId),
        ),
        apiPost<{ updated: number; skipped: number; notFound: number }>(
          ENDPOINTS.DIPLOMAS.EDBO_ACCREDITATION_SYNC,
        ),
      ])
      return { entry: entryRes, accreditation: accredRes }
    },
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: diplomaKeys.all })
      const parts = [`документи: ${r.entry.updated}`]
      if (r.entry.skipped > 0) parts.push(`пропущено: ${r.entry.skipped}`)
      parts.push(`акредитація: ${r.accreditation.updated}`)
      if (r.accreditation.notFound > 0) parts.push(`не знайдено: ${r.accreditation.notFound}`)
      toast.success(`ЄДЕБО синхронізовано — ${parts.join(', ')}`)
    },
    onError: (e) => toast.error(err(e, 'Помилка синхронізації з ЄДЕБО')),
  })
}

export function useDeleteBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => apiDelete(ENDPOINTS.DIPLOMAS.BATCH_DELETE(batchId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: diplomaKeys.batches() })
      void qc.invalidateQueries({ queryKey: diplomaKeys.all })
      toast.success('Партію видалено')
    },
    onError: (e) => toast.error(err(e, 'Помилка видалення партії')),
  })
}

export function useEdboAccreditation(search: string) {
  return useQuery({
    queryKey: ['edbo-accreditation', search],
    queryFn: () =>
      apiGet<EdboAccreditationRecord[]>(
        `${ENDPOINTS.DIPLOMAS.EDBO_ACCREDITATION}?search=${encodeURIComponent(search)}`,
      ),
    enabled: search.length >= 2,
    staleTime: 120_000,
  })
}

export function useImportPreview() {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return apiPost<ImportPreview>(ENDPOINTS.DIPLOMAS.IMPORT_PREVIEW, fd, {
        headers: { 'Content-Type': undefined },
      })
    },
    onError: (e) => toast.error(err(e, 'Помилка читання XML')),
  })
}

export function useImportCommit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, name, academicYear }: { file: File; name: string; academicYear?: string }) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', name)
      if (academicYear) fd.append('academicYear', academicYear)
      return apiPost<{ batchId: string; count: number }>(
        ENDPOINTS.DIPLOMAS.IMPORT_COMMIT,
        fd,
        { headers: { 'Content-Type': undefined } },
      )
    },
    onSuccess: (r) => {
      toast.success(`Імпортовано ${r.count} дипломів`)
      void qc.invalidateQueries({ queryKey: diplomaKeys.batches() })
      void qc.invalidateQueries({ queryKey: diplomaKeys.all })
    },
    onError: (e) => toast.error(err(e, 'Помилка імпорту')),
  })
}

// ─── Diplomas ────────────────────────────────────────────────────────────────

export function useDiplomas(batchId?: string) {
  return useQuery({
    queryKey: diplomaKeys.list(batchId),
    queryFn: () =>
      apiGet<DiplomaSummary[]>(
        ENDPOINTS.DIPLOMAS.LIST + (batchId ? `?batchId=${encodeURIComponent(batchId)}` : ''),
      ),
    staleTime: 15_000,
    enabled: batchId !== undefined,
  })
}

export function useDiploma(id: string | null) {
  return useQuery({
    queryKey: diplomaKeys.detail(id ?? ''),
    queryFn: () => apiGet<DiplomaDetail>(ENDPOINTS.DIPLOMAS.BY_ID(id!)),
    enabled: !!id,
  })
}

export function useUpdateDiploma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDiplomaPayload }) =>
      apiPatch<DiplomaDetail>(ENDPOINTS.DIPLOMAS.BY_ID(id), data),
    onSuccess: (d) => {
      qc.setQueryData(diplomaKeys.detail(d.id), d)
      void qc.invalidateQueries({ queryKey: [...diplomaKeys.all, 'list'] })
    },
    onError: (e) => toast.error(err(e, 'Помилка оновлення диплома')),
  })
}

export function useAssignTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      templateId,
      applyToGroup,
    }: {
      id: string
      templateId: string | null
      applyToGroup: boolean
    }) =>
      apiPost<{ count: number }>(ENDPOINTS.DIPLOMAS.ASSIGN_TEMPLATE(id), {
        templateId,
        applyToGroup,
      }),
    onSuccess: (r, vars) => {
      void qc.invalidateQueries({ queryKey: diplomaKeys.detail(vars.id) })
      void qc.invalidateQueries({ queryKey: [...diplomaKeys.all, 'list'] })
      toast.success(
        r.count > 1 ? `Шаблон застосовано до групи (${r.count})` : 'Шаблон призначено',
      )
    },
    onError: (e) => toast.error(err(e, 'Помилка призначення шаблону')),
  })
}

export function useSetGrades() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetGradesPayload }) =>
      apiPatch<DiplomaDetail>(ENDPOINTS.DIPLOMAS.GRADES(id), data),
    onSuccess: (d) => {
      qc.setQueryData(diplomaKeys.detail(d.id), d)
      void qc.invalidateQueries({ queryKey: [...diplomaKeys.all, 'list'] })
      toast.success('Оцінки збережено')
    },
    onError: (e) => toast.error(err(e, 'Помилка збереження оцінок')),
  })
}

export async function downloadDiplomaDoc(
  id: string,
  doc: 'diploma' | 'addendum',
  filename: string,
): Promise<void> {
  const blob = await apiGet<Blob>(
    `${ENDPOINTS.DIPLOMAS.GENERATE(id)}?doc=${doc}`,
    { responseType: 'blob' },
  )
  triggerDownload(blob, filename)
}

export async function downloadBulk(
  batchId: string,
  doc: 'diploma' | 'addendum',
): Promise<void> {
  const blob = await apiPost<Blob>(
    `${ENDPOINTS.DIPLOMAS.GENERATE_BULK}?batchId=${encodeURIComponent(batchId)}&doc=${doc}`,
    undefined,
    { responseType: 'blob' },
  )
  triggerDownload(blob, doc === 'diploma' ? 'Дипломи.zip' : 'Додатки.zip')
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function useTemplates() {
  return useQuery({
    queryKey: diplomaKeys.templates(),
    queryFn: () => apiGet<TemplateSummary[]>(ENDPOINTS.DIPLOMA_TEMPLATES.LIST),
    staleTime: 30_000,
  })
}

export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: diplomaKeys.template(id ?? ''),
    queryFn: () => apiGet<TemplateDetail>(ENDPOINTS.DIPLOMA_TEMPLATES.BY_ID(id!)),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTemplatePayload) =>
      apiPost<TemplateDetail>(ENDPOINTS.DIPLOMA_TEMPLATES.LIST, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: diplomaKeys.templates() })
      toast.success('Шаблон створено')
    },
    onError: (e) => toast.error(err(e, 'Помилка створення шаблону')),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplatePayload }) =>
      apiPatch<TemplateDetail>(ENDPOINTS.DIPLOMA_TEMPLATES.BY_ID(id), data),
    onSuccess: (t) => {
      qc.setQueryData(diplomaKeys.template(t.id), t)
      void qc.invalidateQueries({ queryKey: diplomaKeys.templates() })
    },
    onError: (e) => toast.error(err(e, 'Помилка оновлення шаблону')),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(ENDPOINTS.DIPLOMA_TEMPLATES.BY_ID(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: diplomaKeys.templates() })
      toast.success('Шаблон видалено')
    },
    onError: (e) => toast.error(err(e, 'Помилка видалення шаблону')),
  })
}

export function useSetTemplateComponents() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, components }: { id: string; components: TemplateComponent[] }) =>
      apiPut<TemplateDetail>(ENDPOINTS.DIPLOMA_TEMPLATES.COMPONENTS(id), { components }),
    onSuccess: (t) => {
      qc.setQueryData(diplomaKeys.template(t.id), t)
      void qc.invalidateQueries({ queryKey: diplomaKeys.templates() })
      toast.success('Структуру ОК збережено')
    },
    onError: (e) => toast.error(err(e, 'Помилка збереження структури')),
  })
}

export function useUploadTemplateFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, kind, file }: { id: string; kind: 'diploma' | 'addendum'; file: File }) => {
      const fd = new FormData()
      fd.append('file', file)
      return apiPost<TemplateDetail>(ENDPOINTS.DIPLOMA_TEMPLATES.FILE(id, kind), fd, {
        headers: { 'Content-Type': undefined },
      })
    },
    onSuccess: (t) => {
      qc.setQueryData(diplomaKeys.template(t.id), t)
      void qc.invalidateQueries({ queryKey: diplomaKeys.templates() })
      toast.success('Файл шаблону завантажено')
    },
    onError: (e) => toast.error(err(e, 'Помилка завантаження файлу')),
  })
}
