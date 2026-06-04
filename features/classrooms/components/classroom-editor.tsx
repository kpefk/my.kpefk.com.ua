'use client'

import { useRef, useState } from 'react'
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
  UserCog,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

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
  useDeletePassport,
  useDeletePhoto,
  useReorderPhotos,
  useUploadPassport,
  useUploadPhoto,
} from '../api'
import { ClassroomFormDialog } from './classroom-form-dialog'
import { formatDate, getTeacherFullName, type ClassroomDto, type ClassroomPhoto } from '../types'

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
      className="relative group rounded-xl overflow-hidden border border-border aspect-video bg-muted"
    >
      <img
        src={photo.url}
        alt="Фото кабінету"
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      <div className="absolute top-1.5 left-1.5 p-1 rounded bg-black/50 text-white">
        <GripVertical size={13} />
      </div>
      <div className="absolute top-1.5 right-1.5 flex gap-1">
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

function UploadSlot({
  onUpload, isUploading, accept, label, fullWidth, blocked, blockedMessage,
}: {
  onUpload: (f: File) => void
  isUploading: boolean
  accept: string
  label: string
  fullWidth?: boolean
  blocked?: boolean
  blockedMessage?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleClick = () => {
    if (blocked) { toast.error(blockedMessage ?? 'Дія недоступна'); return }
    inputRef.current?.click()
  }

  const baseClass = fullWidth
    ? 'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground text-sm'
    : 'aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/30 hover:bg-muted/60 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground'

  return (
    <button type="button" onClick={handleClick} disabled={isUploading} className={baseClass}>
      {isUploading ? <Loader2 size={fullWidth ? 16 : 20} className="animate-spin" /> : <Plus size={fullWidth ? 16 : 20} />}
      <span className={fullWidth ? '' : 'text-xs'}>{isUploading ? 'Завантаження...' : label}</span>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = '' } }} />
    </button>
  )
}

// ── Section helpers ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

interface ClassroomEditorProps {
  classroom: ClassroomDto
  /** Показати кнопку видалення (тільки для адміна) */
  canDelete?: boolean
  onDelete?: () => void
  isDeleting?: boolean
}

export function ClassroomEditor({
  classroom,
  canDelete = false,
  onDelete,
  isDeleting = false,
}: ClassroomEditorProps) {
  const [editOpen, setEditOpen] = useState(false)

  const uploadPhoto   = useUploadPhoto(classroom.id)
  const deletePhoto   = useDeletePhoto(classroom.id)
  const reorderPhotos = useReorderPhotos(classroom.id)
  const uploadPassport = useUploadPassport(classroom.id)
  const deletePassport = useDeletePassport(classroom.id)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const MAX_PHOTOS  = 4
  const sortedPhotos = [...classroom.photos].sort((a, b) => a.order - b.order)
  const isFull      = sortedPhotos.length >= MAX_PHOTOS

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortedPhotos.findIndex((p) => p.googleFileId === active.id)
    const newIndex  = sortedPhotos.findIndex((p) => p.googleFileId === over.id)
    const reordered = arrayMove(sortedPhotos, oldIndex, newIndex)
    reorderPhotos.mutate(reordered.map((p, i) => ({ googleFileId: p.googleFileId, order: i })))
  }

  return (
    <>
      <div className="space-y-4">

        {/* ── Фотографії ─────────────────────────────────── */}
        <Section title={`Фотографії · ${sortedPhotos.length}/${MAX_PHOTOS} · перетягніть щоб змінити порядок`}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedPhotos.map((p) => p.googleFileId)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3">
                {sortedPhotos.map((photo) => (
                  <SortablePhotoCard
                    key={photo.googleFileId}
                    photo={photo}
                    onDelete={() => deletePhoto.mutate(photo.googleFileId)}
                    isDeleting={deletePhoto.isPending}
                  />
                ))}
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
        </Section>

        {/* ── Паспорт кабінету ────────────────────────────── */}
        <Section title="Паспорт кабінету">
          {classroom.passportUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
              <FileText size={20} className="text-primary shrink-0" />
              <span className="text-sm flex-1 truncate">passport-{classroom.number}.pdf</span>
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
                    {deletePassport.isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
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
                    <AlertDialogAction onClick={() => deletePassport.mutate()} className="bg-destructive hover:bg-destructive/90">
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
        </Section>

        {/* ── Основна інформація ──────────────────────────── */}
        <Section title="Основна інформація">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="Номер" value={`№${classroom.number}`} />
            <InfoRow label="Оновлено" value={formatDate(classroom.updatedAt)} />
            <InfoRow label="Назва" value={classroom.name} />
            <InfoRow label="Створено" value={formatDate(classroom.createdAt)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil size={13} />
            Редагувати
          </Button>
        </Section>

        {/* ── Завідувач ───────────────────────────────────── */}
        {classroom.teacher && (
          <Section title="Завідувач кабінету">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <UserCog size={14} className="text-muted-foreground shrink-0" />
              {getTeacherFullName(classroom.teacher)}
            </p>
          </Section>
        )}

        {/* ── Видалення (тільки для адміна) ──────────────── */}
        {canDelete && (
          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  Видалити кабінет
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити кабінет №{classroom.number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Разом з кабінетом будуть видалені всі {sortedPhotos.length} фото
                    {classroom.passportUrl ? ' та паспорт' : ''} з Google Drive.
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
        )}

      </div>

      <ClassroomFormDialog open={editOpen} onClose={() => setEditOpen(false)} classroom={classroom} />
    </>
  )
}
