'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, FileText, Loader2, Plus, Trash2, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
} from '../api'
import { VARIANT_LABELS, type DiplomaVariant } from '../types'
import { TemplateEditorSheet } from './TemplateEditorSheet'

const VARIANTS: DiplomaVariant[] = ['EXAM', 'EDKI', 'DIPLOMA_WORK', 'DIPLOMA_PROJECT']

export function DiplomaTemplatesClient() {
  const { data: templates = [], isLoading } = useTemplates()
  const createMut = useCreateTemplate()
  const deleteMut = useDeleteTemplate()

  const [createOpen, setCreateOpen] = useState(false)
  const [editorId, setEditorId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [specialtyName, setSpecialtyName] = useState('')
  const [variant, setVariant] = useState<DiplomaVariant>('DIPLOMA_PROJECT')

  function handleCreate() {
    if (!name) return
    createMut.mutate(
      { name, specialtyName: specialtyName || undefined, variant },
      {
        onSuccess: (t) => {
          setCreateOpen(false)
          setName('')
          setSpecialtyName('')
          setEditorId(t.id)
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Шаблони дипломів</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            На спеціальність × варіант атестації: .docx-шаблони + структура ОК
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/diplomas/generate">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> До дипломів
            </Link>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Створити
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : templates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <FileText className="w-10 h-10 opacity-30" />
          <p className="text-sm">Немає шаблонів — створіть перший</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEditorId(t.id)}
                  className="text-left font-semibold hover:text-primary"
                >
                  {t.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Видалити шаблон «${t.name}»?`)) deleteMut.mutate(t.id)
                  }}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">{t.specialtyName ?? '—'}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{VARIANT_LABELS[t.variant]}</Badge>
                <Badge variant="secondary">{t.componentCount} ОК</Badge>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  {t.hasDiplomaDocx ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-muted-foreground/50" />}
                  Диплом
                </span>
                <span className="flex items-center gap-1">
                  {t.hasAddendumDocx ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-muted-foreground/50" />}
                  Додаток
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новий шаблон</DialogTitle>
            <DialogDescription>
              Шаблон диплома й додатка на спеціальність та варіант атестації.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Назва</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="122 Комп'ютерні науки — проєкт" />
            </div>
            <div className="space-y-1">
              <Label>Спеціальність (як у XML ЄДЕБО)</Label>
              <Input value={specialtyName} onChange={(e) => setSpecialtyName(e.target.value)} placeholder="Комп'ютерні науки" />
            </div>
            <div className="space-y-1">
              <Label>Варіант атестації</Label>
              <Select value={variant} onValueChange={(v) => setVariant(v as DiplomaVariant)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VARIANTS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {VARIANT_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Скасувати
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!name || createMut.isPending}>
              {createMut.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemplateEditorSheet templateId={editorId} onOpenChange={(o) => !o && setEditorId(null)} />
    </div>
  )
}
