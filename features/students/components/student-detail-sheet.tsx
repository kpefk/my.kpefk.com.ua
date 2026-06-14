'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth.store'
import { useAdminParentInfo, useAdminUpdateParentInfo } from '@/features/group-leader/api'
import { ParentInfoForm } from '@/features/group-leader/components/ParentInfoForm'

import { formatDate, isStudentActive, type StudentDto } from '../types'

const PARENT_INFO_ROLES = [
  'HEAD_OF_DEPARTMENT',
  'DEPUTY_DIRECTOR',
  'DIRECTOR',
  'ADMINISTRATOR',
] as const

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

interface StudentDetailSheetProps {
  student: StudentDto | null
  open: boolean
  onClose: () => void
}

function PersonalTab({ student }: { student: StudentDto }) {
  const active = isStudentActive(student)
  const educationFlags = [
    student.isDualForm && 'Дуальна форма',
    student.isSecondHigher && 'Другий вищий',
    student.isShortTerm && 'Скорочений термін',
  ]
    .filter(Boolean)
    .join(', ') || null

  return (
    <div className="space-y-6">
      <InfoSection title="Персональні дані">
        <InfoField label="Дата народження" value={formatDate(student.birthday)} />
        <InfoField label="Стать" value={student.personSexName} />
        <InfoField label="ЄДЕБО ID (освіта)" value={student.educationId} />
        <InfoField label="ЄДЕБО ID (особа)" value={student.personId} />
      </InfoSection>

      <InfoSection title="Навчання">
        <InfoField label="Структурний підрозділ" value={student.facultyName} span />
        <InfoField label="Спеціальність" value={student.fullSpecialityName} span />
        <InfoField label="Освітня програма" value={student.studyProgramName} span />
        <InfoField label="Кваліфікація" value={student.professionInfo} span />
        <InfoField label="Освітній ступінь" value={student.qualificationGroupName} />
        <InfoField label="Форма навчання" value={student.educationFormName} />
        <InfoField label="Курс" value={student.courseName} />
        <InfoField label="Група" value={student.groupName} />
        <InfoField label="Початок навчання" value={formatDate(student.educationDateBegin)} />
        <InfoField label="Кінець навчання" value={formatDate(student.educationDateEnd)} />
        {student.licenseYear && (
          <InfoField label="Рік набору" value={student.licenseYear} />
        )}
        {educationFlags && (
          <InfoField label="Особливості" value={educationFlags} span />
        )}
      </InfoSection>

      {(!active || student.expelEducationTypeName || student.academicLeaveTypeName) && (
        <InfoSection title="Статус навчання">
          {student.expelEducationTypeName && (
            <InfoField label="Причина відрахування" value={student.expelEducationTypeName} span />
          )}
          {student.academicLeaveTypeName && (
            <InfoField label="Академічна відпустка" value={student.academicLeaveTypeName} span />
          )}
        </InfoSection>
      )}

      {(student.foreignTypeName || student.budgetTransferCategoryName) && (
        <InfoSection title="Додаткові відомості">
          {student.foreignTypeName && (
            <InfoField label="Категорія іноземця" value={student.foreignTypeName} span />
          )}
          {student.budgetTransferCategoryName && (
            <InfoField label="Переведення на бюджет" value={student.budgetTransferCategoryName} span />
          )}
        </InfoSection>
      )}

      <InfoSection title="Службові дані">
        <InfoField label="Остання зміна в ЄДЕБО" value={formatDate(student.modifyDate)} />
        <InfoField label="Додано до системи" value={formatDate(student.createdAt)} />
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Акаунт в системі</p>
          {student.userId ? (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Підключено</p>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">Відсутній</p>
          )}
        </div>
      </InfoSection>
    </div>
  )
}

function AdminParentInfoTab({ studentId }: { studentId: string }) {
  const { data: parentInfo, isLoading } = useAdminParentInfo(studentId)
  const update = useAdminUpdateParentInfo(studentId)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Завантаження…</p>
  }

  return (
    <div className="space-y-6">
      <ParentInfoForm
        initial={parentInfo ?? null}
        onSave={(data) => update.mutate(data)}
        isSaving={update.isPending}
      />
    </div>
  )
}

function AdminNotesTab({ studentId }: { studentId: string }) {
  const { data: parentInfo, isLoading } = useAdminParentInfo(studentId)
  const update = useAdminUpdateParentInfo(studentId)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Завантаження…</p>
  }

  return (
    <ParentInfoForm
      initial={parentInfo ?? null}
      onSave={(data) => update.mutate(data)}
      isSaving={update.isPending}
      notesOnly
    />
  )
}

export function StudentDetailSheet({ student, open, onClose }: StudentDetailSheetProps) {
  const userRole = useAuthStore((s) => s.user?.role)
  const canSeeParentInfo = PARENT_INFO_ROLES.includes(
    userRole as (typeof PARENT_INFO_ROLES)[number],
  )

  if (!student) return null

  const active = isStudentActive(student)
  const statusBadge = student.academicLeaveTypeName ? (
    <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">
      Академвідпустка
    </Badge>
  ) : student.expelEducationTypeName ? (
    <Badge className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
      Відраховано
    </Badge>
  ) : (
    <Badge className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
      Навчається
    </Badge>
  )

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[580px] sm:max-w-[580px] overflow-y-auto flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-lg leading-snug">{student.personFIO}</SheetTitle>
              <SheetDescription className="mt-0.5">
                {[student.groupName, student.courseName].filter(Boolean).join(' · ') ||
                  'Група не вказана'}
              </SheetDescription>
            </div>
            {statusBadge}
          </div>
        </SheetHeader>

        <div className="flex-1 px-6 py-5 overflow-y-auto">
          {canSeeParentInfo ? (
            <Tabs defaultValue="personal">
              <TabsList className="mb-5 w-full">
                <TabsTrigger value="personal" className="flex-1">Особиста</TabsTrigger>
                <TabsTrigger value="parents" className="flex-1">Батьки / Опікуни</TabsTrigger>
                <TabsTrigger value="notes" className="flex-1">Нотатки</TabsTrigger>
              </TabsList>
              <TabsContent value="personal">
                <PersonalTab student={student} />
              </TabsContent>
              <TabsContent value="parents">
                <AdminParentInfoTab studentId={student.id} />
              </TabsContent>
              <TabsContent value="notes">
                <AdminNotesTab studentId={student.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <PersonalTab student={student} />
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Закрити
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
