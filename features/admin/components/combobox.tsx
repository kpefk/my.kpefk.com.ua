'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { UnlinkedStudentDto, UnlinkedTeacherDto } from '../types'

export interface ComboboxOption {
  id: string
  label: string
  sublabel?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  emptyText?: string
  loading?: boolean
  required?: boolean
  clearable?: boolean
}

/** Пошуковий випадний список (використовується при створенні акаунту та прив'язці викладача). */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Пошук…',
  emptyText = 'Нічого не знайдено',
  loading = false,
  required = false,
  clearable = false,
}: ComboboxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.id === value) ?? null

  const filtered = query.trim()
    ? options.filter((o) =>
        `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(query.toLowerCase())
      )
    : options

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (id: string) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (!open) setOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
    if (e.key === 'Enter') e.preventDefault()
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex items-center gap-2 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs cursor-text',
          open && 'ring-1 ring-ring'
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        {open ? (
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
            placeholder={selected ? selected.label : placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span className={cn('flex-1 truncate', !selected && 'text-muted-foreground')}>
            {loading ? 'Завантаження…' : selected ? selected.label : placeholder}
          </span>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {clearable && selected && !required && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
          <ChevronsUpDown size={14} className="text-muted-foreground" />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Завантаження…
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={cn(
                    'w-full flex items-start gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground',
                    value === opt.id && 'bg-accent/50'
                  )}
                >
                  <Check
                    size={14}
                    className={cn('mt-0.5 shrink-0', value === opt.id ? 'opacity-100' : 'opacity-0')}
                  />
                  <div className="min-w-0">
                    <div className="truncate">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-xs text-muted-foreground truncate">{opt.sublabel}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function toStudentOptions(list: UnlinkedStudentDto[]): ComboboxOption[] {
  return list.map((s) => ({
    id: s.id,
    label: s.personFIO,
    sublabel: [s.courseName, s.groupName].filter(Boolean).join(', ') || undefined,
  }))
}

export function toTeacherOptions(list: UnlinkedTeacherDto[]): ComboboxOption[] {
  return list.map((t) => ({
    id: t.id,
    label: [t.lastName, t.firstName, t.middleName].filter(Boolean).join(' '),
    sublabel: t.positionName ?? undefined,
  }))
}
