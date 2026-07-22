'use client'

import { UserMinus, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { Badge } from '@/components/ui/badge'

import { formatDate, getGroupCuratorName, isGroupArchived, type GroupDto } from '../types'

// ── Reusable primitives ───────────────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

function InfoField({ label, value, span }: { label: string; value: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value ?? '—'}</p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────

interface GroupDetailSheetProps {
  group: GroupDto | null
  open: boolean
  onClose: () => void
  onAssignCurator: () => void
}

export function GroupDetailSheet({ group, open, onClose, onAssignCurator }: GroupDetailSheetProps) {
  if (!group) return null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[560px] sm:max-w-[560px] overflow-y-auto flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="min-w-0">
            <SheetTitle className="text-lg leading-snug inline-flex items-center gap-2">
              {group.name}
              {isGroupArchived(group) && (
                <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300 hover:bg-slate-200 whitespace-nowrap font-normal">
                  Архів
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription className="mt-0.5">
              {[
                group.course ? `${group.course} курс` : null,
                group.educationFormName,
              ]
                .filter(Boolean)
                .join(' · ') || 'Академічна група'}
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">

          <InfoSection title="Загальна інформація">
            <InfoField label="Назва групи" value={group.name} />
            <InfoField label="Курс" value={group.course} />
            <InfoField label="Форма навчання" value={group.educationFormName} />
            <InfoField label="Кваліфікація" value={group.qualificationGroupName} />
            <InfoField label="Спеціальність" value={group.fullSpecialityName} span />
            <InfoField label="Освітня програма" value={group.studyProgramName} span />
            <InfoField label="Відділення" value={group.facultyName} span />
          </InfoSection>

          {/* Curator */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Куратор
            </h3>
            {group.curator ? (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getGroupCuratorName(group.curator)}
                  </p>
                  {group.curator.positionName && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {group.curator.positionName}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={onAssignCurator}
                >
                  <UserMinus size={14} />
                  Змінити
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-3">
                <p className="text-sm text-muted-foreground italic">Куратора не призначено</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={onAssignCurator}
                >
                  <UserPlus size={14} />
                  Призначити
                </Button>
              </div>
            )}
          </div>

          {/* Students */}
          <InfoSection title="Студенти">
            <InfoField label="Кількість студентів" value={group.studentsCount ?? '—'} />
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">
                Перегляд списку студентів — на сторінці{' '}
                <span className="font-medium text-foreground">Студенти</span>
              </p>
            </div>
          </InfoSection>

          {/* Service */}
          <InfoSection title="Службові дані">
            <InfoField label="Остання синхронізація" value={formatDate(group.modifyDate)} />
            <InfoField label="Додано" value={formatDate(group.createdAt)} />
          </InfoSection>

        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Закрити
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
