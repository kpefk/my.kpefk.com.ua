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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { useSubmitSurvey } from '../api'
import type { StudentSurveyDto, SubmitAnswerInput } from '../types'

interface SurveyTakeFormProps {
  survey: StudentSurveyDto | null
  onClose: () => void
}

interface DraftAnswer {
  ratingValue?: number
  boolValue?: boolean
  textValue?: string
}

export function SurveyTakeForm({ survey, onClose }: SurveyTakeFormProps) {
  const [draft, setDraft] = useState<Record<string, DraftAnswer>>({})
  const submit = useSubmitSurvey()

  function setAnswer(questionId: string, value: DraftAnswer) {
    setDraft((prev) => ({ ...prev, [questionId]: value }))
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
    if (q.type === 'RATING') return a.ratingValue === undefined
    if (q.type === 'YES_NO') return a.boolValue === undefined
    return !a.textValue || a.textValue.trim() === ''
  })

  function handleSubmit() {
    if (!survey) return
    const answers: SubmitAnswerInput[] = survey.questions.flatMap((q): SubmitAnswerInput[] => {
      const a = draft[q.id]
      if (!a) return []
      if (q.type === 'RATING' && a.ratingValue !== undefined) {
        return [{ questionId: q.id, ratingValue: a.ratingValue }]
      }
      if (q.type === 'YES_NO' && a.boolValue !== undefined) {
        return [{ questionId: q.id, boolValue: a.boolValue }]
      }
      if (q.type === 'TEXT' && a.textValue && a.textValue.trim() !== '') {
        return [{ questionId: q.id, textValue: a.textValue.trim() }]
      }
      return []
    })
    submit.mutate(
      { surveyId: survey.id, answers },
      { onSuccess: () => handleClose() },
    )
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
          {survey.questions.map((q, idx) => (
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
                        draft[q.id]?.ratingValue === v
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted',
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'YES_NO' && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={draft[q.id]?.boolValue === true ? 'default' : 'outline'}
                    onClick={() => setAnswer(q.id, { boolValue: true })}
                  >
                    Так
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={draft[q.id]?.boolValue === false ? 'destructive' : 'outline'}
                    onClick={() => setAnswer(q.id, { boolValue: false })}
                  >
                    Ні
                  </Button>
                </div>
              )}

              {q.type === 'TEXT' && (
                <Textarea
                  value={draft[q.id]?.textValue ?? ''}
                  onChange={(e) => setAnswer(q.id, { textValue: e.target.value })}
                  placeholder="Ваша відповідь..."
                  rows={3}
                  maxLength={2000}
                />
              )}
            </div>
          ))}
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
