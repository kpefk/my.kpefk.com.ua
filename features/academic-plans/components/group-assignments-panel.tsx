'use client'

import { useState } from 'react'
import {
  CalendarCheck,
  CalendarX,
  ChevronDown,
  ChevronUp,
  GitBranch,
  History,
  Plus,
  UserCheck,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { useCloseGroupAssignment, useGroupAssignments } from '../api'
import { formatDate, type GroupCurriculumAssignmentDto } from '../types'
import { AssignGroupDialog } from './assign-group-dialog'

interface GroupAssignmentsPanelProps {
  curriculumId: string
  versionId: string
  canManage: boolean
}

function AssignmentRow({
  assignment,
  canManage,
  onClose,
  isClosing,
}: {
  assignment: GroupCurriculumAssignmentDto
  canManage: boolean
  onClose: (id: string) => void
  isClosing: boolean
}) {
  return (
    <TableRow
      className={cn(
        'transition-colors',
        !assignment.isActive && 'opacity-60 bg-muted/20',
      )}
    >
      {/* Group */}
      <TableCell>
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-muted-foreground shrink-0" />
          <span className="font-mono font-medium">{assignment.group.name}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        {assignment.isActive ? (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
            Активне
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Закрите
          </Badge>
        )}
      </TableCell>

      {/* Effective from */}
      <TableCell className="hidden sm:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarCheck size={13} />
          {formatDate(assignment.effectiveFrom)}
        </div>
      </TableCell>

      {/* Effective until */}
      <TableCell className="hidden sm:table-cell">
        {assignment.effectiveUntil ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarX size={13} />
            {formatDate(assignment.effectiveUntil)}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic">Чинне</span>
        )}
      </TableCell>

      {/* Reason */}
      <TableCell className="hidden md:table-cell max-w-[160px]">
        <span className="text-xs text-muted-foreground truncate block">
          {assignment.reason || '—'}
        </span>
      </TableCell>

      {/* Action */}
      <TableCell className="text-right">
        {canManage && assignment.isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive h-7"
            disabled={isClosing}
            onClick={() => onClose(assignment.id)}
          >
            Закрити
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export function GroupAssignmentsPanel({
  curriculumId,
  versionId,
  canManage,
}: GroupAssignmentsPanelProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: allAssignments = [], isLoading } = useGroupAssignments({ versionId })
  const closeAssignment = useCloseGroupAssignment()

  const active = allAssignments.filter((a) => a.isActive)
  const historical = allAssignments.filter((a) => !a.isActive)

  const displayed = showHistory ? allAssignments : active

  return (
    <div className="flex flex-col gap-0">
      {/* Panel header */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-base">Прив&#39;язані групи</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? 'Завантаження...'
              : `${active.length} активних${historical.length > 0 ? `, ${historical.length} в архіві` : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {historical.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History size={14} />
              {showHistory ? 'Сховати архів' : 'Показати архів'}
              {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </Button>
          )}

          {canManage && (
            <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus size={14} />
              Прив&#39;язати групу
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="whitespace-nowrap">Група</TableHead>
              <TableHead className="whitespace-nowrap">Статус</TableHead>
              <TableHead className="hidden sm:table-cell whitespace-nowrap">
                Дата початку
              </TableHead>
              <TableHead className="hidden sm:table-cell whitespace-nowrap">
                Дата завершення
              </TableHead>
              <TableHead className="hidden md:table-cell">Причина</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading */}
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell />
                </TableRow>
              ))}

            {/* Empty – no assignments */}
            {!isLoading && allAssignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <UserCheck size={40} className="text-muted-foreground/40" />
                    <div>
                      <p className="font-semibold">Немає прив&#39;язаних груп</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Прив&#39;яжіть академічну групу до цього плану
                      </p>
                    </div>
                    {canManage && (
                      <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
                        <Plus size={14} />
                        Прив&#39;язати першу групу
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!isLoading &&
              displayed.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  canManage={canManage}
                  onClose={(id) => closeAssignment.mutate(id)}
                  isClosing={closeAssignment.isPending}
                />
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Assign dialog */}
      <AssignGroupDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        curriculumId={curriculumId}
        versionId={versionId}
      />
    </div>
  )
}
