'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

import { ScheduleResourceViewClient } from './ScheduleResourceViewClient'
import { ScheduleViewClient } from './ScheduleViewClient'

type Tab = 'group' | 'resource'

const TABS: { id: Tab; label: string }[] = [
  { id: 'group', label: 'Розклад групи' },
  { id: 'resource', label: 'Викладач / аудиторія' },
]

/**
 * Головна сторінка розкладу `/schedule`: перемикач між переглядом за групою
 * (ScheduleViewClient) і переглядом за викладачем/аудиторією (§3.10).
 */
export function ScheduleHubClient() {
  const [tab, setTab] = useState<Tab>('group')

  return (
    <div className="flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 print:hidden">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 h-8 text-sm rounded-[5px] transition-colors',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'group' ? (
        <ScheduleViewClient />
      ) : (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Розклад занять</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Завантаженість викладача або аудиторії (ТЗ §3.10)
            </p>
          </div>
          <ScheduleResourceViewClient />
        </div>
      )}
    </div>
  )
}
