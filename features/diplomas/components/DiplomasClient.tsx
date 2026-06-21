'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Award,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/store/auth.store'

import { downloadBulk, useBatches, useDeleteBatch, useDiplomas } from '../api'
import { VARIANT_LABELS } from '../types'
import { DiplomaImportDialog } from './DiplomaImportDialog'
import { DiplomaEditorSheet } from './DiplomaEditorSheet'

const MANAGE_ROLES = ['DIRECTOR', 'DEPUTY_DIRECTOR', 'ADMINISTRATOR']

export function DiplomasClient() {
  const user = useUser()
  const canManage = !!user && MANAGE_ROLES.includes(user.role)
  const canDelete = !!user && user.role === 'ADMINISTRATOR'

  const [batchId, setBatchId] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [editorId, setEditorId] = useState<string | null>(null)
  const [bulk, setBulk] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: batches = [], isLoading: batchesLoading } = useBatches()
  const { data: diplomas = [], isLoading: diplomasLoading } = useDiplomas(
    batchId || undefined,
  )
  const deleteBatchMut = useDeleteBatch()

  useEffect(() => {
    if (!batchId && batches.length > 0) setBatchId(batches[0]!.id)
  }, [batches, batchId])

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <p className="font-semibold">Доступ обмежено</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Формування дипломів доступне керівництву та адміністратору.
        </p>
      </div>
    )
  }

  async function handleDeleteBatch() {
    if (!batchId) return
    await deleteBatchMut.mutateAsync(batchId)
    setBatchId('')
    setConfirmDelete(false)
  }

  async function handleBulk(doc: 'diploma' | 'addendum') {
    if (!batchId) return
    setBulk(doc)
    try {
      await downloadBulk(batchId, doc)
    } finally {
      setBulk(null)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            Генерація дипломів
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Імпорт XML ЄДЕБО, призначення шаблонів, генерація документів
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/diplomas/templates">
              <Settings2 className="w-4 h-4 mr-1.5" /> Шаблони
            </Link>
          </Button>
          <Button size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1.5" /> Імпорт XML
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Партія</label>
          {batchesLoading ? (
            <Skeleton className="h-9 w-[260px]" />
          ) : batches.length === 0 ? (
            <span className="text-sm text-muted-foreground py-2">
              Немає партій — імпортуйте XML
            </span>
          ) : (
            <Select value={batchId || undefined} onValueChange={setBatchId}>
              <SelectTrigger className="h-9 min-w-[260px]">
                <SelectValue placeholder="— Оберіть партію —" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.count})
                    {b.academicYear ? ` • ${b.academicYear}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Delete batch — ADMINISTRATOR only */}
        {canDelete && batchId && (
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-destructive font-medium">
                  Видалити партію разом з усіма дипломами?
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDeleteBatch()}
                  disabled={deleteBatchMut.isPending}
                >
                  {deleteBatchMut.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1.5" />
                  )}
                  Так, видалити
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleteBatchMut.isPending}
                >
                  Скасувати
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Видалити партію
              </Button>
            )}
          </div>
        )}

        {batchId && diplomas.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk('diploma')}
              disabled={bulk !== null}
            >
              {bulk === 'diploma' ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-1.5" />
              )}
              Усі дипломи (zip)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk('addendum')}
              disabled={bulk !== null}
            >
              {bulk === 'addendum' ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              Усі додатки (zip)
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      {diplomasLoading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : diplomas.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <GraduationCap className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            {batchId ? 'У партії немає дипломів' : 'Оберіть або імпортуйте партію'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Студент</th>
                <th className="text-left px-3 py-2">№ диплома</th>
                <th className="text-left px-3 py-2">Спеціальність</th>
                <th className="text-left px-3 py-2">Група</th>
                <th className="text-left px-3 py-2">Шаблон</th>
                <th className="text-center px-3 py-2">ОК</th>
                <th className="text-left px-3 py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {diplomas.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setEditorId(d.id)}
                  className="border-t border-border/60 hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-3 py-2 font-medium">
                    {d.lastNameUk} {d.firstNameUk}
                    {d.isHonors && (
                      <Award className="inline w-3.5 h-3.5 ml-1.5 text-amber-500" />
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                    {d.documentSeries} № {d.documentNumber}
                  </td>
                  <td className="px-3 py-2">{d.specialityName ?? '—'}</td>
                  <td className="px-3 py-2">{d.studyGroupName ?? '—'}</td>
                  <td className="px-3 py-2">
                    {d.template ? (
                      <span className="text-xs">
                        {d.template.name}
                        <span className="text-muted-foreground">
                          {' '}· {VARIANT_LABELS[d.template.variant]}
                        </span>
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-400/50">
                        без шаблону
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                    {d.componentCount > 0 ? d.componentCount : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={d.status === 'READY' ? 'secondary' : 'outline'}>
                      {d.status === 'READY' ? 'Готовий' : 'Чернетка'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DiplomaImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={setBatchId}
      />
      <DiplomaEditorSheet
        diplomaId={editorId}
        onOpenChange={(o) => !o && setEditorId(null)}
      />
    </div>
  )
}
