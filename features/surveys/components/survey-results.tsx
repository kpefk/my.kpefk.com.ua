'use client'

import { MessageSquareText, ShieldCheck, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import { useSurveyResults } from '../api'
import type { SurveyQuestionResultDto } from '../types'

export function SurveyResults({ surveyId }: { surveyId: string }) {
  const { data, isLoading, error } = useSurveyResults(surveyId)

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />
  if (error !== null || !data) {
    return <p className="text-sm text-destructive p-4">Помилка завантаження результатів</p>
  }

  return (
    <div className="space-y-5">
      {/* Response rate */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Пройшли: {data.totalCompletions} із {data.totalTargets}
            </span>
            {data.isAnonymous && (
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="w-3 h-3" />
                Анонімне
              </Badge>
            )}
          </div>
          <span className="text-lg font-bold tabular-nums">{data.responseRatePercent}%</span>
        </div>
        <Progress value={data.responseRatePercent} />

        {data.byGroup.length > 0 && (
          <div className="grid gap-1.5 pt-1">
            {data.byGroup.map((g) => (
              <div key={g.groupId} className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 font-medium truncate">{g.groupName}</span>
                <Progress
                  value={g.targets > 0 ? Math.round((g.completions / g.targets) * 100) : 0}
                  className="h-1.5"
                />
                <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                  {g.completions}/{g.targets}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions */}
      {data.questions.map((q) => (
        <QuestionResultCard key={q.questionId} q={q} />
      ))}
    </div>
  )
}

function QuestionResultCard({ q }: { q: SurveyQuestionResultDto }) {
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <p className="text-sm font-medium leading-snug">
        {q.order}. {q.text}
        <span className="ml-2 text-xs text-muted-foreground font-normal">
          ({q.answersCount} відп.)
        </span>
      </p>

      {q.type === 'RATING' && q.ratingDistribution && (
        <div className="space-y-1.5">
          <p className="text-2xl font-bold tabular-nums">
            {q.ratingAverage !== null ? q.ratingAverage : '—'}
            <span className="text-sm font-normal text-muted-foreground"> / 5</span>
          </p>
          {q.ratingDistribution.map((count, idx) => {
            const total = q.answersCount || 1
            return (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="w-4 shrink-0 tabular-nums">{idx + 1}</span>
                <Progress value={Math.round((count / total) * 100)} className="h-1.5" />
                <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {q.type === 'YES_NO' && (
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            Так: {q.yesCount ?? 0}
          </span>
          <span className="text-red-600 dark:text-red-400 font-medium">Ні: {q.noCount ?? 0}</span>
        </div>
      )}

      {q.type === 'TEXT' && (
        <div className="space-y-1.5">
          {(q.textAnswers ?? []).map((t, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5 text-sm"
            >
              <MessageSquareText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="whitespace-pre-wrap">{t}</span>
            </div>
          ))}
          {(q.textAnswers ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">Немає текстових відповідей</p>
          )}
        </div>
      )}
    </div>
  )
}
