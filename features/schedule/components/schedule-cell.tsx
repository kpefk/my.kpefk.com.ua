'use client'

import {
  AlertTriangle,
  DoorOpen,
  GripVertical,
  Plus,
  RefreshCw,
  User,
  Users,
  Video,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import {
  LESSON_TYPE_COLOR,
  LESSON_TYPE_LABELS,
  type ScheduleEntryDto,
} from '../types'

interface Props {
  entries: ScheduleEntryDto[]
  onAdd: () => void
  onEdit: (entry: ScheduleEntryDto) => void
  onDragStart?: (entryId: string) => void
}

export function ScheduleCell({ entries, onAdd, onEdit, onDragStart }: Props) {
  if (entries.length === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="group w-full h-full min-h-[88px] flex items-center justify-center rounded-lg border border-dashed border-border/60 text-muted-foreground/30 hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 h-full min-h-[88px]">
      {entries.map((e) => {
        const hasConflict = e.conflicts.length > 0
        return (
          <div
            key={e.id}
            draggable={!!onDragStart}
            onDragStart={(ev) => {
              ev.dataTransfer.effectAllowed = 'move'
              ev.dataTransfer.setData('text/plain', e.id)
              onDragStart?.(e.id)
            }}
            className={cn(
              'group/entry flex-1 rounded-lg border bg-card transition-colors',
              hasConflict ? 'border-destructive/60' : 'border-border',
              onDragStart && 'cursor-grab active:cursor-grabbing',
            )}
          >
            <div className="flex">
              {onDragStart && (
                <div className="flex items-center px-0.5 text-muted-foreground/30 group-hover/entry:text-muted-foreground/60 shrink-0">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              )}
              <button
                type="button"
                onClick={() => onEdit(e)}
                title={hasConflict ? e.conflicts.join('\n') : undefined}
                className="flex-1 text-left p-2.5 hover:bg-muted/30 rounded-r-lg transition-colors"
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <span className="font-medium text-xs leading-snug line-clamp-2">
                    {e.subjectName}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                      LESSON_TYPE_COLOR[e.lessonType],
                    )}
                  >
                    {LESSON_TYPE_LABELS[e.lessonType]}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {e.subgroupNumber !== null && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                      <Users className="w-3 h-3 shrink-0" />
                      {e.subgroupNumber} підгрупа
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <User className="w-3 h-3 shrink-0 text-primary" />
                    <span className="truncate">{e.teacher?.shortName ?? '— викладач —'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <DoorOpen className="w-3 h-3 shrink-0 text-primary" />
                    {e.classroom ? `ауд. ${e.classroom.number}` : '— аудиторія —'}
                  </div>
                  {e.onlineUrl && (
                    <div className="flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400">
                      <Video className="w-3 h-3 shrink-0" />
                      <span className="truncate">Онлайн</span>
                    </div>
                  )}
                  {e.substitutions.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                      <RefreshCw className="w-3 h-3 shrink-0" />
                      {e.substitutions.length} заміна(и)
                    </div>
                  )}
                  {hasConflict && (
                    <div className="flex items-center gap-1 text-[11px] text-destructive">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Конфлікт
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        )
      })}
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 flex items-center justify-center rounded-md border border-dashed border-border/60 py-0.5 text-muted-foreground/40 hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  )
}
