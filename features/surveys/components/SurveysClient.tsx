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
  const { data: surveys = [], isLoading } = useSurveys()
  const setStatus = useSetSurveyStatus()
  const deleteMut = useDeleteSurvey()

  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<SurveyAdminDto | null>(null)
  const [resultsFor, setResultsFor] = useState<SurveyAdminDto | null>(null)

  function openBuilder(survey: SurveyAdminDto | null) {
    setEditing(survey)
    setBuilderOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Опитування здобувачів</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Внутрішня система забезпечення якості освіти (Ст. 17 Закону №2745-VIII)
          </p>
        </div>
        <Button onClick={() => openBuilder(null)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Нова кампанія
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва</TableHead>
                <TableHead className="w-24 text-center">Статус</TableHead>
                <TableHead className="w-20 text-center">Питань</TableHead>
                <TableHead className="w-24 text-center">Пройшли</TableHead>
                <TableHead className="w-40">Аудиторія</TableHead>
                <TableHead className="w-44 text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {s.title}
                      {s.isAnonymous && (
                        <span title="Анонімне">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        s.status === 'OPEN'
                          ? 'default'
                          : s.status === 'CLOSED'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {SURVEY_STATUS_LABELS[s.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{s.questionCount}</TableCell>
                  <TableCell className="text-center tabular-nums">{s.completionCount}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.targetGroups.length === 0
                      ? 'Всі студенти'
                      : s.targetGroups.map((g) => g.groupName).join(', ')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      {s.status === 'DRAFT' && (
                        <>
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            title="Редагувати"
                            onClick={() => openBuilder(s)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            title="Відкрити для студентів"
                            disabled={s.questionCount === 0 || setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: s.id, status: 'OPEN' })}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-8 w-8 text-destructive"
                            title="Видалити чернетку"
                            disabled={deleteMut.isPending}
                            onClick={() => deleteMut.mutate(s.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {s.status === 'OPEN' && (
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8"
                          title="Закрити опитування"
                          disabled={setStatus.isPending}
                          onClick={() => setStatus.mutate({ id: s.id, status: 'CLOSED' })}
                        >
                          {setStatus.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                      {(s.status === 'OPEN' || s.status === 'CLOSED') && (
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8"
                          title="Результати"
                          onClick={() => setResultsFor(resultsFor?.id === s.id ? null : s)}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {surveys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Кампаній ще немає — створіть першу
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {resultsFor && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Результати: {resultsFor.title}</h2>
          <SurveyResults surveyId={resultsFor.id} />
        </div>
      )}

      <SurveyBuilderDialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        survey={editing}
      />
    </div>
  )
}
