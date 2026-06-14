'use client'

import { Users } from 'lucide-react'

import { Preloader } from '@/components/preloader'
import { Skeleton } from '@/components/ui/skeleton'

import { useMyGroups, useGroupStudents } from '../api'
import { GroupStudentTable } from './GroupStudentTable'

export function MyGroupClient() {
  const { data: groups, isLoading: groupsLoading, isError } = useMyGroups()

  // Only one group possible given @unique curatorId constraint
  const group = groups?.[0]

  const { data: detail, isLoading: detailLoading } = useGroupStudents(group?.id ?? '')

  if (groupsLoading) return <Preloader />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Users size={28} className="text-destructive" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="font-semibold text-foreground">Не вдалося завантажити дані</p>
          <p className="text-sm text-muted-foreground">
            Перевірте підключення до сервера або оновіть сторінку.
          </p>
        </div>
      </div>
    )
  }

  if (!groups || groups.length === 0 || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Users size={28} className="text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="font-semibold text-foreground">Групу не призначено</p>
          <p className="text-sm text-muted-foreground">
            Вас ще не призначено куратором жодної групи. Зверніться до адміністратора.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            Моя група: <span className="text-primary">{group.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {group.speciality ?? '—'} · {group.studentCount} студентів
          </p>
        </div>
      </div>

      {detailLoading || !detail ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : (
        <GroupStudentTable
          groupId={detail.id}
          groupName={detail.name}
          students={detail.students}
        />
      )}
    </div>
  )
}
