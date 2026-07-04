'use client'

import { AlertTriangle, Clock, Users } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { useTeacherLoad } from '../api'
import { teacherFullName, type TeacherLoadEntryDto } from '../types'

// ─── Sticky column layout ─────────────────────────────────────────────────────

const CODE_W = 52
const NAME_W = 180
const NAME_LEFT = CODE_W

// ─── TH / TD primitives ───────────────────────────────────────────────────────

interface CellProps {
  children?: React.ReactNode
  className?: string
  colSpan?: number
  rowSpan?: number
  style?: React.CSSProperties
}

function TH({ children, className, colSpan, rowSpan, style }: CellProps) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={style}
      className={cn(
        'px-2 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap border-b border-border bg-card',
        className,
      )}
    >
      {children}
    </th>
  )
}

function TD({ children, className, colSpan, style }: CellProps) {
  return (
    <td
      colSpan={colSpan}
      style={style}
      className={cn('px-2 py-1.5 text-xs border-b border-border/50', className)}
    >
      {children}
    </td>
  )
}

const DASH = <span className="text-muted-foreground/30">—</span>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number): React.ReactNode {
  return v === 0 ? DASH : <span className="font-mono">{v}</span>
}

/** Форматує дробові години (заліки/екзамени/контрольні) з округленням до 1 знаку. */
function fmtDec(v: number): React.ReactNode {
  if (v === 0) return DASH
  const rounded = Math.round(v * 10) / 10
  return <span className="font-mono">{rounded % 1 === 0 ? rounded : rounded.toFixed(1)}</span>
}

// ─── Column number row ────────────────────────────────────────────────────────

function ColNumbers() {
  // Columns 1-5 are occupied by rowSpan=3 cells from Row 1 (Код, Назва, Сем., Груп, Студ.)
  // This row only needs cells for columns 6-19 (14 cells).
  return (
    <tr>
      {Array.from({ length: 15 }, (_, i) => (
        <td
          key={i + 6}
          className="py-0.5 text-center text-[9px] font-mono text-muted-foreground/50 border-b border-border bg-card"
        >
          {i + 6}
        </td>
      ))}
    </tr>
  )
}

// ─── Teacher block ────────────────────────────────────────────────────────────

function TeacherBlock({ entry }: { entry: TeacherLoadEntryDto }) {
  const { teacher, summary, components } = entry
  const hasWarnings = summary.warnings.length > 0

  const teacherLabel =
    teacher !== null ? teacherFullName(teacher) : 'Без призначеного викладача'

  const subLabel =
    teacher !== null
      ? [teacher.positionName, teacher.skillName, teacher.departmentName]
          .filter((v): v is string => v !== null && v.length > 0)
          .join(' · ')
      : null

  const teacherTotal = components.reduce((s, c) => s + c.totalHours.subtotal, 0)

  return (
    <>
      {/* ── Teacher header ── */}
      <tr>
        <td
          colSpan={20}
          className={cn(
            'px-3 py-1.5 border-b border-border',
            'bg-blue-50/40 dark:bg-blue-950/20',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'text-xs font-semibold',
                  teacher === null && 'text-muted-foreground italic',
                )}
              >
                {teacherLabel}
              </span>
              {subLabel !== null && (
                <span className="text-[10px] text-muted-foreground truncate">{subLabel}</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
              <span
                className={cn(
                  'flex items-center gap-1 font-medium',
                  summary.teachingHoursExceeded
                    ? 'text-destructive'
                    : 'text-foreground/70',
                )}
                title={
                  summary.teachingHoursExceeded
                    ? `Перевищено ліміт ${summary.teachingHoursLimit} год/рік (Ст. 60 №2745-VIII)`
                    : `Навчальне навантаження (ліміт: ${summary.teachingHoursLimit} год)`
                }
              >
                {summary.teachingHoursExceeded && <AlertTriangle className="w-3 h-3" />}
                <Clock className="w-3 h-3" />
                {summary.totalTeachingHours} / {summary.teachingHoursLimit} год
              </span>
              <span className="flex items-center gap-1" title="Кількість дисциплін">
                <Users className="w-3 h-3" />
                {summary.disciplineCount} дисц.
              </span>
              {hasWarnings && !summary.teachingHoursExceeded && (
                <span
                  className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"
                  title={summary.warnings.join('\n')}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {summary.warnings.length} попередж.
                </span>
              )}
            </div>
          </div>

          {hasWarnings && (
            <ul className="mt-0.5 space-y-0.5">
              {summary.warnings.map((w) => (
                <li
                  key={w}
                  className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300"
                >
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          )}
        </td>
      </tr>

      {/* ── Component rows ── */}
      {components.map((c, idx) => {
        const { hoursPerGroup: hpg, totalHours: tot } = c
        return (
          <tr
            key={`${c.componentName}-${c.semesterNumber}-${idx}`}
            className="group transition-colors hover:bg-muted/20"
          >
            {/* Код — sticky */}
            <TD
              className="sticky z-[1] font-mono text-muted-foreground border-r border-border/30 bg-background group-hover:bg-muted/20 transition-colors"
              style={{ left: 0, width: CODE_W }}
            >
              {c.componentCode ?? ''}
            </TD>

            {/* Назва — sticky */}
            <TD
              className="sticky z-[1] border-r border-border/30 bg-background group-hover:bg-muted/20 transition-colors"
              style={{ left: NAME_LEFT, minWidth: NAME_W }}
            >
              {c.componentName}
            </TD>

            {/* Семестр */}
            <TD className="text-center font-mono text-muted-foreground">{c.semesterNumber}</TD>

            {/* Груп */}
            <TD className="text-center font-mono text-muted-foreground">{c.groupCount}</TD>

            {/* Студ. */}
            <TD className="text-center font-mono text-muted-foreground border-r border-border/30">
              {c.studentCount}
            </TD>

            {/* Годин на 1 групу */}
            <TD className="text-center">{fmt(hpg.lecture)}</TD>
            <TD className="text-center">{fmt(hpg.practicalLab)}</TD>
            <TD className="text-center">{fmt(hpg.seminar)}</TD>
            <TD className="text-center">{fmt(hpg.independent)}</TD>
            <TD className="text-center border-r border-border/30">{fmt(hpg.examPrep)}</TD>

            {/* Разом годин */}
            <TD className="text-center">{fmt(tot.lecture)}</TD>
            <TD className="text-center">{fmt(tot.practicalLab)}</TD>
            <TD className="text-center">{fmt(tot.seminar)}</TD>
            <TD className="text-center">{fmt(tot.independent)}</TD>
            <TD className="text-center">{fmt(tot.examPrep)}</TD>
            <TD className="text-center">{fmtDec(tot.controlAndExam)}</TD>
            <TD className="text-center">{fmtDec(tot.practiceSupervision)}</TD>
            <TD className="text-center">{fmtDec(tot.courseWorkSupervision)}</TD>
            <TD className="text-center">{fmtDec(tot.diplomaCommittee)}</TD>

            {/* Разом — highlighted */}
            <TD
              className={cn(
                'text-center font-mono font-semibold',
                tot.subtotal > 0
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-muted-foreground/30',
              )}
            >
              {fmt(tot.subtotal)}
            </TD>
          </tr>
        )
      })}

      {/* ── Teacher subtotal ── */}
      <tr className="bg-muted/30">
        <TD
          colSpan={19}
          className="text-right text-muted-foreground font-medium pr-3 border-t border-border/50"
        >
          Разом по викладачу:
        </TD>
        <TD className="text-center font-mono font-semibold text-blue-700 dark:text-blue-400 border-t border-border/50">
          {fmt(teacherTotal)}
        </TD>
      </tr>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeacherLoadTable({ workingCurriculumId }: { workingCurriculumId: string }) {
  const { data, isLoading, error } = useTeacherLoad(workingCurriculumId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (error !== null || data === undefined) {
    return (
      <div className="p-4 text-sm text-destructive">
        Помилка завантаження навантаження
      </div>
    )
  }

  if (data.teachers.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Жодного компонента не знайдено у цьому робочому плані.
      </div>
    )
  }

  const grandTotal = data.teachers.reduce(
    (s, e) => s + e.components.reduce((cs, c) => cs + c.totalHours.subtotal, 0),
    0,
  )

  return (
    <div className="overflow-auto">
      {/* Meta line */}
      <div className="text-[10px] text-muted-foreground px-3 py-1.5 border-b border-border bg-muted/20">
        Сформовано: {new Date(data.generatedAt).toLocaleString('uk-UA')} · Навч. рік:{' '}
        {data.academicYear}
      </div>

      <table className="w-full border-separate border-spacing-0 text-xs">
        <thead className="sticky top-0 z-20">
          {/* Row 1 — top group labels */}
          <tr>
            <TH
              rowSpan={3}
              className="sticky z-30 border-r border-border text-center"
              style={{ left: 0, width: CODE_W }}
            >
              Код
            </TH>
            <TH
              rowSpan={3}
              className="sticky z-30 border-r border-border text-left"
              style={{ left: NAME_LEFT, minWidth: NAME_W }}
            >
              Назва компонента
            </TH>
            <TH rowSpan={3} className="text-center [writing-mode:vertical-rl] rotate-180 w-7">
              Сем.
            </TH>
            <TH rowSpan={3} className="text-center [writing-mode:vertical-rl] rotate-180 w-7">
              Груп
            </TH>
            <TH
              rowSpan={3}
              className="text-center border-r border-border/50 [writing-mode:vertical-rl] rotate-180 w-7"
            >
              Студ.
            </TH>
            <TH colSpan={5} className="text-center border-x border-border/50 border-b-0">
              Годин на 1 групу
            </TH>
            <TH colSpan={10} className="text-center border-b-0">
              Разом годин (навантаження)
            </TH>
          </tr>

          {/* Row 2 — sub-column labels (vertical) */}
          <tr>
            {/* Per-group — 5 */}
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">Лекц.</TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">Практ./Лаб.</TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">Семін.</TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">СПРС</TH>
            <TH className="text-center border-r border-border/50 [writing-mode:vertical-rl] rotate-180 w-8">
              Підгот.
            </TH>
            {/* Total — 9 */}
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">Лекц.</TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">Практ./Лаб.</TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">Семін.</TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">СПРС</TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">Підгот.</TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">
              <span title="Заліки/екзамени + перевірка контрольних робіт (Наказ МОН №686, п.11/12/14/16)" className="cursor-default">
                Зал/Екз/Контр.
              </span>
            </TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">
              <span title="Керівництво практикою (Наказ МОН №686, п.17/18)" className="cursor-default">
                Практика
              </span>
            </TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">
              <span title="Керівництво курсовими роботами/проєктами (Наказ МОН №686, п.13)" className="cursor-default">
                Курсова/проєкт
              </span>
            </TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-8">
              <span title="Комісія захисту дипломних робіт (Наказ МОН №686, п.20)" className="cursor-default">
                Комісія (захист)
              </span>
            </TH>
            <TH className="text-center [writing-mode:vertical-rl] rotate-180 w-10 font-bold text-foreground">
              Разом
            </TH>
          </tr>

          {/* Row 3 — column numbers */}
          <ColNumbers />
        </thead>

        <tbody>
          {data.teachers.map((entry, idx) => (
            <TeacherBlock key={entry.teacher?.id ?? `unassigned-${idx}`} entry={entry} />
          ))}
        </tbody>

        {/* Grand total */}
        <tfoot>
          <tr className="bg-muted/40">
            <TD
              colSpan={19}
              className="font-semibold text-right pr-3 border-t-2 border-border"
            >
              Загальне навантаження
            </TD>
            <TD className="text-center font-mono font-bold text-blue-800 dark:text-blue-300 border-t-2 border-border">
              {fmt(grandTotal)}
            </TD>
          </tr>
        </tfoot>
      </table>

      <p className="text-[9px] text-muted-foreground/60 px-3 py-1.5">
        Норми: Закон №2745-VIII Ст. 60 · Наказ МОН №686 від 18.06.2021
      </p>
    </div>
  )
}
