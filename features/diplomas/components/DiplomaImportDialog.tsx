'use client'

import { useRef, useState } from 'react'
import { FileUp, Loader2, Upload } from 'lucide-react'

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

import { useImportCommit, useImportPreview } from '../api'
import type { ImportPreview } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (batchId: string) => void
}

export function DiplomaImportDialog({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)

  const previewMut = useImportPreview()
  const commitMut = useImportCommit()

  function reset() {
    setFile(null)
    setName('')
    setAcademicYear('')
    setPreview(null)
  }

  function handleFile(f: File | null) {
    setFile(f)
    setPreview(null)
    if (f) {
      if (!name) setName(f.name.replace(/\.xml$/i, ''))
      previewMut.mutate(f, { onSuccess: setPreview })
    }
  }

  function handleCommit() {
    if (!file || !name) return
    commitMut.mutate(
      { file, name, academicYear: academicYear || undefined },
      {
        onSuccess: (r) => {
          onImported(r.batchId)
          onOpenChange(false)
          reset()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Імпорт замовлення дипломів (XML ЄДЕБО)</DialogTitle>
          <DialogDescription>
            Завантажте XML із модуля замовлення документів ЄДЕБО.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-border py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <FileUp className="w-6 h-6" />
            <span className="text-sm">{file ? file.name : 'Оберіть XML-файл ЄДЕБО'}</span>
          </button>

          {previewMut.isPending && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Читання…
            </p>
          )}

          {preview && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-semibold">Знайдено дипломів: {preview.count}</p>
              <div className="flex flex-wrap gap-1.5">
                {preview.specialties.map((s) => (
                  <span
                    key={s.code + s.name}
                    className="text-xs rounded-full bg-background border border-border px-2 py-0.5"
                  >
                    {s.name} — {s.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Назва партії</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Випуск 2026" />
            </div>
            <div className="space-y-1">
              <Label>Навчальний рік</Label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button
            size="sm"
            onClick={handleCommit}
            disabled={!file || !name || !preview || commitMut.isPending}
          >
            {commitMut.isPending ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1.5" />
            )}
            Імпортувати{preview ? ` (${preview.count})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
