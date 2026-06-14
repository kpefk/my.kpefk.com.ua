'use client'

import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import type { ParentInfoDto, UpdateParentInfoPayload } from '../types'

const UA_PHONE = /^(\+?38)?0\d{9}$/

const phoneSchema = z
  .string()
  .regex(UA_PHONE, 'Формат: +380XXXXXXXXX або 0XXXXXXXXX')
  .or(z.literal(''))
  .optional()

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

interface ParentInfoFormProps {
  initial: ParentInfoDto | null
  onSave: (data: UpdateParentInfoPayload) => void
  isSaving: boolean
  /** When true only notes field is rendered (Notes tab) */
  notesOnly?: boolean
}

export function ParentInfoForm({ initial, onSave, isSaving, notesOnly = false }: ParentInfoFormProps) {
  const form = useForm({
    defaultValues: {
      motherFullName: initial?.motherFullName ?? '',
      motherPhone: initial?.motherPhone ?? '',
      motherWorkplace: initial?.motherWorkplace ?? '',
      fatherFullName: initial?.fatherFullName ?? '',
      fatherPhone: initial?.fatherPhone ?? '',
      fatherWorkplace: initial?.fatherWorkplace ?? '',
      guardianFullName: initial?.guardianFullName ?? '',
      guardianPhone: initial?.guardianPhone ?? '',
      guardianWorkplace: initial?.guardianWorkplace ?? '',
      guardianRelation: initial?.guardianRelation ?? '',
      address: initial?.address ?? '',
      notes: initial?.notes ?? '',
    },
    onSubmit: ({ value }) => {
      const payload: UpdateParentInfoPayload = {}
      for (const [k, v] of Object.entries(value)) {
        // send empty string as undefined to clear field
        if (v !== '') (payload as Record<string, string>)[k] = v
      }
      onSave(payload)
    },
  })

  // Reset when a different student opens
  useEffect(() => {
    form.reset({
      motherFullName: initial?.motherFullName ?? '',
      motherPhone: initial?.motherPhone ?? '',
      motherWorkplace: initial?.motherWorkplace ?? '',
      fatherFullName: initial?.fatherFullName ?? '',
      fatherPhone: initial?.fatherPhone ?? '',
      fatherWorkplace: initial?.fatherWorkplace ?? '',
      guardianFullName: initial?.guardianFullName ?? '',
      guardianPhone: initial?.guardianPhone ?? '',
      guardianWorkplace: initial?.guardianWorkplace ?? '',
      guardianRelation: initial?.guardianRelation ?? '',
      address: initial?.address ?? '',
      notes: initial?.notes ?? '',
    })
  }, [initial?.studentId])  // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = form.state.isDirty

  if (notesOnly) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
        className="space-y-4"
      >
        {isDirty && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            Є незбережені зміни
          </p>
        )}
        <form.Field name="notes">
          {(field) => (
            <Textarea
              rows={8}
              placeholder="Нотатки керівника групи (не видно студентам)…"
              value={field.state.value}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
              className="resize-none"
            />
          )}
        </form.Field>
        <Button type="submit" disabled={isSaving || !isDirty} size="sm">
          {isSaving ? 'Збереження…' : 'Зберегти нотатки'}
        </Button>
      </form>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="space-y-6"
    >
      {isDirty && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          Є незбережені зміни
        </p>
      )}

      <Section title="Мати">
        <form.Field name="motherFullName">
          {(field) => (
            <Field label="ПІБ матері">
              <Input
                placeholder="Іваненко Ганна Петрівна"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
        <form.Field
          name="motherPhone"
          validators={{ onChange: ({ value }) => phoneSchema.safeParse(value).error?.issues[0]?.message }}
        >
          {(field) => (
            <Field label="Телефон" error={field.state.meta.errors[0] as string | undefined}>
              <Input
                placeholder="+380XXXXXXXXX"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={cn(field.state.meta.errors.length > 0 && 'border-destructive')}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="motherWorkplace">
          {(field) => (
            <Field label="Місце роботи" >
              <Input
                placeholder="ТОВ «…»"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="sm:col-span-2"
              />
            </Field>
          )}
        </form.Field>
      </Section>

      <Section title="Батько">
        <form.Field name="fatherFullName">
          {(field) => (
            <Field label="ПІБ батька">
              <Input
                placeholder="Іваненко Петро Іванович"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
        <form.Field
          name="fatherPhone"
          validators={{ onChange: ({ value }) => phoneSchema.safeParse(value).error?.issues[0]?.message }}
        >
          {(field) => (
            <Field label="Телефон" error={field.state.meta.errors[0] as string | undefined}>
              <Input
                placeholder="+380XXXXXXXXX"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={cn(field.state.meta.errors.length > 0 && 'border-destructive')}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="fatherWorkplace">
          {(field) => (
            <Field label="Місце роботи">
              <Input
                placeholder="ФОП Петренко"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
      </Section>

      <Section title="Опікун (якщо є)">
        <form.Field name="guardianFullName">
          {(field) => (
            <Field label="ПІБ опікуна">
              <Input
                placeholder="Коваленко Надія Степанівна"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
        <form.Field
          name="guardianPhone"
          validators={{ onChange: ({ value }) => phoneSchema.safeParse(value).error?.issues[0]?.message }}
        >
          {(field) => (
            <Field label="Телефон" error={field.state.meta.errors[0] as string | undefined}>
              <Input
                placeholder="+380XXXXXXXXX"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={cn(field.state.meta.errors.length > 0 && 'border-destructive')}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="guardianRelation">
          {(field) => (
            <Field label="Ступінь спорідненості">
              <Input
                placeholder="бабуся, дядько…"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="guardianWorkplace">
          {(field) => (
            <Field label="Місце роботи">
              <Input
                placeholder=""
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
      </Section>

      <form.Field name="address">
        {(field) => (
          <Field label="Домашня адреса">
            <Input
              placeholder="м. Луцьк, вул. …"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </Field>
        )}
      </form.Field>

      <Button type="submit" disabled={isSaving || !isDirty} size="sm">
        {isSaving ? 'Збереження…' : 'Зберегти зміни'}
      </Button>
    </form>
  )
}
