'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useUpdateParentInfo } from '../api'
import type { GroupStudentDto } from '../types'
import { ParentInfoForm } from './ParentInfoForm'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? <span className="text-muted-foreground">Не заповнено</span>}</p>
    </div>
  )
}

interface StudentDetailPanelProps {
  student: GroupStudentDto | null
  groupId: string
  open: boolean
  onClose: () => void
}

export function StudentDetailPanel({ student, groupId, open, onClose }: StudentDetailPanelProps) {
  const update = useUpdateParentInfo(groupId, student?.id ?? '')

  if (!student) return null

  const birthday = student.birthday
    ? new Date(student.birthday).toLocaleDateString('uk-UA')
    : null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:w-[540px] sm:max-w-[540px]"
      >
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle className="text-lg">{student.fullName}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {[student.groupName, student.courseName].filter(Boolean).join(' · ') || '—'}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Tabs defaultValue="personal">
            <TabsList className="mb-5 w-full">
              <TabsTrigger value="personal" className="flex-1">Особиста</TabsTrigger>
              <TabsTrigger value="parents" className="flex-1">Батьки / Опікуни</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Нотатки</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="grid grid-cols-2 gap-x-4 gap-y-4">
              <InfoRow label="ПІБ" value={student.fullName} />
              <InfoRow label="Дата народження" value={birthday} />
              <InfoRow label="Форма навчання" value={student.educationFormName} />
              <InfoRow label="Фінансування" value={student.personEducationPaymentTypeName} />
              <InfoRow label="Корпоративна пошта" value={student.email} />
            </TabsContent>

            <TabsContent value="parents">
              <ParentInfoForm
                initial={student.parentInfo}
                onSave={(data) => update.mutate(data)}
                isSaving={update.isPending}
              />
            </TabsContent>

            <TabsContent value="notes">
              <ParentInfoForm
                initial={student.parentInfo}
                onSave={(data) => update.mutate(data)}
                isSaving={update.isPending}
                notesOnly
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
