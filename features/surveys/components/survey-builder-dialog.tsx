'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react'

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
import { useGroups } from '@/features/groups/api'
import { DEFAULT_GROUP_FILTERS } from '@/features/groups/types'
import { cn } from '@/lib/utils'

import { useCreateSurvey, useSetSurveyQuestions, useUpdateSurvey } from '../api'
import type { SurveyAdminDto, SurveyQuestionInput, SurveyQuestionType } from '../types'
import { QUESTION_TYPE_LABELS } from '../types'

interface SurveyBuilderDialogProps {
  open: boolean
  onClose: () => void
  /** null = створення нової кампанії */
  survey: SurveyAdminDto | null
}

interface DraftQuestion {
  text: string
  type: SurveyQuestionType
  required: boolean
}

export function SurveyBuilderDialog({ open, onClose, survey }: SurveyBuilderDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [groupIds, setGroupIds] = useState<Set<string>>(new Set())
  const [questions, setQuestions] = useState<DraftQuestion[]>([])

  const { data: groups = [] } = useGroups(DEFAULT_GROUP_FILTERS)
  const createMut = useCreateSurvey()
  const updateMut = useUpdateSurvey()
  const setQuestionsMut = useSetSurveyQuestions()

  useEffect(() => {
    if (!open) return
    setTitle(survey?.title ?? '')
    setDescription(survey?.description ?? '')
    setIsAnonymous(survey?.isAnonymous ?? true)
    setGroupIds(new Set(survey?.targetGroups.map((t) => t.groupId) ?? []))
    setQuestions(
      survey?.questions.map((q) => ({ text: q.text, type: q.type, required: q.required })) ?? [],
    )
  }, [open, survey])

  const pending = createMut.isPending || updateMut.isPending || setQuestionsMut.isPending
  const validQuestions = questions.filter((q) => q.text.trim() !== '')
  const canSave = title.trim() !== ''

  function toggleGroup(id: string) {
    setGroupIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function updateQuestion(idx: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const a = prev[idx]
      const b = prev[target]
      if (a === undefined || b === undefined) return prev
      const next = [...prev]
      next[idx] = b
      next[target] = a
      return next
    })
  }

  async function handleSave() {
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      isAnonymous,
      groupIds: [...groupIds],
    }
    const questionsPayload: SurveyQuestionInput[] = validQuestions.map((q) => ({
      text: q.text.trim(),
      type: q.type,
      required: q.required,
    }))

    if (survey) {
      await updateMut.mutateAsync({ id: survey.id, ...payload })
      await setQuestionsMut.mutateAsync({ id: survey.id, questions: questionsPayload })
    } else {
      const created = await createMut.mutateAsync(payload)
      if (questionsPayload.length > 0) {
        await setQuestionsMut.mutateAsync({ id: created.id, questions: questionsPayload })
      }
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{survey ? 'Редагувати кампанію' : 'Нова кампанія опитування'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="survey-title">Назва *</Label>
            <Input
              id="survey-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Напр.: Якість освітнього процесу, I семестр 2026-2027"
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="survey-desc">Опис</Label>
            <Textarea
              id="survey-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={2000}
            />
          </div>

          <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Анонімне опитування</p>
              <p className="text-xs text-muted-foreground">
                Відповіді не привʼязуються до студента (трекається лише факт проходження)
              </p>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
          </label>

          <div className="space-y-2">
            <Label>
              Цільові групи{' '}
              <span className="text-xs text-muted-foreground font-normal">
                (нічого не вибрано = всі студенти)
              </span>
            </Label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-lg border p-2">
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs border transition-colors',
                    groupIds.has(g.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted',
                  )}
                >
                  {g.name}
                </button>
              ))}
              {groups.length === 0 && (
                <span className="text-xs text-muted-foreground">Групи не завантажено</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Питання ({validQuestions.length})</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setQuestions((prev) => [...prev, { text: '', type: 'RATING', required: true }])
                }
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Додати питання
              </Button>
            </div>

            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={idx} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground mt-2.5 w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      value={q.text}
                      onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                      placeholder="Текст питання..."
                      maxLength={1000}
                    />
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        type="button" size="icon" variant="ghost" className="h-9 w-7"
                        onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button" size="icon" variant="ghost" className="h-9 w-7"
                        onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="h-9 w-7 text-destructive"
                        onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-7">
                    <select
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(idx, { type: e.target.value as SurveyQuestionType })
                      }
                      className="h-7 text-xs rounded-md border border-border bg-background px-2 cursor-pointer"
                    >
                      {(Object.keys(QUESTION_TYPE_LABELS) as SurveyQuestionType[]).map((t) => (
                        <option key={t} value={t}>
                          {QUESTION_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                        className="rounded border-border"
                      />
                      Обовʼязкове
                    </label>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Додайте хоча б одне питання, щоб можна було відкрити опитування
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={!canSave || pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Зберегти чернетку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
