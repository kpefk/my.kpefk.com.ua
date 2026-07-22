'use client'

import { useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Lock,
  Pencil,
  Play,
  Plus,
  ShieldCheck,
  Square,
  Trash2,
  Undo2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useUser } from '@/store/auth.store'

import {
  useDeleteSurvey,
  useMySurveys,
  useSetSurveyStatus,
  useSurveys,
} from '../api'
import type { StudentSurveyDto, SurveyAdminDto } from '../types'
import { SURVEY_STATUS_LABELS } from '../types'

import { SurveyBuilderDialog } from './survey-builder-dialog'
import { SurveyResults } from './survey-results'
import { SurveyTakeForm } from './survey-take-form'

const MANAGE_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

export function SurveysClient() {
  const user = useUser()

  if (!user) return <Skeleton className="h-64 w-full" />

  if (user.role === 'STUDENT') return <StudentSurveysView />
  if (MANAGE_ROLES.includes(user.role)) return <AdminSurveysView />

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
      <Lock className="w-8 h-8 text-muted-foreground" />
      <p className="font-semibold">Доступ обмежено</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Опитування доступні студентам (проходження) та керівництву (адміністрування).
      </p>
    </div>
  )
}

// ─── Student view ─────────────────────────────────────────────────────────────

function StudentSurveysView() {
  const { data: surveys = [], isLoading } = useMySurveys()
  const [active, setActive] = useState<StudentSurveyDto | null>(null)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Опитування</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Ваша думка допомагає покращувати якість освіти
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : surveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
          <ClipboardList className="w-10 h-10 opacity-30" />
          <p className="text-sm">Наразі немає відкритих опитувань</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((s) => (
            <div key={s.id} className="rounded-xl border p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium leading-snug">{s.title}</h3>
                {s.isAnonymous && (
                  <span title="Анонімне опитування">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                  </span>
                )}
              </div>
              {s.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">{s.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {s.questions.length} питань
                  {s.closesAt &&
                    ` · до ${new Date(s.closesAt).toLocaleDateString('uk-UA')}`}
                </span>
                {s.completed ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Пройдено
                  </Badge>
                ) : (
                  <Button size="sm" onClick={() => setActive(s)}>
                    Пройти
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SurveyTakeForm survey={active} onClose={() => setActive(null)} />
    </div>
  )
}

// ─── Admin view ───────────────────────────────────────────────────────────────

function AdminSurveysView() {
  const user = useUser()
  const { data: surveys = [], isLoading } = useSurveys()
  const setStatus = useSetSurveyStatus()
  const deleteMut = useDeleteSurvey()

  const isAdministrator = user?.role === 'ADMINISTRATOR'

  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<SurveyAdminDto | null>(null)
  const [resultsFor, setResultsFor] = useState<SurveyAdminDto | null>(null)

  function openBuilder(survey: SurveyAdminDto | null) {
    setEditing(survey)
    setBuilderOpen(true)
  }

  function revertToDraft(survey: SurveyAdminDto) {
    if (
      survey.completionCount > 0 &&
      !window.confirm(
        `У кампанії вже ${survey.completionCount} проходжень. Повернення в чернетку дозволить ` +
          'редагувати питання, що може знецінити зібрані відповіді. Продовжити?',
      )
    ) {
      return
    }

    setStatus.mutate({
      id: survey.id,
      status: 'DRAFT',
    })
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Опитування здобувачів
            </h1>

            <p className="mt-0.5 text-sm text-muted-foreground">
              Внутрішня система забезпечення якості освіти
            </p>
          </div>

          <Button onClick={() => openBuilder(null)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Нова кампанія
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px] table-fixed">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[32%] min-w-[220px]">
                      Назва
                    </TableHead>

                    <TableHead className="w-28 text-center">
                      Статус
                    </TableHead>

                    <TableHead className="w-20 text-center">
                      Питань
                    </TableHead>

                    <TableHead className="w-24 text-center">
                      Пройшли
                    </TableHead>

                    <TableHead className="w-[24%] min-w-[180px]">
                      Аудиторія
                    </TableHead>

                    <TableHead className="w-40 text-right">
                      Дії
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {surveys.map((survey) => {
                    const audience =
                      survey.targetGroups.length === 0
                        ? 'Всі активні студенти'
                        : survey.targetGroups
                            .map((group) => group.groupName)
                            .join(', ')

                    const isStatusPending = setStatus.isPending
                    const isDeletePending = deleteMut.isPending

                    return (
                      <TableRow key={survey.id} className="group">
                        <TableCell className="overflow-hidden py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="flex w-full min-w-0 items-center gap-2 text-left outline-none"
                              >
                                <span className="truncate font-medium transition-colors group-hover:text-primary">
                                  {survey.title}
                                </span>

                                {survey.isAnonymous && (
                                  <span className="shrink-0 text-emerald-500">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    <span className="sr-only">
                                      Анонімне опитування
                                    </span>
                                  </span>
                                )}
                              </button>
                            </TooltipTrigger>

                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-sm break-words"
                            >
                              <p>{survey.title}</p>

                              {survey.isAnonymous && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Анонімне опитування
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant={
                              survey.status === 'OPEN'
                                ? 'default'
                                : survey.status === 'CLOSED'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="whitespace-nowrap"
                          >
                            {SURVEY_STATUS_LABELS[survey.status]}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="tabular-nums">
                            {survey.questionCount}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="tabular-nums">
                            {survey.completionCount}
                          </span>
                        </TableCell>

                        <TableCell className="overflow-hidden">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="block w-full truncate text-left text-xs text-muted-foreground outline-none"
                              >
                                {audience}
                              </button>
                            </TooltipTrigger>

                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-sm break-words"
                            >
                              {audience}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            {survey.status === 'DRAFT' && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => openBuilder(survey)}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Редагувати
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Редагувати</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                      disabled={
                                        survey.questionCount === 0 ||
                                        isStatusPending
                                      }
                                      onClick={() =>
                                        setStatus.mutate({
                                          id: survey.id,
                                          status: 'OPEN',
                                        })
                                      }
                                    >
                                      {isStatusPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Play className="h-3.5 w-3.5" />
                                      )}

                                      <span className="sr-only">
                                        Відкрити для студентів
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {survey.questionCount === 0
                                      ? 'Додайте хоча б одне питання'
                                      : 'Відкрити для студентів'}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      disabled={isDeletePending}
                                      onClick={() =>
                                        deleteMut.mutate(survey.id)
                                      }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Видалити чернетку
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Видалити чернетку
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}

                            {survey.status === 'OPEN' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    disabled={isStatusPending}
                                    onClick={() =>
                                      setStatus.mutate({
                                        id: survey.id,
                                        status: 'CLOSED',
                                      })
                                    }
                                  >
                                    {isStatusPending ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Square className="h-3.5 w-3.5" />
                                    )}

                                    <span className="sr-only">
                                      Закрити опитування
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Закрити опитування
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {(survey.status === 'OPEN' ||
                              survey.status === 'CLOSED') && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant={
                                      resultsFor?.id === survey.id
                                        ? 'secondary'
                                        : 'ghost'
                                    }
                                    className="h-8 w-8"
                                    onClick={() =>
                                      setResultsFor(
                                        resultsFor?.id === survey.id
                                          ? null
                                          : survey,
                                      )
                                    }
                                  >
                                    <BarChart3 className="h-3.5 w-3.5" />
                                    <span className="sr-only">
                                      Показати результати
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {resultsFor?.id === survey.id
                                    ? 'Сховати результати'
                                    : 'Показати результати'}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {isAdministrator &&
                              survey.status !== 'DRAFT' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      disabled={isStatusPending}
                                      onClick={() => revertToDraft(survey)}
                                    >
                                      <Undo2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Повернути в чернетку
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Повернути в чернетку
                                  </TooltipContent>
                                </Tooltip>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {surveys.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="h-8 w-8 opacity-30" />
                          <p className="text-sm">
                            Кампаній ще немає — створіть першу
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {resultsFor && (
          <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-2">
              <BarChart3 className="h-5 w-5 shrink-0 text-primary" />

              <h2 className="truncate text-lg font-semibold">
                Результати: {resultsFor.title}
              </h2>
            </div>

            <SurveyResults surveyId={resultsFor.id} />
          </section>
        )}

        <SurveyBuilderDialog
          open={builderOpen}
          onClose={() => setBuilderOpen(false)}
          survey={editing}
        />
      </div>
    </TooltipProvider>
  )
}
