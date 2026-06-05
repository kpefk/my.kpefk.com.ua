'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  GitBranch,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateVersionDialog } from '@/features/academic-plans/components/create-version-dialog'
import { useDeleteCurriculum, useCurriculum, useCurriculumVersions } from '@/features/academic-plans/api'
import {
  ADMISSION_BASIS_LABELS,
  EDUCATION_FORM_LABELS,
  formatDate,
  formatDuration,
  getLatestActiveVersion,
  type CurriculumVersionSummaryDto,
} from '@/features/academic-plans/types'
import { useUser } from '@/store/auth.store'
import { cn } from '@/lib/utils'

const MANAGER_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

function VersionRow({
  version,
  curriculumId,
  isLatest,
}: {
  version: CurriculumVersionSummaryDto
  curriculumId: string
  isLatest: boolean
}) {
  const base = `/academic-plans/${curriculumId}/versions/${version.id}`
  const isDeprecated = version.isPublished && !!version.deprecatedAt
  const isDraft = !version.isPublished

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0',
        'hover:bg-muted/30 transition-colors',
      )}
    >
      {/* Version badge */}
      <div className="flex items-center gap-2 shrink-0 min-w-[80px]">
        <span className="font-mono font-semibold text-sm">v{version.versionNumber}</span>
        {isLatest && (
          <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Актуальна
          </Badge>
        )}
        {isDraft && (
          <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Чернетка
          </Badge>
        )}
        {isDeprecated && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Застаріла
          </Badge>
        )}
      </div>

      {/* Approval info */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground flex-1 min-w-0">
        <span className="truncate">{version.approvalOrderNumber || '—'}</span>
        <span>·</span>
        <span className="whitespace-nowrap">{formatDate(version.approvalDate)}</span>
        <span>·</span>
        <span className="truncate">{version.approvedBy}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-8 px-3" asChild>
          <Link href={`${base}/structure`}>
            <Layers size={13} />
            Структура
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-8 px-3" asChild>
          <Link href={`${base}/groups`}>
            <GitBranch size={13} />
            Групи
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-8 px-3" asChild>
          <Link href={`${base}/working`}>
            <CalendarDays size={13} />
            Робочий
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function CurriculumOverviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const user = useUser()
  const canManage = !!user && MANAGER_ROLES.includes(user.role)

  const [createVersionOpen, setCreateVersionOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: curriculum, isLoading } = useCurriculum(id)
  const { data: versions = [], isLoading: versionsLoading } = useCurriculumVersions(id)
  const deleteCurriculum = useDeleteCurriculum()

  const latestVersion = getLatestActiveVersion(versions)
  const publishedVersions = versions.filter((v) => v.isPublished && !v.deprecatedAt)
  const draftVersions = versions.filter((v) => !v.isPublished)
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)

  return (
    <div className="flex flex-col gap-0">
      {/* Back */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <Link
          href="/academic-plans"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          До навчальних планів
        </Link>
      </div>

      {/* Header */}
      <div className="px-4 sm:px-6 pb-4 border-b border-border">
        {isLoading ? (
          <div className="flex flex-col gap-3 pt-2">
            <Skeleton className="h-6 w-80" />
            <Skeleton className="h-4 w-60" />
            <div className="flex gap-2 mt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        ) : curriculum ? (
          <div className="pt-2">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={18} className="text-muted-foreground shrink-0" />
                  <h1 className="text-xl font-bold leading-tight truncate">
                    {curriculum.program.name}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{curriculum.program.specialty.code}</span>
                  {' '}·{' '}
                  {curriculum.program.specialty.name}
                  {' '}·{' '}
                  {curriculum.program.qualificationName}
                </p>
              </div>

              {/* Status */}
              <div className="shrink-0">
                {curriculum.isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Активний
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Архівний
                  </Badge>
                )}
              </div>
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <GraduationCap size={14} />
                {EDUCATION_FORM_LABELS[curriculum.educationForm]}
              </span>
              <span>·</span>
              <span>{ADMISSION_BASIS_LABELS[curriculum.admissionBasis]}</span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                Рік вступу: <strong className="text-foreground font-mono">{curriculum.entryYear}</strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {formatDuration(curriculum.studyDurationMonths)}
              </span>
              <span>·</span>
              <span className="font-mono font-medium text-foreground">
                {Number(curriculum.totalEcts)} ЄКТС
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-2 text-muted-foreground text-sm">Навчальний план не знайдено</div>
        )}
      </div>

      {/* Stats row */}
      {!isLoading && curriculum && (
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-b border-border">
          <div className="px-4 sm:px-6 py-4">
            <p className="text-xs text-muted-foreground mb-1">Всього версій</p>
            <p className="text-2xl font-bold font-mono">{versions.length}</p>
          </div>
          <div className="px-4 sm:px-6 py-4">
            <p className="text-xs text-muted-foreground mb-1">Опубліковано</p>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {publishedVersions.length}
            </p>
          </div>
          <div className="px-4 sm:px-6 py-4">
            <p className="text-xs text-muted-foreground mb-1">Чернеток</p>
            <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {draftVersions.length}
            </p>
          </div>
          <div className="px-4 sm:px-6 py-4">
            <p className="text-xs text-muted-foreground mb-1">Прив&#39;язано груп</p>
            <p className="text-2xl font-bold font-mono">
              {curriculum._count?.groupAssignments ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Versions section */}
      <div className="flex flex-col gap-0 flex-1">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-sm">Версії навчального плану</h2>
            {!versionsLoading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {versions.length === 0
                  ? 'Версій ще немає'
                  : `${versions.length} версій · актуальна: ${latestVersion ? `v${latestVersion.versionNumber}` : '—'}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canManage && !versionsLoading && versions.length === 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deleteCurriculum.isPending}
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 size={14} />
                Видалити план
              </Button>
            )}
            {canManage && (
              <Button size="sm" className="gap-1.5" onClick={() => setCreateVersionOpen(true)}>
                <Plus size={14} />
                Нова версія
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {versionsLoading && (
            <div className="flex flex-col gap-3 p-4 sm:p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {!versionsLoading && versions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
              <Layers size={40} className="text-muted-foreground/40" />
              <div>
                <p className="font-semibold">Версій ще немає</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Створіть першу версію навчального плану
                </p>
              </div>
              {canManage && (
                <Button size="sm" onClick={() => setCreateVersionOpen(true)} className="gap-1.5">
                  <Plus size={14} />
                  Створити версію
                </Button>
              )}
            </div>
          )}

          {!versionsLoading &&
            sortedVersions.map((version) => (
              <VersionRow
                key={version.id}
                version={version}
                curriculumId={id}
                isLatest={latestVersion?.id === version.id}
              />
            ))}
        </div>
      </div>

      {/* Quick navigate to latest */}
      {latestVersion && (
        <div className="px-4 sm:px-6 py-4 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              router.push(`/academic-plans/${id}/versions/${latestVersion.id}/structure`)
            }
          >
            <Layers size={15} />
            Відкрити актуальну версію (v{latestVersion.versionNumber})
            <ChevronRight size={15} />
          </Button>
        </div>
      )}

      {/* Create version dialog */}
      {canManage && (
        <CreateVersionDialog
          open={createVersionOpen}
          onClose={() => setCreateVersionOpen(false)}
          curriculumId={id}
        />
      )}

      {/* Delete curriculum confirm */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Видалити навчальний план?</DialogTitle>
            <DialogDescription>
              {curriculum && (
                <>
                  Навчальний план{' '}
                  <span className="font-medium text-foreground">
                    {curriculum.program.name}
                  </span>{' '}
                  ({curriculum.entryYear}) буде{' '}
                  <span className="font-semibold text-destructive">
                    безповоротно видалено
                  </span>
                  .<br />
                  Видалення можливе лише якщо план не має жодної версії.
                  Цю дію неможливо скасувати.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              disabled={deleteCurriculum.isPending}
              onClick={() => {
                deleteCurriculum.mutate(id, {
                  onSuccess: () => {
                    setDeleteConfirm(false)
                    router.push('/academic-plans')
                  },
                })
              }}
            >
              {deleteCurriculum.isPending ? 'Видалення…' : 'Видалити назавжди'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
