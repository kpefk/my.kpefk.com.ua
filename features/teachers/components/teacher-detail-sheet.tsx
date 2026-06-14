'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { useQualificationUpgrades } from '../api'
import { formatDate, formatStage, getFullName, type TeacherDto } from '../types'

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

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value ?? '—'}</p>
    </div>
  )
}

// ── Sheet component ───────────────────────────────────────────────

interface TeacherDetailSheetProps {
  teacher: TeacherDto | null
  open: boolean
  onClose: () => void
}

export function TeacherDetailSheet({ teacher, open, onClose }: TeacherDetailSheetProps) {
  const { data: upgrades, isLoading: upgradesLoading } = useQualificationUpgrades(
    open ? (teacher?.id ?? null) : null,
  )

  if (!teacher) return null

  const fullName = getFullName(teacher)

  const stageLabel =
    teacher.stage != null
      ? [formatStage(teacher.stage), teacher.stageTypeName].filter(Boolean).join(' — ')
      : null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[560px] sm:max-w-[560px] overflow-y-auto flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-lg leading-snug">{fullName}</SheetTitle>
              <SheetDescription className="mt-0.5">
                {teacher.positionName ?? 'Посада не вказана'}
              </SheetDescription>
            </div>
            <Badge
              className={
                teacher.isActive
                  ? 'shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                  : 'shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100'
              }
            >
              {teacher.isActive ? 'Працює' : 'Звільнений'}
            </Badge>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">

          <InfoSection title="Персональні дані">
            <InfoField label="Дата народження" value={formatDate(teacher.birthday)} />
            <InfoField label="Стать" value={teacher.personSexName} />
            <InfoField label="Громадянство" value={teacher.countryName} />
            <InfoField label="ЄДЕБО ID" value={teacher.staffId} />
          </InfoSection>

          <InfoSection title="Місце роботи">
            <InfoField label="Факультет" value={teacher.universityFacultyFullName} />
            <InfoField label="Кафедра" value={teacher.universityFacultyChairFullName} />
            <InfoField label="Посада" value={teacher.positionName} />
            <InfoField label="Трудовий статус" value={teacher.positionPluralityName} />
            <InfoField label="Місце основної роботи" value={teacher.positionPlace} />
          </InfoSection>

          <InfoSection title="Кваліфікація">
            <InfoField label="Кваліфікаційна категорія" value={teacher.skillName} />
            <InfoField label="Педагогічні звання" value={teacher.dignityNames} />
            <InfoField label="Професія" value={teacher.profession} />
            <InfoField label="Розряд" value={teacher.rang} />
          </InfoSection>

          <InfoSection title="Стаж">
            <InfoField label="Стаж" value={stageLabel} />
            <InfoField label="Дата початку" value={formatDate(teacher.startDate)} />
            <InfoField label="Дата прийому" value={formatDate(teacher.dateRecruit)} />
            {teacher.dateFire && (
              <InfoField label="Дата звільнення" value={formatDate(teacher.dateFire)} />
            )}
          </InfoSection>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Підвищення кваліфікації
            </h3>
            {upgradesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : upgrades && upgrades.length > 0 ? (
              <div className="space-y-2">
                {upgrades.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm space-y-0.5"
                  >
                    <p className="font-medium leading-snug">{u.courseName}</p>
                    {u.organizationName && (
                      <p className="text-muted-foreground text-xs">{u.organizationName}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                      <span>{formatDate(u.endDate)}</span>
                      <span>{u.hours} год</span>
                      {u.certificateNumber && <span>№ {u.certificateNumber}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : teacher.coursesInfo ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{teacher.coursesInfo}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Відомостей немає</p>
            )}
          </div>

          <InfoSection title="Службові дані">
            <InfoField
              label="Остання зміна в ЄДЕБО"
              value={formatDate(teacher.modifyDate)}
            />
            <InfoField
              label="Додано до системи"
              value={formatDate(teacher.createdAt)}
            />
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Акаунт в системі</p>
              {teacher.userId ? (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Підключено
                </p>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">Відсутній</p>
              )}
            </div>
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
