'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { useSubmitSurvey } from '../api'
import { CHOICE_QUESTION_TYPES, type StudentSurveyDto, type SubmitAnswerInput } from '../types'

interface SurveyTakeFormProps {
  survey: StudentSurveyDto | null
  onClose: () => void
}

interface DraftAnswer {
  ratingValue?: number
  selectedOptionIds?: string[]
  textValue?: string
}

export function SurveyTakeForm({ survey, onClose }: SurveyTakeFormProps) {
  const [draft, setDraft] = useState<Record<string, DraftAnswer>>({})
  const submit = useSubmitSurvey()

  function setAnswer(questionId: string, value: DraftAnswer) {
    setDraft((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleMulti(questionId: string, optionId: string) {
    setDraft((prev) => {
      const current = prev[questionId]?.selectedOptionIds ?? []
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return { ...prev, [questionId]: { selectedOptionIds: next } }
    })
  }

  function handleClose() {
    setDraft({})
    onClose()
  }

  if (!survey) return null

  const missingRequired = survey.questions.filter((q) => {
    if (!q.required) return false
    const a = draft[q.id]
    if (!a) return true
    if (q.type === 'RATING' || q.type === 'SCALE') return a.ratingValue === undefined
    if (CHOICE_QUESTION_TYPES.includes(q.type)) {
      return !a.selectedOptionIds || a.selectedOptionIds.length === 0
    }
    return !a.textValue || a.textValue.trim() === ''
  })

  function handleSubmit() {
    if (!survey) return
    const answers: SubmitAnswerInput[] = survey.questions.flatMap((q): SubmitAnswerInput[] => {
      const a = draft[q.id]
      if (!a) return []
      if ((q.type === 'RATING' || q.type === 'SCALE') && a.ratingValue !== undefined) {
        return [{ questionId: q.id, ratingValue: a.ratingValue }]
      }
      if (CHOICE_QUESTION_TYPES.includes(q.type) && a.selectedOptionIds?.length) {
        return [{ questionId: q.id, selectedOptionIds: a.selectedOptionIds }]
      }
      if (
        (q.type === 'TEXT' || q.type === 'PARAGRAPH') &&
        a.textValue &&
        a.textValue.trim() !== ''
      ) {
        return [{ questionId: q.id, textValue: a.textValue.trim() }]
      }
      return []
    })
    submit.mutate({ surveyId: survey.id, answers }, { onSuccess: () => handleClose() })
  }

  return (
    <Dialog open={!!survey} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{survey.title}</DialogTitle>
        </DialogHeader>

        {survey.description && (
          <p className="text-sm text-muted-foreground">{survey.description}</p>
        )}

        {survey.isAnonymous && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Опитування анонімне: відповіді не привʼязуються до вашого імені.
          </div>
        )}

        <div className="space-y-5">
          {survey.questions.map((q, idx) => {
            const a = draft[q.id]
            return (
              <div key={q.id} className="space-y-2">
                <Label className="leading-snug">
                  {idx + 1}. {q.text}
                  {q.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>

                {q.type === 'RATING' && (
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAnswer(q.id, { ratingValue: v })}
                        className={cn(
                          'w-10 h-10 rounded-lg border text-sm font-semibold transition-colors',
                          a?.ratingValue === v
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:bg-muted',
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'SCALE' && (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(
                        { length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 },
                        (_, i) => (q.scaleMin ?? 1) + i,
                      ).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAnswer(q.id, { ratingValue: v })}
                          className={cn(
                            'w-9 h-9 rounded-lg border text-sm font-semibold transition-colors',
                            a?.ratingValue === v
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:bg-muted',
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {(q.scaleMinLabel || q.scaleMaxLabel) && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{q.scaleMinLabel}</span>
                        <span>{q.scaleMaxLabel}</span>
                      </div>
                    )}
                  </div>
                )}

                {q.type === 'SINGLE_CHOICE' && (
                  <div className="space-y-1.5">
                    {q.options.map((o) => (
                      <label
                        key={o.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={a?.selectedOptionIds?.[0] === o.id}
                          onChange={() => setAnswer(q.id, { selectedOptionIds: [o.id] })}
                          className="accent-primary"
                        />
                        {o.text}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'MULTI_CHOICE' && (
                  <div className="space-y-1.5">
                    {q.options.map((o) => (
                      <label
                        key={o.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={a?.selectedOptionIds?.includes(o.id) ?? false}
                          onChange={() => toggleMulti(q.id, o.id)}
                          className="rounded border-border accent-primary"
                        />
                        {o.text}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'DROPDOWN' && (
                  <select
                    value={a?.selectedOptionIds?.[0] ?? ''}
                    onChange={(e) =>
                      setAnswer(q.id, {
                        selectedOptionIds: e.target.value ? [e.target.value] : [],
                      })
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="">— Оберіть —</option>
                    {q.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.text}
                      </option>
                    ))}
                  </select>
                )}

                {q.type === 'TEXT' && (
                  <Input
                    value={a?.textValue ?? ''}
                    onChange={(e) => setAnswer(q.id, { textValue: e.target.value })}
                    placeholder="Ваша відповідь..."
                    maxLength={2000}
                  />
                )}

                {q.type === 'PARAGRAPH' && (
                  <Textarea
                    value={a?.textValue ?? ''}
                    onChange={(e) => setAnswer(q.id, { textValue: e.target.value })}
                    placeholder="Ваша відповідь..."
                    rows={3}
                    maxLength={2000}
                  />
                )}
              </div>
            )
          })}
        </div>

        <DialogFooter className="flex items-center gap-2">
          {missingRequired.length > 0 && (
            <Badge variant="outline" className="mr-auto">
              Обовʼязкових без відповіді: {missingRequired.length}
            </Badge>
          )}
          <Button variant="outline" onClick={handleClose}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={missingRequired.length > 0 || submit.isPending}>
            {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Надіслати
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
