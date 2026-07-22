'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  CircleDot,
  Copy,
  List,
  ListChecks,
  Loader2,
  type LucideIcon,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
  Type,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useGroups } from '@/features/groups/api'
import { DEFAULT_GROUP_FILTERS } from '@/features/groups/types'
import { cn } from '@/lib/utils'

import { useCreateSurvey, useSetSurveyQuestions, useUpdateSurvey } from '../api'
import type { SurveyAdminDto, SurveyQuestionInput, SurveyQuestionType } from '../types'
import {
  CHOICE_QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  SCALE_MAX_ALLOWED,
  SCALE_MIN_ALLOWED,
  SURVEY_MAX_OPTIONS,
} from '../types'

interface SurveyBuilderDialogProps {
  open: boolean
  onClose: () => void
  survey: SurveyAdminDto | null
}

interface DraftQuestion {
  text: string
  type: SurveyQuestionType
  required: boolean
  options: string[]
  scaleMin: number
  scaleMax: number
  scaleMinLabel: string
  scaleMaxLabel: string
}

const TYPE_ICONS: Record<SurveyQuestionType, LucideIcon> = {
  RATING: Star,
  TEXT: Type,
  PARAGRAPH: AlignLeft,
  SINGLE_CHOICE: CircleDot,
  MULTI_CHOICE: ListChecks,
  DROPDOWN: List,
  SCALE: SlidersHorizontal,
}

const TYPE_ORDER: SurveyQuestionType[] = [
  'RATING',
  'SCALE',
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'DROPDOWN',
  'TEXT',
  'PARAGRAPH',
]

function newQuestion(type: SurveyQuestionType): DraftQuestion {
  return {
    text: '',
    type,
    required: true,
    options: ['', ''],
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: '',
    scaleMaxLabel: '',
  }
}

function questionError(question: DraftQuestion): string | null {
  if (question.text.trim() === '') {
    return 'Порожній текст питання'
  }

  if (CHOICE_QUESTION_TYPES.includes(question.type)) {
    const options = question.options
      .map((option) => option.trim())
      .filter(Boolean)

    if (options.length < 2) {
      return 'Потрібно щонайменше 2 варіанти'
    }
  }

  if (question.type === 'SCALE' && question.scaleMin >= question.scaleMax) {
    return 'Некоректні межі шкали'
  }

  return null
}

export function SurveyBuilderDialog({
  open,
  onClose,
  survey,
}: SurveyBuilderDialogProps) {
  const [tab, setTab] = useState('basics')
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

    setTab('basics')
    setTitle(survey?.title ?? '')
    setDescription(survey?.description ?? '')
    setIsAnonymous(survey?.isAnonymous ?? true)
    setGroupIds(new Set(survey?.targetGroups.map((target) => target.groupId) ?? []))

    setQuestions(
      survey?.questions.map((question) => ({
        text: question.text,
        type: question.type,
        required: question.required,
        options:
          question.options.length > 0
            ? question.options.map((option) => option.text)
            : ['', ''],
        scaleMin: question.scaleMin ?? 1,
        scaleMax: question.scaleMax ?? 5,
        scaleMinLabel: question.scaleMinLabel ?? '',
        scaleMaxLabel: question.scaleMaxLabel ?? '',
      })) ?? [],
    )
  }, [open, survey])

  const pending =
    createMut.isPending || updateMut.isPending || setQuestionsMut.isPending

  const nonEmptyQuestions = questions.filter(
    (question) => question.text.trim() !== '',
  )

  const firstError = useMemo(() => {
    for (const question of nonEmptyQuestions) {
      const error = questionError(question)

      if (error) {
        return `«${question.text.trim()}» — ${error.toLowerCase()}`
      }
    }

    return null
  }, [nonEmptyQuestions])

  const canSave = title.trim() !== '' && firstError === null

  function toggleGroup(id: string) {
    setGroupIds((previous) => {
      const next = new Set(previous)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((previous) =>
      previous.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    )
  }

  function duplicateQuestion(index: number) {
    setQuestions((previous) => {
      const source = previous[index]

      if (!source) return previous

      const copy: DraftQuestion = {
        ...source,
        options: [...source.options],
      }

      return [
        ...previous.slice(0, index + 1),
        copy,
        ...previous.slice(index + 1),
      ]
    })
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((previous) => {
      const targetIndex = index + direction

      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous
      }

      const current = previous[index]
      const target = previous[targetIndex]

      if (!current || !target) return previous

      const next = [...previous]
      next[index] = target
      next[targetIndex] = current

      return next
    })
  }

  function removeQuestion(index: number) {
    setQuestions((previous) =>
      previous.filter((_, questionIndex) => questionIndex !== index),
    )
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, index) =>
                index === optionIndex ? value : option,
              ),
            }
          : question,
      ),
    )
  }

  function addOption(questionIndex: number) {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex && question.options.length < SURVEY_MAX_OPTIONS
          ? { ...question, options: [...question.options, ''] }
          : question,
      ),
    )
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex && question.options.length > 2
          ? {
              ...question,
              options: question.options.filter(
                (_, index) => index !== optionIndex,
              ),
            }
          : question,
      ),
    )
  }

  async function handleSave() {
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      isAnonymous,
      groupIds: [...groupIds],
    }

    const questionsPayload: SurveyQuestionInput[] = nonEmptyQuestions.map(
      (question) => {
        const result: SurveyQuestionInput = {
          text: question.text.trim(),
          type: question.type,
          required: question.required,
        }

        if (CHOICE_QUESTION_TYPES.includes(question.type)) {
          result.options = question.options
            .map((option) => option.trim())
            .filter(Boolean)
        }

        if (question.type === 'SCALE') {
          result.scaleMin = question.scaleMin
          result.scaleMax = question.scaleMax
          result.scaleMinLabel = question.scaleMinLabel.trim() || undefined
          result.scaleMaxLabel = question.scaleMaxLabel.trim() || undefined
        }

        return result
      },
    )

    if (survey) {
      await updateMut.mutateAsync({
        id: survey.id,
        ...payload,
      })

      await setQuestionsMut.mutateAsync({
        id: survey.id,
        questions: questionsPayload,
      })
    } else {
      const created = await createMut.mutateAsync(payload)

      if (questionsPayload.length > 0) {
        await setQuestionsMut.mutateAsync({
          id: created.id,
          questions: questionsPayload,
        })
      }
    }

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[88vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>
            {survey ? 'Редагувати кампанію' : 'Нова кампанія опитування'}
          </DialogTitle>

          <DialogDescription>
            Налаштуйте основні параметри та додайте питання. Зберігається як
            чернетка — відкриєте для студентів окремою дією.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-6 mt-4 self-start">
            <TabsTrigger value="basics">Основне</TabsTrigger>
            <TabsTrigger value="questions">
              Питання ({nonEmptyQuestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="basics"
            className="mt-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="survey-title">Назва *</Label>

              <Input
                id="survey-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Напр.: Якість освітнього процесу, I семестр 2026-2027"
                maxLength={300}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="survey-description">Опис</Label>

              <Textarea
                id="survey-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Короткий контекст для студентів (необовʼязково)"
                rows={2}
                maxLength={2000}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAnonymous((value) => !value)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors',
                isAnonymous
                  ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : '',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <ShieldCheck
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isAnonymous
                      ? 'text-emerald-500'
                      : 'text-muted-foreground',
                  )}
                />

                <div className="min-w-0">
                  <p className="text-sm font-medium">Анонімне опитування</p>
                  <p className="text-xs text-muted-foreground">
                    Відповіді не привʼязуються до студента — трекається лише
                    факт проходження.
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'relative ml-3 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                  isAnonymous ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                    isAnonymous ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>
                  Цільові групи{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    (
                    {groupIds.size === 0
                      ? 'усі студенти'
                      : `обрано ${groupIds.size}`}
                    )
                  </span>
                </Label>

                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() =>
                      setGroupIds(new Set(groups.map((group) => group.id)))
                    }
                    disabled={groups.length === 0}
                  >
                    Обрати всі
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setGroupIds(new Set())}
                    disabled={groupIds.size === 0}
                  >
                    Очистити
                  </Button>
                </div>
              </div>

              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border p-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs transition-colors',
                      groupIds.has(group.id)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-muted',
                    )}
                  >
                    {group.name}
                  </button>
                ))}

                {groups.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Групи не завантажено
                  </span>
                )}
              </div>

              {groupIds.size === 0 && (
                <p className="text-xs text-muted-foreground">
                  Нічого не вибрано — опитування побачать усі активні студенти.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="questions"
            className="mt-0 flex-1 space-y-3 overflow-y-auto px-6 py-4"
          >
            {questions.map((question, index) => {
              const error =
                question.text.trim() !== '' ? questionError(question) : null
              const Icon = TYPE_ICONS[question.type]

              return (
                <div
                  key={index}
                  className={cn(
                    'space-y-3 rounded-lg border bg-card p-3',
                    error ? 'border-destructive/50' : '',
                  )}
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 max-sm:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium">
                      {index + 1}
                    </span>

                    <Input
                      value={question.text}
                      onChange={(event) =>
                        updateQuestion(index, { text: event.target.value })
                      }
                      placeholder="Текст питання..."
                      maxLength={1000}
                      className="min-w-0"
                    />

                    <div className="flex shrink-0 gap-0.5 max-sm:col-span-2 max-sm:justify-self-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-7"
                        title="Дублювати"
                        onClick={() => duplicateQuestion(index)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-7"
                        title="Вгору"
                        onClick={() => moveQuestion(index, -1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-7"
                        title="Вниз"
                        onClick={() => moveQuestion(index, 1)}
                        disabled={index === questions.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-7 text-destructive"
                        title="Видалити"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:pl-8">
                    <Select
                      value={question.type}
                      onValueChange={(value) =>
                        updateQuestion(index, {
                          type: value as SurveyQuestionType,
                        })
                      }
                    >
                      <SelectTrigger size="sm" className="w-52">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {TYPE_ORDER.map((type) => {
                          const TypeIcon = TYPE_ICONS[type]

                          return (
                            <SelectItem key={type} value={type}>
                              <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              {QUESTION_TYPE_LABELS[type]}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>

                    <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(event) =>
                          updateQuestion(index, {
                            required: event.target.checked,
                          })
                        }
                        className="rounded border-border accent-primary"
                      />
                      Обовʼязкове
                    </label>

                    {error && (
                      <span className="text-xs text-destructive sm:ml-auto">
                        {error}
                      </span>
                    )}
                  </div>

                  {CHOICE_QUESTION_TYPES.includes(question.type) && (
                    <div className="space-y-1.5 sm:pl-8">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex min-w-0 items-center gap-2"
                        >
                          <Input
                            value={option}
                            onChange={(event) =>
                              updateOption(index, optionIndex, event.target.value)
                            }
                            placeholder={`Варіант ${optionIndex + 1}`}
                            maxLength={500}
                            className="h-8 min-w-0 text-sm"
                          />

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-7 shrink-0 text-destructive"
                            onClick={() => removeOption(index, optionIndex)}
                            disabled={question.options.length <= 2}
                            title="Видалити варіант"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => addOption(index)}
                        disabled={question.options.length >= SURVEY_MAX_OPTIONS}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Додати варіант
                      </Button>
                    </div>
                  )}

                  {question.type === 'SCALE' && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:pl-8">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Від{' '}
                        <span className="font-medium text-foreground">
                          {SCALE_MIN_ALLOWED}
                        </span>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs">
                        До

                        <select
                          value={question.scaleMax}
                          onChange={(event) =>
                            updateQuestion(index, {
                              scaleMax: Number(event.target.value),
                            })
                          }
                          className="h-7 rounded-md border border-border bg-background px-2 text-xs"
                        >
                          {Array.from(
                            { length: SCALE_MAX_ALLOWED - 1 },
                            (_, value) => value + 2,
                          ).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>

                      <Input
                        value={question.scaleMinLabel}
                        onChange={(event) =>
                          updateQuestion(index, {
                            scaleMinLabel: event.target.value,
                          })
                        }
                        placeholder="Підпис мінімуму (необовʼязково)"
                        maxLength={100}
                        className="h-8 text-sm"
                      />

                      <Input
                        value={question.scaleMaxLabel}
                        onChange={(event) =>
                          updateQuestion(index, {
                            scaleMaxLabel: event.target.value,
                          })
                        }
                        placeholder="Підпис максимуму (необовʼязково)"
                        maxLength={100}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {questions.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
                <ListChecks className="h-8 w-8 text-muted-foreground/40" />

                <p className="text-sm text-muted-foreground">
                  Ще немає питань. Додайте перше, обравши тип нижче.
                </p>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Додати питання
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-56">
                {TYPE_ORDER.map((type) => {
                  const TypeIcon = TYPE_ICONS[type]

                  return (
                    <DropdownMenuItem
                      key={type}
                      onSelect={() =>
                        setQuestions((previous) => [
                          ...previous,
                          newQuestion(type),
                        ])
                      }
                    >
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      {QUESTION_TYPE_LABELS[type]}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-row flex-wrap items-center gap-2 border-t px-6 py-4">
          {firstError ? (
            <Badge
              variant="outline"
              className="mr-auto max-w-full truncate border-destructive/40 text-destructive"
              title={firstError}
            >
              {firstError}
            </Badge>
          ) : (
            <span className="mr-auto text-xs text-muted-foreground">
              {nonEmptyQuestions.length}{' '}
              {nonEmptyQuestions.length === 1 ? 'питання' : 'питань'} готово
            </span>
          )}

          <Button type="button" variant="outline" onClick={onClose}>
            Скасувати
          </Button>

          <Button type="button" onClick={handleSave} disabled={!canSave || pending}>
            {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Зберегти чернетку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}