'use client'

// NOTE: Вміст редактора винесено у ClassroomEditor — цей файл лише Sheet-обгортка.

import { useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ExternalLink,
  FileText,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserCog,
  X,
} from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import {
  useDeleteClassroom,
  useDeletePassport,
  useDeletePhoto,
  useReorderPhotos,
  useUploadPassport,
  useUploadPhoto,
} from '../api'
import { ClassroomFormDialog } from './classroom-form-dialog'
import {
  formatDate,
  getTeacherFullName,
  type ClassroomDto,
  type ClassroomPhoto,
} from '../types'

// ── Sortable photo card ───────────────────────────────────────────

function SortablePhotoCard({
  photo,
  onDelete,
  isDeleting,
}: {
  photo: ClassroomPhoto
  onDelete: () => void
  isDeleting: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.googleFileId })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className="relative group rounded-lg overflow-hidden border border-border aspect-video bg-muted"
    >
      <img
        src={photo.url}
        alt="Фото кабінету"
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* Grip indicator — завжди видимий */}
      <div className="absolute top-1 left-1 p-1 rounded bg-black/50 text-white">
        <GripVertical size={13} />
      </div>

      {/* Actions — зупиняємо propagation щоб не запускати drag */}
      <div className="absolute top-1 right-1 flex flex-col gap-1">
        <a
          href={photo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded bg-black/50 hover:bg-black/70 text-white transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={13} />
        </a>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="p-1.5 rounded bg-black/50 hover:bg-red-500/80 text-white transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Видалити фото?</AlertDialogTitle>
              <AlertDialogDescription>
                Фото буде видалено з Google Drive. Цю дію неможливо скасувати.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                Видалити
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

// ── Upload slot ───────────────────────────────────────────────────

function UploadSlot({ onUpload, isUploading, accept, label, fullWidth, blocked, blockedMessage }: {
  onUpload: (f: File) => void
  isUploading: boolean
  accept: string
  label: string
  /** Горизонтальна кнопка на всю ширину (для PDF) */
  fullWidth?: boolean
  /** Якщо true — показуємо toast замість file picker */
  blocked?: boolean
  blockedMessage?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (blocked) {
      toast.error(blockedMessage ?? 'Дія недоступна')
      return
    }
    inputRef.current?.click()
  }

  if (fullWidth) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground text-sm"
      >
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {isUploading ? 'Завантаження...' : label}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) { onUpload(f); e.target.value = '' }
          }}
        />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUploading}
      className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 hover:bg-muted/60 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
    >
      {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
      <span className="text-xs">{isUploading ? 'Завантаження...' : label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) { onUpload(f); e.target.value = '' }
        }}
      />
    </button>
  )
}

// ── Info helpers ──────────────────────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

function InfoField({ label, value, span }: { label: string; value: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value ?? '—'}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

interface ClassroomDetailSheetProps {
  classroom: ClassroomDto | null
  open: boolean
  onClose: () => void
}

export function ClassroomDetailSheet({ classroom, open, onClose }: ClassroomDetailSheetProps) {
  const [editOpen, setEditOpen] = useState(false)

  const uploadPhoto = useUploadPhoto(classroom?.id ?? '')
  const deletePhoto = useDeletePhoto(classroom?.id ?? '')
  const reorderPhotos = useReorderPhotos(classroom?.id ?? '')
  const uploadPassport = useUploadPassport(classroom?.id ?? '')
  const deletePassport = useDeletePassport(classroom?.id ?? '')
  const deleteClassroom = useDeleteClassroom()

  const sensors = useSensors(
    // MouseSensor + TouchSensor замість PointerSensor:
    // PointerSensor не блокує виділення тексту до активації.
    // MouseSensor з distance:8 чекає 8px руху і лише тоді перехоплює подію.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,  { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  if (!classroom) return null

  const MAX_PHOTOS = 4
  const sortedPhotos = [...classroom.photos].sort((a, b) => a.order - b.order)
  const isFull = sortedPhotos.length >= MAX_PHOTOS

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedPhotos.findIndex((p) => p.googleFileId === active.id)
    const newIndex = sortedPhotos.findIndex((p) => p.googleFileId === over.id)
    const reordered = arrayMove(sortedPhotos, oldIndex, newIndex)

    reorderPhotos.mutate(
      reordered.map((p, i) => ({ googleFileId: p.googleFileId, order: i }))
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:w-[560px] sm:max-w-[560px] flex flex-col gap-0 p-0 overflow-y-auto"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg">Кабінет №{classroom.number}</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={14} />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 px-6 py-5 space-y-6">

            {/* ── Фотографії з DnD ─────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Фотографії
                </h3>
                <span className="text-xs text-muted-foreground">
                  {sortedPhotos.length}/{MAX_PHOTOS} · перетягніть щоб змінити порядок
                </span>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={sortedPhotos.map((p) => p.googleFileId)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {sortedPhotos.map((photo) => (
                      <SortablePhotoCard
                        key={photo.googleFileId}
                        photo={photo}
                        onDelete={() => deletePhoto.mutate(photo.googleFileId)}
                        isDeleting={deletePhoto.isPending}
                      />
                    ))}
                    {/* Завжди показуємо — при заповненні показує помилку */}
                    <UploadSlot
                      onUpload={(f) => uploadPhoto.mutate(f)}
                      isUploading={uploadPhoto.isPending}
                      accept="image/jpeg,image/png,image/webp"
                      label="Додати фото"
                      blocked={isFull}
                      blockedMessage="Завантажено максимум фото. Спочатку видаліть фото які хочете замінити"
                    />
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* ── Паспорт кабінету (PDF) ────────────────────── */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Паспорт кабінету
              </h3>

              {classroom.passportUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <FileText size={20} className="text-primary shrink-0" />
                  <span className="text-sm flex-1 truncate">
                    passport-{classroom.number}.pdf
                  </span>
                  <a
                    href={classroom.passportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        disabled={deletePassport.isPending}
                      >
                        {deletePassport.isPending
                          ? <Loader2 size={14} className="animate-spin" />
                          : <X size={14} />
                        }
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Видалити паспорт?</AlertDialogTitle>
                        <AlertDialogDescription>
                          PDF-файл буде видалено з Google Drive. Цю дію неможливо скасувати.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePassport.mutate()}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Видалити
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <UploadSlot
                  onUpload={(f) => uploadPassport.mutate(f)}
                  isUploading={uploadPassport.isPending}
                  accept="application/pdf"
                  label="Завантажити PDF"
                  fullWidth
                />
              )}
            </div>

            {/* ── Основна інформація ────────────────────────── */}
            <InfoSection title="Основна інформація">
              <InfoField label="Номер" value={`№${classroom.number}`} />
              <InfoField label="Створено" value={formatDate(classroom.createdAt)} />
              <InfoField label="Назва" value={classroom.name} span />
              <InfoField label="Оновлено" value={formatDate(classroom.updatedAt)} />
            </InfoSection>

            {/* ── Завідувач ─────────────────────────────────── */}
            {classroom.teacher ? (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Завідувач кабінету</h3>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <UserCog size={14} className="text-muted-foreground shrink-0" />
                  {getTeacherFullName(classroom.teacher)}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Завідувач кабінету</h3>
                <p className="text-sm text-muted-foreground italic">Завідувача не призначено</p>
              </div>
            )}

          </div>

          <SheetFooter className="px-6 py-4 border-t border-border flex-row gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  disabled={deleteClassroom.isPending}
                >
                  {deleteClassroom.isPending
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />
                  }
                  Видалити кабінет
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити кабінет №{classroom.number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Разом з кабінетом будуть видалені всі {sortedPhotos.length} фото
                    {classroom.passportUrl ? ' та паспорт' : ''} з Google Drive.
                    Цю дію неможливо скасувати.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteClassroom.mutate(classroom.id, { onSuccess: onClose })}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Видалити
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" onClick={onClose} className="ml-auto">
              Закрити
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ClassroomFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        classroom={classroom}
      />
    </>
  )
}
