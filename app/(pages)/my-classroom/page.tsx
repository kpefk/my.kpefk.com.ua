'use client'

import { DoorOpen } from 'lucide-react'

import { Preloader } from '@/components/preloader'
import { useMyClassroom } from '@/features/classrooms/api'
import { ClassroomEditor } from '@/features/classrooms/components/classroom-editor'

export default function MyClassroomPage() {
  const { data: classroom, isLoading } = useMyClassroom()

  if (isLoading) return <Preloader />

  if (!classroom) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <DoorOpen size={28} className="text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="font-semibold text-foreground">Кабінет не призначено</p>
          <p className="text-sm text-muted-foreground">
            Вам ще не призначено жодного навчального кабінету. Зверніться до адміністратора.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Кабінет №{classroom.number}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">{classroom.name}</p>
      </div>

      {/* Викладач бачить той самий редактор що й адмін, але без кнопки видалення */}
      <ClassroomEditor classroom={classroom} canDelete={false} />
    </div>
  )
}
