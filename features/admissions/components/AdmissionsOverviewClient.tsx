'use client'

import { useMemo, useState } from 'react'
import { Archive, Download, Loader2, RefreshCw, UserPlus } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  useAdmissionByDay,
  useAdmissionBySpeciality,
  useAdmissionOffers,
  useAdmissionOverview,
  useAdmissionTrends,
  useArchiveAdmissionYear,
  useKonkursDistribution,
  useSyncAdmissions,
} from '../api'
import { AdmissionsGuard } from './admissions-guard'
import { useAdmissionYear } from './use-admission-year'
import { YearSelector } from './year-selector'

const CHART_COLOR = 'var(--primary)'
const ENROLLED_COLOR = '#16a34a'
const CANCELLED_COLOR = '#dc2626'
/** Палітра для серій ОПП на графіку подання по днях. */
const SERIES_COLORS = [
  'var(--primary)',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

export function AdmissionsOverviewClient() {
  return (
    <AdmissionsGuard>
      {({ isAdministrator }) => <OverviewView isAdministrator={isAdministrator} />}
    </AdmissionsGuard>
  )
}

function OverviewView({ isAdministrator }: { isAdministrator: boolean }) {
  const { years, yearsLoading, year, setYear, selectedCampaign } = useAdmissionYear()
  const [syncYear, setSyncYear] = useState(new Date().getFullYear())

  const syncMut = useSyncAdmissions()
  const archiveMut = useArchiveAdmissionYear()

  const { data: overview } = useAdmissionOverview(year)
  const { data: bySpeciality = [] } = useAdmissionBySpeciality(year)
  const { data: byDay } = useAdmissionByDay(year)
  const { data: offers = [] } = useAdmissionOffers(year)
  const { data: konkurs } = useKonkursDistribution(year)
  const { data: trends = [] } = useAdmissionTrends()

  const specialityChart = useMemo(
    () =>
      bySpeciality.slice(0, 12).map((s) => ({
        name: (s.programName ?? s.specialityName).slice(0, 18),
        Заяви: s.applicationsCount,
        Зараховано: s.enrolledCount,
        Скасовано: s.cancelledCount,
      })),
    [bySpeciality],
  )

  const dailyPrograms = byDay?.programs ?? []
  const dailyChart = useMemo(() => {
    if (!byDay) return []
    return byDay.points.map((p) => {
      const row: Record<string, number | string> = { name: p.date.slice(5) }
      for (const prog of byDay.programs) row[prog] = p.counts[prog] ?? 0
      return row
    })
  }, [byDay])
  const konkursChart = useMemo(
    () => (konkurs?.buckets ?? []).map((b) => ({ name: `${b.from}–${b.to}`, Кількість: b.count })),
    [konkurs],
  )
  const trendChart = useMemo(
    () =>
      trends.map((t) => ({
        name: String(t.admissionYear),
        Заяви: t.applicationsCount,
        Зараховано: t.enrolledCount,
      })),
    [trends],
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Вступна кампанія
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Аналітика конкурсних пропозицій і заяв вступників (ЄДЕБО)
          </p>
        </div>

        {isAdministrator && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Рік для синхронізації</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={syncYear}
                onChange={(e) => setSyncYear(Number(e.target.value))}
                className="h-9 w-24"
              />
              <Button onClick={() => syncMut.mutate(syncYear)} disabled={syncMut.isPending}>
                {syncMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                )}
                Синхронізувати
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <YearSelector
          years={years}
          year={year}
          onChange={setYear}
          selectedCampaign={selectedCampaign}
        />
        <div className="flex-1" />
        {isAdministrator && selectedCampaign?.status === 'ACTIVE' && (
          <Button
            variant="outline"
            onClick={() => {
              if (
                window.confirm(
                  `Архівувати ${year}? Персональні дані заяв (ПІБ/контакти/документи) буде ` +
                    'безповоротно вичищено. Звітні поля лишаться.',
                )
              ) {
                archiveMut.mutate(year!)
              }
            }}
            disabled={archiveMut.isPending}
          >
            <Archive className="w-4 h-4 mr-1.5" />
            Архівувати рік
          </Button>
        )}
      </div>

      {yearsLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : years.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
          <Download className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            Даних ще немає. {isAdministrator ? 'Синхронізуйте рік з ЄДЕБО.' : ''}
          </p>
        </div>
      ) : (
        <>
          {overview && (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
              <Kpi label="Конкурсних пропозицій" value={overview.offersCount} />
              <Kpi label="Заяв" value={overview.applicationsCount} />
              <Kpi label="Зараховано" value={overview.enrolledCount} />
              <Kpi label="Середній конкурсний бал" value={overview.averageKonkurs ?? '—'} />
              <Kpi
                label="Претендують на бюджет"
                value={overview.budgetContract.budget + overview.budgetContract.both}
              />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Заяви по ОПП (топ-12)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={specialityChart} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} height={50} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Заяви" fill={CHART_COLOR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Зараховано" fill={ENROLLED_COLOR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Скасовано" fill={CANCELLED_COLOR} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Розподіл конкурсних балів">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={konkursChart} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="Кількість" radius={[3, 3, 0, 0]}>
                    {konkursChart.map((_, i) => (
                      <Cell key={i} fill={CHART_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Динаміка за роками">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendChart} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Заяви" stroke={CHART_COLOR} strokeWidth={2} />
                  <Line type="monotone" dataKey="Зараховано" stroke={ENROLLED_COLOR} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {overview && (
              <ChartCard title="Воронка вступу">
                <div className="flex flex-col gap-2 py-2">
                  <FunnelBar label="Подано заяв" value={overview.funnel.submitted} max={overview.funnel.submitted} />
                  <FunnelBar label="Рекомендовано на бюджет" value={overview.funnel.recommendedBudget} max={overview.funnel.submitted} />
                  <FunnelBar label="Виконали вимоги" value={overview.funnel.requirementsMet} max={overview.funnel.submitted} />
                  <FunnelBar label="Зараховано" value={overview.funnel.enrolled} max={overview.funnel.submitted} color={ENROLLED_COLOR} />
                </div>
              </ChartCard>
            )}
          </div>

          <ChartCard title="Подано заяв по днях (за ОПП)">
            {dailyChart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Даних немає</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dailyChart} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {dailyPrograms.map((prog, i) => (
                    <Line
                      key={prog}
                      type="monotone"
                      dataKey={prog}
                      stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Код</TableHead>
                  <TableHead>Пропозиція</TableHead>
                  <TableHead className="w-28">Форма</TableHead>
                  <TableHead className="w-20 text-center">Бюджет</TableHead>
                  <TableHead className="w-24 text-center">Заяв</TableHead>
                  <TableHead className="w-24 text-center">Зарах.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((o) => (
                  <TableRow key={o.universitySpecialitiesId}>
                    <TableCell className="font-mono text-xs">{o.specialityCode}</TableCell>
                    <TableCell className="text-sm">{o.name ?? o.specialityName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.educationFormName}</TableCell>
                    <TableCell className="text-center tabular-nums">{o.budgetOrder ?? '—'}</TableCell>
                    <TableCell className="text-center tabular-nums">{o.applicationsCount}</TableCell>
                    <TableCell className="text-center tabular-nums">{o.enrolledCount}</TableCell>
                  </TableRow>
                ))}
                {offers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Немає конкурсних пропозицій за цей рік
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm font-medium mb-3">{title}</p>
      {children}
    </div>
  )
}

function FunnelBar({
  label,
  value,
  max,
  color = 'var(--primary)',
}: {
  label: string
  value: number
  max: number
  color?: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
