'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGroups } from '@/features/groups/api'
import { DEFAULT_GROUP_FILTERS } from '@/features/groups/types'
import { cn } from '@/lib/utils'

import { useCreateGroupAssignment, useGroupAssignments } from '../api'

interface AssignGroupDialogProps {
  open: boolean
  onClose: () => void
  curriculumId: string
  versionId: string
}

export function AssignGroupDialog({
  open,
  onClose,
  curriculumId,
  versionId,
}: AssignGroupDialogProps) {
  const [groupId, setGroupId] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [reason, setReason] = useState('')

  const { data: groups = [], isLoading: groupsLoading } = useGroups(DEFAULT_GROUP_FILTERS)
  const { data: activeAssignments = [] } = useGroupAssignments({ activeOnly: true })
  const createAssignment = useCreateGroupAssignment()

  useEffect(() => {
    if (open) {
      setGroupId('')
      setEffectiveFrom(new Date().toISOString().slice(0, 10))
      setReason('')
    }
  }, [open])

  // Check if selected group already has an active assignment to a DIFFERENT version
  const existingAssignment = groupId
    ? activeAssignments.find(
        (a) => a.groupId === groupId && a.versionId !== versionId,
      )
    : null

  const isValid = groupId !== '' && effectiveFrom !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    createAssignment.mutate(
      {
        groupId,
        curriculumId,
        versionId,
        effectiveFrom,
        reason: reason.trim() || undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Прив&#39;язати групу до плану</DialogTitle>
          <DialogDescription>
            Групу буде прив&#39;язано до цієї версії навчального плану. Якщо
            в групи є активне прив&#39;язання до іншого плану — воно буде
            автоматично закрито.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Group selector */}
          <Field>
            <FieldLabel htmlFor="ag-group">
              Академічна група <span className="text-destructive">*</span>
            </FieldLabel>
            <Select value={groupId} onValueChange={setGroupId} disabled={groupsLoading}>
              <SelectTrigger id="ag-group" className="bg-background">
                <SelectValue placeholder={groupsLoading ? 'Завантаження...' : 'Оберіть групу...'} />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="font-mono">{g.name}</span>
                    {g.course && (
                      <span className="text-muted-foreground text-xs ml-2">· {g.course} курс</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Existing assignment warning */}
          {existingAssignment && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                'border-amber-200 bg-amber-50 text-amber-800',
                'dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
              )}
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>
                Ця група вже прив&#39;язана до іншого навчального плану
                (v{existingAssignment.version.versionNumber}, рік вступу{' '}
                {existingAssignment.curriculum.entryYear}). Після підтвердження
                попереднє прив&#39;язання буде закрито.
              </span>
            </div>
          )}

          {/* Effective from */}
          <Field>
            <FieldLabel htmlFor="ag-date">
              Дата початку дії <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="ag-date"
              type="date"
              required
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="bg-background"
            />
          </Field>

          {/* Reason */}
          <Field>
            <FieldLabel htmlFor="ag-reason">Причина / коментар</FieldLabel>
            <Input
              id="ag-reason"
              placeholder="Необов&#39;язково"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-background"
            />
          </Field>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createAssignment.isPending}
              className={cn(existingAssignment && 'bg-amber-600 hover:bg-amber-700')}
            >
              {createAssignment.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : existingAssignment ? (
                'Прив&#39;язати (замінити існуюче)'
              ) : (
                'Прив&#39;язати'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
