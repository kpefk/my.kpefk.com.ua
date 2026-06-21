'use client'

import {
  Building2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Globe,
  UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/store/auth.store'

import { useSyncUniversity, useUniversity } from '../api'
import { formatAddress, type UniversityDto } from '../types'

function fmtDate(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function fmtDateTime(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || value === '—') return null
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-1.5 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

export function InstitutionClient() {
  const user = useUser()
  const isAdmin = user?.role === 'ADMINISTRATOR'

  const { data: uni, isLoading } = useUniversity()
  const syncMut = useSyncUniversity()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Про заклад</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Дані з ЄДЕБО{uni ? ` • оновлено ${fmtDateTime(uni.syncedAt)}` : ''}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
          >
            {syncMut.isPending ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1.5" />
            )}
            Синхронізувати
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : !uni ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/30" />
            <p className="font-semibold">Інформація про заклад відсутня</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isAdmin
                ? 'Натисніть «Синхронізувати», щоб завантажити дані закладу з ЄДЕБО.'
                : 'Дані ще не синхронізовано з ЄДЕБО.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <InstitutionDetails uni={uni} />
      )}
    </div>
  )
}

function InstitutionDetails({ uni }: { uni: UniversityDto }) {
  const joinedName = [uni.rectorLastName, uni.rectorFirstName, uni.rectorMiddleName]
    .filter(Boolean)
    .join(' ')
  const rectorName = uni.rectorFullName ?? (joinedName || null)

  return (
    <div className="space-y-5">
      {/* Назва + статус */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-snug">{uni.name ?? '—'}</CardTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            {uni.shortName && <Badge variant="secondary">{uni.shortName}</Badge>}
            {uni.educationType && <Badge variant="outline">{uni.educationType}</Badge>}
            {uni.juristicalType === 'Так' && <Badge variant="outline">ВСП</Badge>}
            {uni.isClosed && <Badge variant="destructive">Заблоковано</Badge>}
            {uni.isMilitaryChair && <Badge variant="outline">Військова кафедра</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <Row label="Повна назва (англ.)" value={uni.nameEn} />
          <Row label="Скорочена назва" value={uni.shortName} />
          <Row label="ЄДРПОУ" value={uni.edrpou} />
          <Row label="Код ЄДЕБО" value={uni.universityId} />
          <Row label="Дата заснування" value={fmtDate(uni.registrationDate)} />
          <Row label="Тип закладу" value={uni.universityTypeName} />
          <Row label="Форма власності" value={uni.finansingType} />
          <Row label="Орган управління" value={uni.governanceType} />
          <Row label="Орг.-правова форма" value={uni.orgPravForm} />
          <Row label="Ступінь ризику" value={uni.riskRank} />
          {uni.isClosed && <Row label="Причина блокування" value={uni.closeReason} />}
        </CardContent>
      </Card>

      {/* Адреси */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Адреси
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Row
            label="Місце провадження"
            value={formatAddress(
              uni.postIndex,
              uni.katottgFullName,
              uni.addressStreet,
              uni.houseNumber,
            )}
          />
          <Row
            label="Місцезнаходження"
            value={formatAddress(
              uni.postIndexLegal,
              uni.katottgFullNameU,
              uni.addressStreetLegal,
              uni.houseNumberLegal,
            )}
          />
        </CardContent>
      </Card>

      {/* Контакти */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            Контакти
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Row
            label="Телефон"
            value={
              uni.phoneNumber ? (
                <a href={`tel:${uni.phoneNumber}`} className="hover:text-primary">
                  {uni.phoneNumber}
                </a>
              ) : null
            }
          />
          <Row
            label="Email"
            value={
              uni.email ? (
                <a
                  href={`mailto:${uni.email}`}
                  className="hover:text-primary inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {uni.email}
                </a>
              ) : null
            }
          />
          <Row
            label="Сайт"
            value={
              uni.webSite ? (
                <a
                  href={uni.webSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary inline-flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {uni.webSite}
                </a>
              ) : null
            }
          />
        </CardContent>
      </Card>

      {/* Керівник */}
      {(rectorName || uni.rectorPosition) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserRound className="w-4 h-4 text-primary" />
              Керівник
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="ПІБ" value={rectorName} />
            <Row label="Посада" value={uni.rectorPosition} />
            <Row label="Дата призначення" value={uni.rectorWorkDateStart} />
            <Row label="Дата завершення" value={uni.rectorWorkDateFinish} />
            <Row label="Телефон" value={uni.rectorPhone} />
            <Row label="Email" value={uni.rectorEmail} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
