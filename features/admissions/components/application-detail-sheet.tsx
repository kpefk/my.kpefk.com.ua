'use client'

import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import type { AdmissionApplicationRowDto } from '../types'

interface ApplicationDetailSheetProps {
  application: AdmissionApplicationRowDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

function InfoField({
  label,
  value,
  span,
}: {
  label: string
  value: React.ReactNode
  span?: boolean
}) {
  return (
    <div className={span ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value ?? '—'}</p>
    </div>
  )
}

function claimLabel(a: AdmissionApplicationRowDto): string {
  if (a.isClaimForBudget && a.isClaimForContract) return 'Бюджет + Контракт'
  if (a.isClaimForBudget) return 'Бюджет'
  if (a.isClaimForContract) return 'Контракт'
  return '—'
}

function yesNo(v: boolean | null): string {
  if (v === null) return '—'
  return v ? 'Так' : 'Ні'
}

function eduDoc(a: AdmissionApplicationRowDto): string {
  if (!a.entryEduDocNumber) return '—'
  const parts = [
    a.entryEduDocTypeName,
    `${a.entryEduDocSeries ? `${a.entryEduDocSeries} ` : ''}№${a.entryEduDocNumber}`, `(${a.entryEduDocYearEnd})`,
  ].filter((p): p is string => !!p)
  return parts.join(' ')
}

export function ApplicationDetailSheet({
  application,
  open,
  onOpenChange,
}: ApplicationDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        {application && (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="text-lg leading-snug inline-flex items-center gap-2">
                {application.fio ?? '—'}
                {application.enrolled && (
                  <Badge className="whitespace-nowrap">Зараховано</Badge>
                )}
              </SheetTitle>
              <SheetDescription>
                {[
                  application.personalCode ? `Справа № ${application.personalCode}` : null,
                  application.statusTypeName,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Заява вступника'}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 pb-6">
              <InfoSection title="Заява">
                <InfoField label="№ справи" value={application.personalCode} />
                <InfoField label="Статус" value={application.statusTypeName} />
                <InfoField label="Конкурсний бал" value={application.konkursValue} />
                <InfoField label="Пріоритет" value={application.requestPriority} />
                <InfoField label="Претендує на" value={claimLabel(application)} />
                <InfoField label="Зараховано" value={yesNo(application.enrolled)} />
                <InfoField
                  label="Виконано вимоги"
                  value={yesNo(application.isOriginalDocumentsAdded)}
                  span
                />
              </InfoSection>

              <InfoSection title="Навчання">
                <InfoField label="Спеціальність" value={application.specialityName} span />
                <InfoField label="Форма навчання" value={application.educationFormName} />
                <InfoField label="Документ про освіту" value={eduDoc(application)} span />
              </InfoSection>

              <InfoSection title="Контакти">
                <InfoField label="Телефон" value={application.phone} />
                <InfoField label="Email" value={application.email} />
              </InfoSection>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
