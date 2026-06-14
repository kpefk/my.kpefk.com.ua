'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api, apiPost } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'

import type {
  ImportCommitPayload,
  ImportCommitResult,
  ParsedCurriculum,
} from '../types'

/** Крок 1: завантажує .xls і повертає розпарсену структуру (без запису в БД). */
export function usePreviewImport() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      // Content-Type: undefined — браузер сам додасть multipart boundary,
      // інакше дефолтний application/json з axios-інстансу ламає парсинг.
      return api
        .post<ParsedCurriculum>(ENDPOINTS.CURRICULUM.IMPORT_PREVIEW, formData, {
          headers: { 'Content-Type': undefined },
        })
        .then((r) => r.data)
    },
  })
}

/** Крок 2: фіксує розпарсений план у БД як нову чернеткову версію. */
export function useCommitImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ImportCommitPayload) =>
      apiPost<ImportCommitResult>(ENDPOINTS.CURRICULUM.IMPORT_COMMIT, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curricula'] })
      toast.success('Навчальний план імпортовано')
    },
  })
}
