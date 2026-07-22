'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, PlayCircle, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  useAdmissionSettings,
  useAutoRegister,
  useUpdateCampaignSettings,
  useUpdateOfferSettings,
} from '../api'
import type {
  AdmissionOfferSettingRow,
  AdmissionSettings,
  UpdateCampaignSettingsPayload,
} from '../types'
import { AdmissionsGuard } from './admissions-guard'
import { useAdmissionYear } from './use-admission-year'
import { YearSelector } from './year-selector'

export function AdmissionsSettingsClient() {
  return (
    <AdmissionsGuard adminOnly>
      {() => <SettingsView />}
    </AdmissionsGuard>
  )
}

function SettingsView() {
  const { years, year, setYear, selectedCampaign } = useAdmissionYear()
  const { data: settings, isLoading } = useAdmissionSettings(year)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-primary" />
          Налаштування вступу
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Авто-реєстрація заяв (статус «з сайту» → «Зареєстровано») та нумерація справ
        </p>
      </div>

      <YearSelector
        years={years}
        year={year}
        onChange={setYear}
        selectedCampaign={selectedCampaign}
      />

      {isLoading || !settings || year === null ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <>
          <AutomationCard year={year} settings={settings} />
          <OffersCard year={year} offers={settings.offers} />
        </>
      )}
    </div>
  )
}

function AutomationCard({ year, settings }: { year: number; settings: AdmissionSettings }) {
  const updateMut = useUpdateCampaignSettings(year)
  const autoRegisterMut = useAutoRegister()

  const [draft, setDraft] = useState<UpdateCampaignSettingsPayload>({})

  // Скидаємо чернетку при зміні року / приході свіжих даних.
  useEffect(() => {
    setDraft({})
  }, [year])

  const value = <K extends keyof UpdateCampaignSettingsPayload>(
    key: K,
  ): NonNullable<UpdateCampaignSettingsPayload[K]> => {
    const d = draft[key]
    return (d !== undefined ? d : settings[key as keyof AdmissionSettings]) as NonNullable<
      UpdateCampaignSettingsPayload[K]
    >
  }
  const set = <K extends keyof UpdateCampaignSettingsPayload>(
    key: K,
    v: UpdateCampaignSettingsPayload[K],
  ) => setDraft((prev) => ({ ...prev, [key]: v }))

  const dirty = Object.keys(draft).length > 0

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold">Автоматизація</p>
        <Button
          size="sm"
          onClick={() => updateMut.mutate(draft, { onSuccess: () => setDraft({}) })}
          disabled={!dirty || updateMut.isPending}
        >
          {updateMut.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Зберегти
        </Button>
      </div>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 flex gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>
          Авто-реєстрація змінює статус заяв і присвоює номери справ безпосередньо в ЄДЕБО. У
          режимі розробки виконується «сухий прогон» — реальних запитів немає, лише лог розрахованого
          номера.
        </span>
      </div>

      <SwitchRow
        label="Авто-реєстрація"
        hint="Глобально для всіх активних КП: заяви «з сайту» → «Зареєстровано»."
        checked={value('autoRegisterEnabled')}
        onCheckedChange={(v) => set('autoRegisterEnabled', v)}
      />
      <SwitchRow
        label="Автопроставляння номера справи"
        hint="Під час реєстрації присвоювати заяві номер справи (PersonalCode) за суфіксом КП."
        checked={value('autoCaseNumberEnabled')}
        onCheckedChange={(v) => set('autoCaseNumberEnabled', v)}
      />
      <SwitchRow
        label="Частий ресинк заяв"
        hint="Періодично оновлює заяви з ЄДЕБО для коректної нумерації справ."
        checked={value('pollEnabled')}
        onCheckedChange={(v) => set('pollEnabled', v)}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumField
          label="Початок вікна (год)"
          value={value('pollWindowStartHour')}
          min={0}
          max={23}
          onChange={(v) => set('pollWindowStartHour', v)}
        />
        <NumField
          label="Кінець вікна (год)"
          value={value('pollWindowEndHour')}
          min={1}
          max={24}
          onChange={(v) => set('pollWindowEndHour', v)}
        />
        <NumField
          label="Інтервал у вікні (с)"
          value={value('pollIntervalActiveSec')}
          min={10}
          max={86400}
          onChange={(v) => set('pollIntervalActiveSec', v)}
        />
        <NumField
          label="Інтервал поза вікном (с)"
          value={value('pollIntervalOffHoursSec')}
          min={10}
          max={86400}
          onChange={(v) => set('pollIntervalOffHoursSec', v)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Текст реєстрації за замовчуванням</Label>
        <Textarea
          rows={2}
          placeholder="Час та місце проведення творчого конкурсу (фолбек, якщо не задано на КП)"
          value={value('registrationDescryptionDefault') ?? ''}
          onChange={(e) => set('registrationDescryptionDefault', e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap border-t pt-4">
        <span className="text-xs text-muted-foreground">
          Ручний запуск авто-реєстрації для заяв статусу «Заява надійшла з сайту».
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm('Запустити авто-реєстрацію заяв «з сайту» зараз?')) {
              autoRegisterMut.mutate(year)
            }
          }}
          disabled={autoRegisterMut.isPending}
        >
          {autoRegisterMut.isPending ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
          )}
          Зареєструвати зараз
        </Button>
      </div>
    </div>
  )
}

function OffersCard({ year, offers }: { year: number; offers: AdmissionOfferSettingRow[] }) {
  return (
    <div className="rounded-xl border">
      <div className="p-3 border-b">
        <p className="text-sm font-semibold">Конкурсні пропозиції</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Суфікс формує номер справи «NN-суфікс». Текст реєстрації — «Час та місце творчого конкурсу».
        </p>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Конкурсна пропозиція</TableHead>
              <TableHead className="w-20 text-center">З сайту</TableHead>
              <TableHead className="w-28">Суфікс</TableHead>
              <TableHead className="w-72">Текст реєстрації</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o) => (
              <OfferRow key={o.universitySpecialitiesId} year={year} offer={o} />
            ))}
            {offers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Немає конкурсних пропозицій за цей рік
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function OfferRow({ year, offer }: { year: number; offer: AdmissionOfferSettingRow }) {
  const updateMut = useUpdateOfferSettings(year)
  const [suffix, setSuffix] = useState(offer.caseSuffix ?? '')
  const [descr, setDescr] = useState(offer.registrationDescryption ?? '')

  useEffect(() => {
    setSuffix(offer.caseSuffix ?? '')
    setDescr(offer.registrationDescryption ?? '')
  }, [offer.caseSuffix, offer.registrationDescryption])

  const saveSuffix = () => {
    if (suffix.trim() !== (offer.caseSuffix ?? '')) {
      updateMut.mutate({ universitySpecialitiesId: offer.universitySpecialitiesId, caseSuffix: suffix.trim() })
    }
  }
  const saveDescr = () => {
    if (descr.trim() !== (offer.registrationDescryption ?? '')) {
      updateMut.mutate({
        universitySpecialitiesId: offer.universitySpecialitiesId,
        registrationDescryption: descr.trim(),
      })
    }
  }

  return (
    <TableRow>
      <TableCell className="text-sm">{offer.name ?? offer.specialityCode ?? '—'}</TableCell>
      <TableCell className="text-center tabular-nums">
        {offer.siteCount > 0 ? (
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium min-w-6 h-6 px-1.5">
            {offer.siteCount}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Input
          value={suffix}
          onChange={(e) => setSuffix(e.target.value)}
          onBlur={saveSuffix}
          placeholder="напр. Т"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          value={descr}
          onChange={(e) => setDescr(e.target.value)}
          onBlur={saveDescr}
          placeholder="Час та місце творчого конкурсу"
          className="h-8"
        />
      </TableCell>
    </TableRow>
  )
}

function SwitchRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground max-w-md">{hint}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8"
      />
    </div>
  )
}
