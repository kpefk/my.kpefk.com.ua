'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
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

import { useCreateCurriculum, useEducationalPrograms } from '../api'
import {
  ADMISSION_BASIS_LABELS,
  EDUCATION_FORM_LABELS,
  type AdmissionBasis,
  type EducationForm,
  type EducationalProgramDto,
} from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * `specialty.code` is either a proper academic code ("F3", "121")
 * or a technical EDEBO fallback ("EDEBO-2550") that must not appear in the UI.
 */
function formatSpecialtyCode(code: string): string {
  return code.startsWith('EDEBO-') ? '' : code
}

function toProgramOptions(programs: EducationalProgramDto[]): ComboboxOption[] {
  return programs
    .filter((p) => p.isActive)
    .map((p) => {
      const code = formatSpecialtyCode(p.specialty.code)
      const line1 = code
        ? `${code} ${p.specialty.name} (ОПП: ${p.name})`
        : `${p.specialty.name} (ОПП: ${p.name})`
      return {
        id: p.id,
        label: line1,
        sublabel: p.qualificationLevel ?? undefined,
      }
    })
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface CreateCurriculumDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateCurriculumDialog({ open, onClose }: CreateCurriculumDialogProps) {
  const [programId, setProgramId] = useState('')
  const [educationForm, setEducationForm] = useState<EducationForm>('FULL_TIME')
  const [admissionBasis, setAdmissionBasis] = useState<AdmissionBasis>('AFTER_9TH_GRADE')
  const [entryYear, setEntryYear] = useState(String(new Date().getFullYear()))
  const [studyDurationMonths, setStudyDurationMonths] = useState('46')
  const [totalEcts, setTotalEcts] = useState('180')

  // Fetch programs when the dialog is open — same pattern as useUnlinkedStudents in CreateUserDialog
  const { data: programs = [], isFetching: programsLoading } = useEducationalPrograms()

  const programOptions = toProgramOptions(programs)

  const createCurriculum = useCreateCurriculum()

  useEffect(() => {
    if (open) {
      setProgramId('')
      setEducationForm('FULL_TIME')
      setAdmissionBasis('AFTER_9TH_GRADE')
      setEntryYear(String(new Date().getFullYear()))
      setStudyDurationMonths('46')
      setTotalEcts('180')
    }
  }, [open])

  const isValid =
    programId !== '' &&
    Number(entryYear) >= 2000 &&
    Number(studyDurationMonths) > 0 &&
    Number(totalEcts) > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    createCurriculum.mutate(
      {
        programId,
        educationForm,
        admissionBasis,
        entryYear: Number(entryYear),
        studyDurationMonths: Number(studyDurationMonths),
        totalEcts: Number(totalEcts),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Новий навчальний план</DialogTitle>
          <DialogDescription>
            Навчальний план є унікальним для комбінації: ОПП, форма навчання, підстава, рік вступу.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Program — searchable combobox, same pattern as student/teacher linking */}
          <Field>
            <FieldLabel>
              Освітня програма (ОПП) <span className="text-destructive">*</span>
            </FieldLabel>
            <Combobox
              options={programOptions}
              value={programId}
              onChange={setProgramId}
              placeholder="Пошук за назвою програми або спеціальністю…"
              emptyText="Освітніх програм не знайдено. Запустіть синхронізацію з ЄДЕБО."
              loading={programsLoading}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Education form */}
            <Field>
              <FieldLabel htmlFor="cp-form">
                Форма навчання <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={educationForm}
                onValueChange={(v) => setEducationForm(v as EducationForm)}
              >
                <SelectTrigger id="cp-form" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EDUCATION_FORM_LABELS) as Array<keyof typeof EDUCATION_FORM_LABELS>).map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {EDUCATION_FORM_LABELS[k]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </Field>

            {/* Admission basis */}
            <Field>
              <FieldLabel htmlFor="cp-basis">
                Підстава вступу <span className="text-destructive">*</span>
              </FieldLabel>
              <Select
                value={admissionBasis}
                onValueChange={(v) => setAdmissionBasis(v as AdmissionBasis)}
              >
                <SelectTrigger id="cp-basis" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(ADMISSION_BASIS_LABELS) as Array<keyof typeof ADMISSION_BASIS_LABELS>
                  ).map((k) => (
                    <SelectItem key={k} value={k}>
                      {ADMISSION_BASIS_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Entry year */}
            <Field>
              <FieldLabel htmlFor="cp-year">
                Рік вступу <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="cp-year"
                type="number"
                min={2000}
                max={2100}
                value={entryYear}
                onChange={(e) => setEntryYear(e.target.value)}
                className="bg-background font-mono"
              />
            </Field>

            {/* Duration */}
            <Field>
              <FieldLabel htmlFor="cp-duration">
                Тривалість (міс.) <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="cp-duration"
                type="number"
                min={6}
                max={72}
                value={studyDurationMonths}
                onChange={(e) => setStudyDurationMonths(e.target.value)}
                className="bg-background font-mono"
              />
            </Field>

            {/* Total ECTS */}
            <Field>
              <FieldLabel htmlFor="cp-ects">
                ЄКТС (загалом) <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="cp-ects"
                type="number"
                min={1}
                max={999}
                step={0.5}
                value={totalEcts}
                onChange={(e) => setTotalEcts(e.target.value)}
                className="bg-background font-mono"
              />
            </Field>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={!isValid || createCurriculum.isPending}>
              {createCurriculum.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Створити'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
