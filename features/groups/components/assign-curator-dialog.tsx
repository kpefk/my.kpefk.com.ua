'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { useAssignCurator } from '../api'
import { getGroupCuratorName, type CuratorOption, type GroupDto } from '../types'

interface AssignCuratorDialogProps {
  group: GroupDto | null
  open: boolean
  onClose: () => void
  teachers: CuratorOption[]
}

export function AssignCuratorDialog({ group, open, onClose, teachers }: AssignCuratorDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)

  const assignCurator = useAssignCurator()

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedTeacherId(null)
    }
  }, [open])

  if (!group) return null

  const hasCurator = group.curator !== null
  const title = hasCurator ? 'Змінити куратора' : 'Призначити куратора'

  const filteredTeachers = search.trim()
    ? teachers.filter((t) =>
        t.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (t.positionName?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : teachers

  const handleAssign = async () => {
    if (!group || !selectedTeacherId) return
    await assignCurator.mutateAsync({ groupId: group.id, teacherId: selectedTeacherId })
    onClose()
  }

  const handleRemoveCurator = async () => {
    if (!group) return
    await assignCurator.mutateAsync({ groupId: group.id, teacherId: null })
    onClose()
  }

  const isPending = assignCurator.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-1">
            <span className="font-medium text-foreground">{group.name}</span>
            {group.fullSpecialityName && (
              <span className="text-muted-foreground"> — {group.fullSpecialityName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Current curator card */}
          {hasCurator && group.curator && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {getGroupCuratorName(group.curator)}
                  </p>
                  {group.curator.positionName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {group.curator.positionName}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCurator}
                  disabled={isPending}
                  className="shrink-0 gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <X size={14} />
                  )}
                  Зняти куратора
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">або призначте іншого:</p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за прізвищем або посадою..."
              className="pl-9 bg-background"
            />
          </div>

          {/* Teachers list */}
          <div className="max-h-64 overflow-y-auto -mx-2 px-2 space-y-0.5">
            {filteredTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Викладачів не знайдено
              </p>
            ) : (
              filteredTeachers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3',
                    selectedTeacherId === t.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted border border-transparent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.positionName ?? '—'}
                    </p>
                  </div>
                  {selectedTeacherId === t.id && (
                    <Check size={16} className="text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Скасувати
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTeacherId || isPending}
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Призначити'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
