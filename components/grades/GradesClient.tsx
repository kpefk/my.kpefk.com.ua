'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { mockGradesDetailed } from '@/lib/mock-data'

const GRADE_TYPE_LABEL: Record<string, string> = {
  exam: 'Іспит',
  credit: 'Залік',
  test: 'Контрольна',
  coursework: 'Курсова',
}

function gradeColor(v: number) {
  if (v >= 5) return 'text-green-600 dark:text-green-400'
  if (v >= 4) return 'text-primary'
  return 'text-orange-500'
}

function avgColor(v: number) {
  if (v >= 4.5) return 'text-green-600 dark:text-green-400'
  if (v >= 3.5) return 'text-primary'
  return 'text-orange-500'
}

function SubjectRow({ subject, open, onToggle }: {
  subject: typeof mockGradesDetailed.subjects[number]
  open: boolean
  onToggle: () => void
}) {
  const pct = (subject.average / 5) * 100

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{subject.name}</p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn('text-2xl font-bold tabular-nums', avgColor(subject.average))}>
            {subject.average.toFixed(1)}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border">
              {subject.grades.map((g) => (
                <div key={g.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{GRADE_TYPE_LABEL[g.type] ?? g.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <span className={cn('text-xl font-bold tabular-nums', gradeColor(g.value))}>
                    {g.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GradesClient() {
  const [openId, setOpenId] = useState<string | null>(null)
  const { average, totalSubjects, subjects } = mockGradesDetailed

  const excellent = subjects.filter((s) => s.average >= 4.5).length
  const good = subjects.filter((s) => s.average >= 3.5 && s.average < 4.5).length
  const poor = subjects.filter((s) => s.average < 3.5).length

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Оцінки</h1>
        <p className="text-sm text-muted-foreground mt-1">Поточний семестр</p>
      </div>

      <div className="rounded-2xl bg-primary p-5 sm:p-6 text-primary-foreground flex items-center gap-6">
        <div>
          <p className="text-xs opacity-75 mb-1">Середній бал</p>
          <p className="text-5xl font-black tabular-nums leading-none">{average.toFixed(1)}</p>
        </div>
        <div className="h-12 w-px bg-primary-foreground/20" />
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
          <div>
            <p className="text-xl font-bold">{totalSubjects}</p>
            <p className="text-[11px] opacity-75">Предметів</p>
          </div>
          <div>
            <p className="text-xl font-bold">{excellent}</p>
            <p className="text-[11px] opacity-75">Відмінно</p>
          </div>
          <div>
            <p className="text-xl font-bold">{good}</p>
            <p className="text-[11px] opacity-75">Добре</p>
          </div>
          {poor > 0 && (
            <div>
              <p className="text-xl font-bold">{poor}</p>
              <p className="text-[11px] opacity-75">Задовільно</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {subjects.map((subject) => (
          <SubjectRow
            key={subject.name}
            subject={subject}
            open={openId === subject.name}
            onToggle={() => setOpenId(openId === subject.name ? null : subject.name)}
          />
        ))}
      </div>
    </div>
  )
}
