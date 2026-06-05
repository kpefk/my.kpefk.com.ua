'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Copy,
  FileEdit,
  SendHorizonal,
  ShieldAlert,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurriculumStructureTable } from '@/features/academic-plans/components/curriculum-structure-table'
import {
  useCurriculumVersion,
  useDeleteVersion,
  useDeprecateVersion,
  useDuplicateVersion,
  usePublishVersion,
} from '@/features/academic-plans/api'
import { useRouter } from 'next/navigation'
import { useUser } from '@/store/auth.store'
import { cn } from '@/lib/utils'

const MANAGER_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

export default function StructurePage() {
  const { id, versionId } = useParams<{ id: string; versionId: string }>()
  const router = useRouter()
  const user = useUser()
  const canManage = !!user && MANAGER_ROLES.includes(user.role)

  const [publishConfirm, setPublishConfirm] = useState(false)
  const [deprecateConfirm, setDeprecateConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: version, isLoading } = useCurriculumVersion(versionId)
  const publishVersion = usePublishVersion()
  const deprecateVersion = useDeprecateVersion()
  const duplicateVersion = useDuplicateVersion()
  const deleteVersion = useDeleteVersion()

  const isDraft = version && !version.isPublished
  const isPublished = version?.isPublished && !version?.deprecatedAt

  return (
    <div className="flex flex-col gap-0">
      {/* Action bar */}
      {canManage && !isLoading && version && (
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 sm:px-6 py-3 border-b border-border bg-muted/20">
          {/* Draft → Publish */}
          {isDraft && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setPublishConfirm(true)}
            >
              <SendHorizonal size={14} />
              Опублікувати версію
            </Button>
          )}

          {/* Published → Deprecate */}
          {isPublished && (
            <Button
              size="sm"
              variant="outline"
              className={cn(
                'gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50',
                'dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30',
              )}
              onClick={() => setDeprecateConfirm(true)}
            >
              <ShieldAlert size={14} />
              Позначити як застарілу
            </Button>
          )}

          {/* Duplicate */}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            disabled={duplicateVersion.isPending}
            onClick={() =>
              duplicateVersion.mutate({
                sourceVersionId: versionId,
                targetCurriculumId: id,
              })
            }
          >
            <Copy size={14} />
            Дублювати як чернетку
          </Button>

          {/* Delete draft — only for unpublished, non-deprecated versions */}
          {isDraft && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={deleteVersion.isPending}
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 size={14} />
              Видалити чернетку
            </Button>
          )}

        </div>
      )}

      {/* Structure table */}
      <CurriculumStructureTable version={version} isLoading={isLoading} canEdit={!!isDraft && canManage} />

      {/* Publish confirm */}
      <Dialog open={publishConfirm} onOpenChange={setPublishConfirm}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Опублікувати версію?</DialogTitle>
            <DialogDescription>
              Після публікації версія стає актуальною для прив&#39;язаних груп. Зміна структури буде
              неможлива. Ви можете дублювати її для подальшого редагування.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishConfirm(false)}>
              Скасувати
            </Button>
            <Button
              disabled={publishVersion.isPending}
              onClick={() => {
                publishVersion.mutate(versionId, { onSuccess: () => setPublishConfirm(false) })
              }}
            >
              Опублікувати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deprecate confirm */}
      <Dialog open={deprecateConfirm} onOpenChange={setDeprecateConfirm}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Позначити версію як застарілу?</DialogTitle>
            <DialogDescription>
              Версія залишиться в системі, але більше не вважатиметься актуальною. Прив&#39;язані
              групи потрібно буде переприв&#39;язати до іншої версії.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeprecateConfirm(false)}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              disabled={deprecateVersion.isPending}
              onClick={() => {
                deprecateVersion.mutate(versionId, {
                  onSuccess: () => setDeprecateConfirm(false),
                })
              }}
            >
              Позначити як застарілу
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete draft confirm */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Видалити чернеткову версію?</DialogTitle>
            <DialogDescription>
              Версію навчального плану{version ? ` № ${version.versionNumber}` : ''} та всю її
              структуру (розділи, компоненти, семестри, бюджет часу, календар) буде{' '}
              <span className="font-semibold text-destructive">безповоротно видалено</span>. Цю дію
              неможливо скасувати.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              disabled={deleteVersion.isPending}
              onClick={() => {
                deleteVersion.mutate(
                  { versionId, curriculumId: id },
                  {
                    onSuccess: () => {
                      setDeleteConfirm(false)
                      router.push(`/academic-plans/${id}`)
                    },
                  },
                )
              }}
            >
              {deleteVersion.isPending ? 'Видалення…' : 'Видалити назавжди'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
